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

const DEFAULT_MAX_BUFFER = 1000 * 1000 * 100;
const DEFAULT_FORCE_KILL_TIMEOUT = 1000 * 5;

const SPACES_REGEXP = / +/g;

function handleArgs(file, args, options = {}) {
	const parsed = crossSpawn._parse(file, args, options);
	file = parsed.command;
	args = parsed.args;
	options = parsed.options;

	options = {
		maxBuffer: DEFAULT_MAX_BUFFER,
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

	if (process.platform === 'win32' && path.basename(file, '.exe') === 'cmd') {
		// #116
		args.unshift('/q');
	}

	return {file, args, options, parsed};
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

async function getBufferedData(stream, streamPromise) {
	if (!stream) {
		return;
	}

	stream.destroy();

	try {
		return await streamPromise;
	} catch (error) {
		return error.bufferedData;
	}
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

	return ret;
}

function makeError(result, options) {
	const {stdout, stderr, signal} = result;
	let {error} = result;
	const {code, command, timedOut, isCanceled, killed, parsed: {options: {timeout}}} = options;

	const [exitCodeName, exitCode] = getCode(result, code);

	const prefix = getErrorPrefix({timedOut, timeout, signal, exitCodeName, exitCode, isCanceled});
	const message = `Command ${prefix}: ${command}`;

	if (error instanceof Error) {
		error.message = `${message}\n${error.message}`;
	} else {
		error = new Error(message);
	}

	error.command = command;
	delete error.code;
	error.exitCode = exitCode;
	error.exitCodeName = exitCodeName;
	error.stdout = stdout;
	error.stderr = stderr;

	if ('all' in result) {
		error.all = result.all;
	}

	if ('bufferedData' in error) {
		delete error.bufferedData;
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

	if (exitCode !== undefined) {
		return `failed with exit code ${exitCode} (${exitCodeName})`;
	}

	return 'failed';
}

function joinCommand(file, args = []) {
	if (!Array.isArray(args)) {
		return file;
	}

	return [file, ...args].join(' ');
}

function spawnedKill(kill, signal = 'SIGTERM', options = {}) {
	const killResult = kill(signal);
	setKillTimeout(kill, signal, options, killResult);
	return killResult;
}

function setKillTimeout(kill, signal, options, killResult) {
	if (!shouldForceKill(signal, options, killResult)) {
		return;
	}

	const timeout = getForceKillAfterTimeout(options);
	setTimeout(() => {
		kill('SIGKILL');
	}, timeout).unref();
}

function shouldForceKill(signal, {forceKillAfterTimeout}, killResult) {
	return isSigterm(signal) && forceKillAfterTimeout !== false && killResult;
}

function isSigterm(signal) {
	return signal === os.constants.signals.SIGTERM ||
		(typeof signal === 'string' && signal.toUpperCase() === 'SIGTERM');
}

function getForceKillAfterTimeout({forceKillAfterTimeout = true}) {
	if (forceKillAfterTimeout === true) {
		return DEFAULT_FORCE_KILL_TIMEOUT;
	}

	if (!Number.isInteger(forceKillAfterTimeout) || forceKillAfterTimeout < 0) {
		throw new TypeError(`Expected the \`forceKillAfterTimeout\` option to be a non-negative integer, got \`${forceKillAfterTimeout}\` (${typeof forceKillAfterTimeout})`);
	}

	return forceKillAfterTimeout;
}

const execa = (file, args, options) => {
	const parsed = handleArgs(file, args, options);
	const {encoding, buffer, maxBuffer} = parsed.options;
	const command = joinCommand(file, args);

	let spawned;
	try {
		spawned = childProcess.spawn(parsed.file, parsed.args, parsed.options);
	} catch (error) {
		return Promise.reject(makeError({error, stdout: '', stderr: '', all: ''}, {
			command,
			parsed,
			timedOut: false,
			isCanceled: false,
			killed: false
		}));
	}

	const kill = spawned.kill.bind(spawned);
	spawned.kill = spawnedKill.bind(null, kill);

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

	// TODO: Use native "finally" syntax when targeting Node.js 10
	const processDone = pFinally(new Promise((resolve, reject) => {
		spawned.on('exit', (code, signal) => {
			if (timedOut) {
				return reject(Object.assign(new Error('Timed out'), {code, signal}));
			}

			resolve({code, signal});
		});

		spawned.on('error', error => {
			reject(error);
		});

		if (spawned.stdin) {
			spawned.stdin.on('error', error => {
				reject(error);
			});
		}
	}), cleanup);

	const handlePromise = () => {
		const stdoutPromise = getStream(spawned, 'stdout', {encoding, buffer, maxBuffer});
		const stderrPromise = getStream(spawned, 'stderr', {encoding, buffer, maxBuffer});
		const allPromise = getStream(spawned, 'all', {encoding, buffer, maxBuffer: maxBuffer * 2});

		const finalize = async () => {
			let results;
			try {
				results = await Promise.all([processDone, stdoutPromise, stderrPromise, allPromise]);
			} catch (error) {
				const {code, signal} = error;
				results = await Promise.all([
					{error, code, signal},
					getBufferedData(spawned.stdout, stdoutPromise),
					getBufferedData(spawned.stderr, stderrPromise),
					getBufferedData(spawned.all, allPromise)
				]);
			}

			const [result, stdout, stderr, all] = results;
			result.stdout = handleOutput(parsed.options, stdout);
			result.stderr = handleOutput(parsed.options, stderr);
			result.all = handleOutput(parsed.options, all);

			if (result.error || result.code !== 0 || result.signal !== null) {
				const error = makeError(result, {
					code: result.code,
					command,
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
				command,
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

		return finalize();
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

	// TODO: Remove the `if`-guard when targeting Node.js 10
	if (Promise.prototype.finally) {
		spawned.finally = onFinally => handlePromise().finally(onFinally);
	}

	return spawned;
};

module.exports = execa;

module.exports.sync = (file, args, options) => {
	const parsed = handleArgs(file, args, options);
	const command = joinCommand(file, args);

	if (isStream(parsed.options.input)) {
		throw new TypeError('The `input` option cannot be a stream in sync mode');
	}

	let result;
	try {
		result = childProcess.spawnSync(parsed.file, parsed.args, parsed.options);
	} catch (error) {
		throw makeError({error, stdout: '', stderr: '', all: ''}, {
			command,
			parsed,
			timedOut: false,
			isCanceled: false,
			killed: false
		});
	}

	result.stdout = handleOutput(parsed.options, result.stdout, result.error);
	result.stderr = handleOutput(parsed.options, result.stderr, result.error);

	if (result.error || result.status !== 0 || result.signal !== null) {
		const error = makeError(result, {
			code: result.status,
			command,
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
		command,
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

module.exports.command = (command, options) => {
	const [file, ...args] = parseCommand(command);
	return execa(file, args, options);
};

module.exports.commandSync = (command, options) => {
	const [file, ...args] = parseCommand(command);
	return execa.sync(file, args, options);
};
