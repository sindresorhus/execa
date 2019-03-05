'use strict';
const path = require('path');
const os = require('os');
const childProcess = require('child_process');
const crossSpawn = require('cross-spawn');
const stripFinalNewline = require('strip-final-newline');
const npmRunPath = require('npm-run-path');
const isStream = require('is-stream');
const _getStream = require('get-stream');
const pFinally = require('p-finally');
const onExit = require('signal-exit');
const errname = require('./lib/errname');
const stdio = require('./lib/stdio');

const TEN_MEGABYTES = 1000 * 1000 * 10;

function handleArgs(command, args, options) {
	options = Object.assign({
		extendEnv: true,
		env: {}
	}, options);

	if (options.extendEnv) {
		options.env = Object.assign({}, process.env, options.env);
	}

	const parsed = crossSpawn._parse(command, args, options);

	options = Object.assign({
		maxBuffer: TEN_MEGABYTES,
		buffer: true,
		stripFinalNewline: true,
		preferLocal: true,
		localDir: parsed.options.cwd || process.cwd(),
		encoding: 'utf8',
		reject: true,
		cleanup: true
	}, parsed.options, {windowsHide: true});

	// TODO: Remove in the next major release
	if (options.stripEof === false) {
		options.stripFinalNewline = false;
	}

	options.stdio = stdio(options);

	if (options.preferLocal) {
		options.env = npmRunPath.env(Object.assign({}, options, {cwd: options.localDir}));
	}

	if (options.detached) {
		// #115
		options.cleanup = false;
	}

	if (process.platform === 'win32' && path.basename(parsed.command) === 'cmd.exe') {
		// #116
		parsed.args.unshift('/q');
	}

	return {
		command: parsed.command,
		args: parsed.args,
		options,
		parsed
	};
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
	return fn(command, Object.assign({}, options, {shell: true}));
}

function getStream(process, stream, {encoding, buffer, maxBuffer}) {
	if (!process[stream]) {
		return null;
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
	const {joinedCommand, timedOut, parsed: {options: {timeout}}} = options;

	const [codeString, codeNumber] = getCode(result, code);

	if (!(error instanceof Error)) {
		const message = [joinedCommand, stderr, stdout].filter(Boolean).join('\n');
		error = new Error(message);
	}

	const prefix = getErrorPrefix({timedOut, timeout, signal, codeString, codeNumber});
	error.message = `Command ${prefix}: ${error.message}`;

	error.code = codeNumber || codeString;
	error.stdout = stdout;
	error.stderr = stderr;
	error.failed = true;
	error.signal = signal || null;
	error.cmd = joinedCommand;
	error.timedOut = Boolean(timedOut);

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

function getErrorPrefix({timedOut, timeout, signal, codeString, codeNumber}) {
	if (timedOut) {
		return `timed out after ${timeout} milliseconds`;
	}

	if (signal) {
		return `was killed with ${signal}`;
	}

	if (codeString !== undefined && codeNumber !== undefined) {
		return `failed with exit code ${codeNumber} (${codeString})`;
	}

	if (codeString !== undefined) {
		return `failed with exit code ${codeString}`;
	}

	if (codeNumber !== undefined) {
		return `failed with exit code ${codeNumber}`;
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

module.exports = (command, args, options) => {
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

	let timeoutId = null;
	let timedOut = false;

	const cleanup = () => {
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}

		if (removeExitHandler) {
			removeExitHandler();
		}
	};

	if (parsed.options.timeout > 0) {
		timeoutId = setTimeout(() => {
			timeoutId = null;
			timedOut = true;
			spawned.kill(parsed.options.killSignal);
		}, parsed.options.timeout);
	}

	const processDone = new Promise(resolve => {
		spawned.on('exit', (code, signal) => {
			cleanup();
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
	}

	const handlePromise = () => pFinally(Promise.all([
		processDone,
		getStream(spawned, 'stdout', {encoding, buffer, maxBuffer}),
		getStream(spawned, 'stderr', {encoding, buffer, maxBuffer})
	]).then(arr => {
		const result = arr[0];
		result.stdout = arr[1];
		result.stderr = arr[2];

		if (result.error || result.code !== 0 || result.signal !== null) {
			const error = makeError(result, {
				joinedCommand,
				parsed,
				timedOut
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
			code: 0,
			failed: false,
			killed: false,
			signal: null,
			cmd: joinedCommand,
			timedOut: false
		};
	}), destroy);

	crossSpawn._enoent.hookChildProcess(spawned, parsed.parsed);

	handleInput(spawned, parsed.options.input);

	spawned.then = (onfulfilled, onrejected) => handlePromise().then(onfulfilled, onrejected);
	spawned.catch = onrejected => handlePromise().catch(onrejected);
	// eslint-disable-next-line no-use-extend-native/no-use-extend-native
	if (Promise.prototype.finally) {
		spawned.finally = onfinally => handlePromise().finally(onfinally);
	}

	return spawned;
};

// TODO: set `stderr: 'ignore'` when that option is implemented
module.exports.stdout = (...args) => module.exports(...args).then(x => x.stdout);

// TODO: set `stdout: 'ignore'` when that option is implemented
module.exports.stderr = (...args) => module.exports(...args).then(x => x.stderr);

module.exports.shell = (command, options) => handleShell(module.exports, command, options);

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
		failed: false,
		signal: null,
		cmd: joinedCommand,
		timedOut: false
	};
};

module.exports.shellSync = (command, options) => handleShell(module.exports.sync, command, options);
