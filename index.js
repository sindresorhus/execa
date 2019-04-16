'use strict';
const path = require('path');
const os = require('os');
const childProcess = require('child_process');
const crossSpawn = require('cross-spawn');
const stripFinalNewline = require('strip-final-newline');
const npmRunPath = require('npm-run-path');
const isStream = require('is-stream');
const _getStream = require('get-stream');
const mergeStream = require('merge-stream');
const pFinally = require('p-finally');
const onExit = require('signal-exit');
const errname = require('./lib/errname');
const stdio = require('./lib/stdio');

const TEN_MEGABYTES = 1000 * 1000 * 10;

function handleArgs(command, args, options) {
	const parsed = crossSpawn._parse(command, args, options);
	command = parsed.command;
	args = parsed.args;
	options = parsed.options;

	options = {
		maxBuffer: TEN_MEGABYTES,
		buffer: true,
		stripFinalNewline: true,
		preferLocal: true,
		localDir: options.cwd || process.cwd(),
		encoding: 'utf8',
		reject: true,
		cleanup: true,
		...options,
		windowsHide: true
	};

	if (options.extendEnv !== false) {
		options.env = {
			...process.env,
			...options.env
		};
	}

	if (options.preferLocal) {
		options.env = npmRunPath.env({
			...options,
			cwd: options.localDir
		});
	}

	// TODO: Remove in the next major release
	if (options.stripEof === false) {
		options.stripFinalNewline = false;
	}

	options.stdio = stdio(options);

	if (options.detached) {
		// #115
		options.cleanup = false;
	}

	if (process.platform === 'win32' && path.basename(command, '.exe') === 'cmd') {
		// #116
		args.unshift('/q');
	}

	return {command, args, options, parsed};
}

function handleInput(spawned, input) {
	if (input === null || input === undefined) {
		return;
	}

	if (isStream(input)) {
		input.pipe(spawned.stdin);
	} else {
		spawned.stdin.end(input);
	}
}

function handleOutput(options, value) {
	if (value && options.stripFinalNewline) {
		value = stripFinalNewline(value);
	}

	return value;
}

function handleShell(fn, command, options) {
	return fn(command, {...options, shell: true});
}

function makeAllStream(spawned) {
	if (!spawned.stdout && !spawned.stderr) {
		return;
	}

	const mixed = mergeStream();

	if (spawned.stdout) {
		mixed.add(spawned.stdout);
	}

	if (spawned.stderr) {
		mixed.add(spawned.stderr);
	}

	return mixed;
}

function getStream(process, stream, {encoding, buffer, maxBuffer}) {
	if (!process[stream]) {
		return;
	}

	let ret;

	if (!buffer) {
		// TODO: Use `ret = util.promisify(stream.finished)(process[stream]);` when targeting Node.js 10
		ret = new Promise((resolve, reject) => {
			process[stream]
				.once('end', resolve)
				.once('error', reject);
		});
	} else if (encoding) {
		ret = _getStream(process[stream], {
			encoding,
			maxBuffer
		});
	} else {
		ret = _getStream.buffer(process[stream], {maxBuffer});
	}

	return ret.catch(error => {
		error.stream = stream;
		error.message = `${stream} ${error.message}`;
		throw error;
	});
}

function makeError(result, options) {
	const {stdout, stderr, code, signal} = result;
	let {error} = result;
	const {joinedCommand, timedOut, isCanceled, parsed: {options: {timeout}}} = options;

	const [exitCodeName, exitCode] = getCode(result, code);

	if (!(error instanceof Error)) {
		const message = [joinedCommand, stderr, stdout].filter(Boolean).join('\n');
		error = new Error(message);
	}

	const prefix = getErrorPrefix({timedOut, timeout, signal, exitCodeName, exitCode, isCanceled});
	error.message = `Command ${prefix}: ${error.message}`;

	error.code = exitCode || exitCodeName;
	error.exitCode = exitCode;
	error.exitCodeName = exitCodeName;
	error.stdout = stdout;
	error.stderr = stderr;
	error.failed = true;
	// `signal` emitted on `spawned.on('exit')` event can be `null`. We normalize
	// it to `undefined`
	error.signal = signal || undefined;
	error.command = joinedCommand;
	error.timedOut = Boolean(timedOut);
	error.isCanceled = isCanceled;

	if ('all' in result) {
		error.all = result.all;
	}

	return error;
}

function getCode({error = {}}, code) {
	if (error.code) {
		return [error.code, os.constants.errno[error.code]];
	}

	if (Number.isInteger(code)) {
		return [errname(-Math.abs(code)), Math.abs(code)];
	}

	return [];
}

function getErrorPrefix({timedOut, timeout, signal, exitCodeName, exitCode, isCanceled}) {
	if (timedOut) {
		return `timed out after ${timeout} milliseconds`;
	}

	if (isCanceled) {
		return 'was canceled';
	}

	if (signal) {
		return `was killed with ${signal}`;
	}

	if (exitCodeName !== undefined && exitCode !== undefined) {
		return `failed with exit code ${exitCode} (${exitCodeName})`;
	}

	if (exitCodeName !== undefined) {
		return `failed with exit code ${exitCodeName}`;
	}

	if (exitCode !== undefined) {
		return `failed with exit code ${exitCode}`;
	}

	return 'failed';
}

function joinCommand(command, args) {
	let joinedCommand = command;

	if (Array.isArray(args) && args.length > 0) {
		joinedCommand += ' ' + args.join(' ');
	}

	return joinedCommand;
}

