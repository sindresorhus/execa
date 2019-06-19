'use strict';
const path = require('path');
const os = require('os');
const util = require('util');
const childProcess = require('child_process');
const crossSpawn = require('cross-spawn');
const stripFinalNewline = require('strip-final-newline');
const npmRunPath = require('npm-run-path');
const isStream = require('is-stream');
const getStream = require('get-stream');
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

function getStreamPromise(stream, {encoding, buffer, maxBuffer}) {
	if (!stream) {
		return;
	}

	if (!buffer) {
		// TODO: Use `ret = util.promisify(stream.finished)(stream);` when targeting Node.js 10
		return new Promise((resolve, reject) => {
			stream
				.once('end', resolve)
				.once('error', reject);
		});
	}

	if (encoding) {
		return getStream(stream, {encoding, maxBuffer});
	}

	return getStream.buffer(stream, {maxBuffer});
}

async function getPromiseResult({stdout, stderr, all}, {encoding, buffer, maxBuffer}, processDone) {
	const stdoutPromise = getStreamPromise(stdout, {encoding, buffer, maxBuffer});
	const stderrPromise = getStreamPromise(stderr, {encoding, buffer, maxBuffer});
	const allPromise = getStreamPromise(all, {encoding, buffer, maxBuffer: maxBuffer * 2});

	try {
		return await Promise.all([processDone, stdoutPromise, stderrPromise, allPromise]);
	} catch (error) {
		return Promise.all([
			{error, code: error.code, signal: error.signal},
			getBufferedData(stdout, stdoutPromise),
			getBufferedData(stderr, stderrPromise),
			getBufferedData(all, allPromise)
		]);
	}
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

function mergePromiseProperty(spawned, getPromise, property) {
	Object.defineProperty(spawned, property, {
		value(...args) {
			return getPromise()[property](...args);
		},
		writable: true,
		enumerable: false,
		configurable: true
	});
}

// The return value is a mixin of `childProcess` and `Promise`
function mergePromise(spawned, getPromise) {
	mergePromiseProperty(spawned, getPromise, 'then');
	mergePromiseProperty(spawned, getPromise, 'catch');

	// TODO: Remove the `if`-guard when targeting Node.js 10
	if (Promise.prototype.finally) {
		mergePromiseProperty(spawned, getPromise, 'finally');
	}

	return spawned;
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

function handleSpawned(spawned, context) {
	return new Promise((resolve, reject) => {
		spawned.on('exit', (code, signal) => {
			if (context.timedOut) {
				reject(Object.assign(new Error('Timed out'), {code, signal}));
				return;
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
	});
}

const setupTimeout = (spawned, {timeout, killSignal}, context) => {
	if (timeout > 0) {
		context.timeoutId = setTimeout(() => {
			Object.assign(context, {timeoutId: undefined, timedOut: true});
			spawned.kill(killSignal);
		}, timeout);
	}
};

const execa = (file, args, options) => {
	const parsed = handleArgs(file, args, options);
	const command = joinCommand(file, args);

	let spawned;
	try {
		spawned = childProcess.spawn(parsed.file, parsed.args, parsed.options);
	} catch (error) {
		return mergePromise(new childProcess.ChildProcess(), () =>
			Promise.reject(makeError({error, stdout: '', stderr: '', all: ''}, {
				command,
				parsed,
				timedOut: false,
				isCanceled: false,
				killed: false
			}))
		);
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

	const context = {timedOut: false};
	let isCanceled = false;

	const cleanup = () => {
		if (context.timeoutId !== undefined) {
			clearTimeout(context.timeoutId);
			context.timeoutId = undefined;
		}

		if (removeExitHandler) {
			removeExitHandler();
		}
	};

	setupTimeout(spawned, parsed.options, context);

	// TODO: Use native "finally" syntax when targeting Node.js 10
	const processDone = pFinally(handleSpawned(spawned, context), cleanup);

	const handlePromise = async () => {
		const [result, stdout, stderr, all] = await getPromiseResult(spawned, parsed.options, processDone);
		result.stdout = handleOutput(parsed.options, stdout);
		result.stderr = handleOutput(parsed.options, stderr);
		result.all = handleOutput(parsed.options, all);

		if (result.error || result.code !== 0 || result.signal !== null) {
			const error = makeError(result, {
				code: result.code,
				command,
				parsed,
				timedOut: context.timedOut,
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

	crossSpawn._enoent.hookChildProcess(spawned, parsed.parsed);

	handleInput(spawned, parsed.options.input);

	spawned.all = makeAllStream(spawned);

	spawned.cancel = () => {
		if (spawned.kill()) {
			isCanceled = true;
		}
	};

	return mergePromise(spawned, handlePromise);
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

module.exports.node = (scriptPath, args, options = {}) => {
	if (args && !Array.isArray(args) && typeof args === 'object') {
		options = args;
		args = [];
	}

	const stdioOption = stdio.node(options);

	const {nodePath = process.execPath, nodeArguments = process.execArgv} = options;

	return execa(
		nodePath,
		[
			...nodeArguments,
			scriptPath,
			...(Array.isArray(args) ? args : [])
		],
		{
			...options,
			stdin: undefined,
			stdout: undefined,
			stderr: undefined,
			stdio: stdioOption,
			shell: false
		}
	);
};
