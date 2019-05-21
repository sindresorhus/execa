'use strict';
const path = require('path');
const os = require('os');
const util = require('util');
const childProcess = require('child_process');
const crossSpawn = require('cross-spawn');
const stripFinalNewline = require('strip-final-newline');
const npmRunPath = require('npm-run-path');
const isStream = require('is-stream');
const _getStream = require('get-stream');
const mergeStream = require('merge-stream');
const pFinally = require('p-finally');
const onExit = require('signal-exit');
const stdio = require('./lib/stdio');

const TEN_MEGABYTES = 1000 * 1000 * 10;

const SPACES_REGEXP = / +/g;

// Allow spaces to be escaped by a backslash if not meant as a delimiter
function handleEscaping(tokens, token, index) {
	if (index === 0) {
		return [token];
	}

	const previousToken = tokens[tokens.length - 1];

	if (previousToken.endsWith('\\')) {
		return [...tokens.slice(0, -1), `${previousToken.slice(0, -1)} ${token}`];
	}

	return [...tokens, token];
}

function parseCommand(command) {
	return command
		.trim()
		.split(SPACES_REGEXP)
		.reduce(handleEscaping, []);
}

function handleArgs(command, args, options = {}) {
	if (args && !Array.isArray(args) && typeof args === 'object') {
		options = args;
	}

	if (!options.shell && command.includes(' ') && !Array.isArray(args)) {
		[command, ...args] = parseCommand(command);
	}

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

	options.stdio = stdio(options);

	if (process.platform === 'win32' && path.basename(command, '.exe') === 'cmd') {
		// #116
		args.unshift('/q');
	}

	return {command, args, options, parsed};
}

function handleInput(spawned, input) {
	// Checking for stdin is workaround for https://github.com/nodejs/node/issues/26852
	// TODO: Remove `|| spawned.stdin === undefined` once we drop support for Node.js <=12.2.0
	if (input === undefined || spawned.stdin === undefined) {
		return;
	}

	if (isStream(input)) {
		input.pipe(spawned.stdin);
	} else {
		spawned.stdin.end(input);
	}
}

function handleOutput(options, value, error) {
	if (typeof value !== 'string' && !Buffer.isBuffer(value)) {
		// When `execa.sync()` errors, we normalize it to '' to mimic `execa()`
		return error === undefined ? undefined : '';
	}

	if (options.stripFinalNewline) {
		return stripFinalNewline(value);
	}

	return value;
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
	const {stdout, stderr, signal} = result;
	let {error} = result;
	const {code, joinedCommand, timedOut, isCanceled, killed, parsed: {options: {timeout}}} = options;

	const [exitCodeName, exitCode] = getCode(result, code);

	const prefix = getErrorPrefix({timedOut, timeout, signal, exitCodeName, exitCode, isCanceled});
	const message = `Command ${prefix}: ${joinedCommand}`;

	if (error instanceof Error) {
		error.message = `${message}\n${error.message}`;
	} else {
		error = new Error(message);
	}

	error.command = joinedCommand;
	delete error.code;
	error.exitCode = exitCode;
	error.exitCodeName = exitCodeName;
	error.stdout = stdout;
	error.stderr = stderr;

	if ('all' in result) {
		error.all = result.all;
	}

	error.failed = true;
	error.timedOut = timedOut;
	error.isCanceled = isCanceled;
	error.killed = killed && !timedOut;
	// `signal` emitted on `spawned.on('exit')` event can be `null`. We normalize
	// it to `undefined`
	error.signal = signal || undefined;

	return error;
}

function getCode({error = {}}, code) {
	if (error.code) {
		return [error.code, os.constants.errno[error.code]];
	}

	if (Number.isInteger(code)) {
		return [util.getSystemErrorName(-code), code];
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

	return `failed with exit code ${exitCode} (${exitCodeName})`;
}

function joinCommand(command, args = []) {
	if (!Array.isArray(args)) {
		return command;
	}

	return [command, ...args].join(' ');
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

	// #115
	let removeExitHandler;
	if (parsed.options.cleanup && !parsed.options.detached) {
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

			const [result, stdout, stderr, all] = results;
			result.stdout = handleOutput(parsed.options, stdout);
			result.stderr = handleOutput(parsed.options, stderr);
			result.all = handleOutput(parsed.options, all);

			if (result.error || result.code !== 0 || result.signal !== null) {
				const error = makeError(result, {
					code: result.code,
					joinedCommand,
					parsed,
					timedOut,
					isCanceled,
					killed: spawned.killed
				});

				if (!parsed.options.reject) {
					return error;
				}

				throw error;
			}

			return {
				command: joinedCommand,
				exitCode: 0,
				exitCodeName: 'SUCCESS',
				stdout: result.stdout,
				stderr: result.stderr,
				all: result.all,
				failed: false,
				timedOut: false,
				isCanceled: false,
				killed: false
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

module.exports.sync = (command, args, options) => {
	const parsed = handleArgs(command, args, options);
	const joinedCommand = joinCommand(command, args);

	if (isStream(parsed.options.input)) {
		throw new TypeError('The `input` option cannot be a stream in sync mode');
	}

	const result = childProcess.spawnSync(parsed.command, parsed.args, parsed.options);
	result.stdout = handleOutput(parsed.options, result.stdout, result.error);
	result.stderr = handleOutput(parsed.options, result.stderr, result.error);

	if (result.error || result.status !== 0 || result.signal !== null) {
		const error = makeError(result, {
			code: result.status,
			joinedCommand,
			parsed,
			timedOut: result.error && result.error.errno === 'ETIMEDOUT',
			isCanceled: false,
			killed: result.signal !== null
		});

		if (!parsed.options.reject) {
			return error;
		}

		throw error;
	}

	return {
		command: joinedCommand,
		exitCode: 0,
		exitCodeName: 'SUCCESS',
		stdout: result.stdout,
		stderr: result.stderr,
		failed: false,
		timedOut: false,
		isCanceled: false,
		killed: false
	};
};