const execa = (command, args, options) => {
	const parsed = handleArgs(command, args, options);
	const {encoding, buffer, maxBuffer} = parsed.options;
	const joinedCommand = joinCommand(command, args);

	let spawned;
	try {
		spawned = childProcess.spawn(parsed.command, parsed.args, parsed.options);
	} catch (error) {
		return Promise.reject(error);
	}

	let removeExitHandler;
	if (parsed.options.cleanup) {
		removeExitHandler = onExit(() => {
			spawned.kill();
		});
	}

	let timeoutId;
	let timedOut = false;
	let isCanceled = false;

	const cleanup = () => {
		if (timeoutId !== undefined) {
			clearTimeout(timeoutId);
			timeoutId = undefined;
		}

		if (removeExitHandler) {
			removeExitHandler();
		}
	};

	if (parsed.options.timeout > 0) {
		timeoutId = setTimeout(() => {
			timeoutId = undefined;
			timedOut = true;
			spawned.kill(parsed.options.killSignal);
		}, parsed.options.timeout);
	}

	const resolvable = (() => {
		let extracted;
		const promise = new Promise(resolve => {
			extracted = resolve;
		});
		promise.resolve = extracted;
		return promise;
	})();

	const processDone = new Promise(resolve => {
		spawned.on('exit', (code, signal) => {
			cleanup();

			if (timedOut) {
				resolvable.resolve([
					{code, signal}, '', '', ''
				]);
			}

			resolve({code, signal});
		});

		spawned.on('error', error => {
			cleanup();
			resolve({error});
		});

		if (spawned.stdin) {
			spawned.stdin.on('error', error => {
				cleanup();
				resolve({error});
			});
		}
	});

	function destroy() {
		if (spawned.stdout) {
			spawned.stdout.destroy();
		}

		if (spawned.stderr) {
			spawned.stderr.destroy();
		}

		if (spawned.all) {
			spawned.all.destroy();
		}
	}

	const handlePromise = () => {
		let processComplete = Promise.all([
			processDone,
			getStream(spawned, 'stdout', {encoding, buffer, maxBuffer}),
			getStream(spawned, 'stderr', {encoding, buffer, maxBuffer}),
			getStream(spawned, 'all', {encoding, buffer, maxBuffer: maxBuffer * 2})
		]);

		if (timeoutId) {
			processComplete = Promise.race([
				processComplete,
				resolvable
			]);
		}

		const finalize = async () => {
			const results = await processComplete;

			const result = results[0];
			result.stdout = results[1];
			result.stderr = results[2];
			result.all = results[3];

			if (result.error || result.code !== 0 || result.signal !== null || isCanceled) {
				const error = makeError(result, {
					joinedCommand,
					parsed,
					timedOut,
					isCanceled
				});

				// TODO: missing some timeout logic for killed
				// https://github.com/nodejs/node/blob/master/lib/child_process.js#L203
				// error.killed = spawned.killed || killed;
				error.killed = error.killed || spawned.killed;

				if (!parsed.options.reject) {
					return error;
				}

				throw error;
			}

			return {
				stdout: handleOutput(parsed.options, result.stdout),
				stderr: handleOutput(parsed.options, result.stderr),
				all: handleOutput(parsed.options, result.all),
				code: 0,
				exitCode: 0,
				exitCodeName: 'SUCCESS',
				failed: false,
				killed: false,
				command: joinedCommand,
				timedOut: false,
				isCanceled: false
			};
		};

		// TODO: Use native "finally" syntax when targeting Node.js 10
		return pFinally(finalize(), destroy);
	};

	crossSpawn._enoent.hookChildProcess(spawned, parsed.parsed);

	handleInput(spawned, parsed.options.input);

	spawned.all = makeAllStream(spawned);

	// eslint-disable-next-line promise/prefer-await-to-then
	spawned.then = (onFulfilled, onRejected) => handlePromise().then(onFulfilled, onRejected);
	spawned.catch = onRejected => handlePromise().catch(onRejected);
	spawned.cancel = () => {
		if (spawned.killed) {
			return;
		}

		if (spawned.kill()) {
			isCanceled = true;
		}
	};

	// TOOD: Remove the `if`-guard when targeting Node.js 10
	if (Promise.prototype.finally) {
		spawned.finally = onFinally => handlePromise().finally(onFinally);
	}

	return spawned;
};

module.exports = execa;

// TODO: set `stderr: 'ignore'` when that option is implemented
module.exports.stdout = async (...args) => {
	const {stdout} = await execa(...args);
	return stdout;
};

// TODO: set `stdout: 'ignore'` when that option is implemented
module.exports.stderr = async (...args) => {
	const {stderr} = await execa(...args);
	return stderr;
};

module.exports.shell = (command, options) => handleShell(execa, command, options);

module.exports.sync = (command, args, options) => {
	const parsed = handleArgs(command, args, options);
	const joinedCommand = joinCommand(command, args);

	if (isStream(parsed.options.input)) {
		throw new TypeError('The `input` option cannot be a stream in sync mode');
	}

	const result = childProcess.spawnSync(parsed.command, parsed.args, parsed.options);
	result.code = result.status;

	if (result.error || result.status !== 0 || result.signal !== null) {
		const error = makeError(result, {
			joinedCommand,
			parsed
		});

		if (!parsed.options.reject) {
			return error;
		}

		throw error;
	}

	return {
		stdout: handleOutput(parsed.options, result.stdout),
		stderr: handleOutput(parsed.options, result.stderr),
		code: 0,
		exitCode: 0,
		exitCodeName: 'SUCCESS',
		failed: false,
		command: joinedCommand,
		timedOut: false
	};
};

module.exports.shellSync = (command, options) => handleShell(execa.sync, command, options);
