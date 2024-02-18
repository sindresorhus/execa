import {Buffer} from 'node:buffer';
import {setMaxListeners} from 'node:events';
import {basename} from 'node:path';
import childProcess from 'node:child_process';
import process from 'node:process';
import crossSpawn from 'cross-spawn';
import stripFinalNewline from 'strip-final-newline';
import {npmRunPathEnv} from 'npm-run-path';
import {makeError, makeEarlyError, makeSuccessResult} from './lib/error.js';
import {handleNodeOption} from './lib/node.js';
import {handleInputAsync, pipeOutputAsync, cleanupStdioStreams} from './lib/stdio/async.js';
import {handleInputSync, pipeOutputSync} from './lib/stdio/sync.js';
import {spawnedKill, validateTimeout, normalizeForceKillAfterDelay, cleanupOnExit, isFailedExit} from './lib/kill.js';
import {pipeToProcess} from './lib/pipe.js';
import {getSpawnedResult, makeAllStream} from './lib/stream.js';
import {mergePromise} from './lib/promise.js';
import {joinCommand} from './lib/escape.js';
import {parseCommand} from './lib/command.js';
import {normalizeCwd, safeNormalizeFileUrl, normalizeFileUrl} from './lib/cwd.js';
import {parseTemplates} from './lib/script.js';
import {logCommand, verboseDefault} from './lib/verbose.js';
import {bufferToUint8Array} from './lib/stdio/utils.js';

const DEFAULT_MAX_BUFFER = 1000 * 1000 * 100;

const getEnv = ({env: envOption, extendEnv, preferLocal, localDir, nodePath}) => {
	const env = extendEnv ? {...process.env, ...envOption} : envOption;

	if (preferLocal) {
		return npmRunPathEnv({env, cwd: localDir, execPath: nodePath});
	}

	return env;
};

const handleAsyncArguments = (rawFile, rawArgs, rawOptions) => {
	[rawArgs, rawOptions] = handleOptionalArguments(rawArgs, rawOptions);
	const {file, args, command, escapedCommand, options: normalizedOptions} = handleArguments(rawFile, rawArgs, rawOptions);
	const options = handleAsyncOptions(normalizedOptions);
	return {file, args, command, escapedCommand, options};
};

// Prevent passing the `timeout` option directly to `child_process.spawn()`
const handleAsyncOptions = ({timeout, ...options}) => ({...options, timeoutDuration: timeout});

const handleSyncArguments = (rawFile, rawArgs, rawOptions) => {
	[rawArgs, rawOptions] = handleOptionalArguments(rawArgs, rawOptions);
	const syncOptions = normalizeSyncOptions(rawOptions);
	const {file, args, command, escapedCommand, options} = handleArguments(rawFile, rawArgs, syncOptions);
	validateSyncOptions(options);
	return {file, args, command, escapedCommand, options};
};

const normalizeSyncOptions = options => options.node && !options.ipc ? {...options, ipc: false} : options;

const validateSyncOptions = ({ipc}) => {
	if (ipc) {
		throw new TypeError('The "ipc: true" option cannot be used with synchronous methods.');
	}
};

const handleOptionalArguments = (args = [], options = {}) => Array.isArray(args)
	? [args, options]
	: [[], args];

const handleArguments = (rawFile, rawArgs, rawOptions) => {
	const filePath = safeNormalizeFileUrl(rawFile, 'First argument');
	const {command, escapedCommand} = joinCommand(filePath, rawArgs);

	rawOptions.cwd = normalizeCwd(rawOptions.cwd);
	const [processedFile, processedArgs, processedOptions] = handleNodeOption(filePath, rawArgs, rawOptions);

	const {command: file, args, options: initialOptions} = crossSpawn._parse(processedFile, processedArgs, processedOptions);

	const options = addDefaultOptions(initialOptions);
	validateTimeout(options);
	options.shell = normalizeFileUrl(options.shell);
	options.env = getEnv(options);
	options.forceKillAfterDelay = normalizeForceKillAfterDelay(options.forceKillAfterDelay);

	if (process.platform === 'win32' && basename(file, '.exe') === 'cmd') {
		// #116
		args.unshift('/q');
	}

	logCommand(escapedCommand, options);

	return {file, args, command, escapedCommand, options};
};

const addDefaultOptions = ({
	maxBuffer = DEFAULT_MAX_BUFFER,
	buffer = true,
	stripFinalNewline = true,
	extendEnv = true,
	preferLocal = false,
	cwd,
	localDir = cwd,
	encoding = 'utf8',
	reject = true,
	cleanup = true,
	all = false,
	windowsHide = true,
	verbose = verboseDefault,
	killSignal = 'SIGTERM',
	forceKillAfterDelay = true,
	lines = false,
	ipc = false,
	...options
}) => ({
	...options,
	maxBuffer,
	buffer,
	stripFinalNewline,
	extendEnv,
	preferLocal,
	cwd,
	localDir,
	encoding,
	reject,
	cleanup,
	all,
	windowsHide,
	verbose,
	killSignal,
	forceKillAfterDelay,
	lines,
	ipc,
});

const handleOutput = (options, value) => {
	if (value === undefined || value === null) {
		return;
	}

	if (Array.isArray(value)) {
		return value;
	}

	if (Buffer.isBuffer(value)) {
		value = bufferToUint8Array(value);
	}

	return options.stripFinalNewline ? stripFinalNewline(value) : value;
};

export function execa(rawFile, rawArgs, rawOptions) {
	const {file, args, command, escapedCommand, options} = handleAsyncArguments(rawFile, rawArgs, rawOptions);
	const stdioStreamsGroups = handleInputAsync(options);

	let spawned;
	try {
		spawned = childProcess.spawn(file, args, options);
	} catch (error) {
		cleanupStdioStreams(stdioStreamsGroups);
		// Ensure the returned error is always both a promise and a child process
		const dummySpawned = new childProcess.ChildProcess();
		const errorInstance = makeEarlyError({error, command, escapedCommand, stdioStreamsGroups, options});
		const errorPromise = options.reject ? Promise.reject(errorInstance) : Promise.resolve(errorInstance);
		mergePromise(dummySpawned, errorPromise);
		return dummySpawned;
	}

	const controller = new AbortController();
	setMaxListeners(Number.POSITIVE_INFINITY, controller.signal);

	const originalStreams = [...spawned.stdio];
	pipeOutputAsync(spawned, stdioStreamsGroups, controller);
	cleanupOnExit(spawned, options, controller);

	spawned.kill = spawnedKill.bind(undefined, {kill: spawned.kill.bind(spawned), spawned, options, controller});
	spawned.all = makeAllStream(spawned, options);
	spawned.pipe = pipeToProcess.bind(undefined, {spawned, stdioStreamsGroups, options});

	const promise = handlePromise({spawned, options, stdioStreamsGroups, originalStreams, command, escapedCommand, controller});
	mergePromise(spawned, promise);
	return spawned;
}

const handlePromise = async ({spawned, options, stdioStreamsGroups, originalStreams, command, escapedCommand, controller}) => {
	const context = {timedOut: false};

	const [
		errorInfo,
		[exitCode, signal],
		stdioResults,
		allResult,
	] = await getSpawnedResult({spawned, options, context, stdioStreamsGroups, originalStreams, controller});
	controller.abort();

	const stdio = stdioResults.map(stdioResult => handleOutput(options, stdioResult));
	const all = handleOutput(options, allResult);

	if ('error' in errorInfo) {
		const isCanceled = options.signal?.aborted === true;
		const returnedError = makeError({
			error: errorInfo.error,
			command,
			escapedCommand,
			timedOut: context.timedOut,
			isCanceled,
			exitCode,
			signal,
			stdio,
			all,
			options,
		});

		if (!options.reject) {
			return returnedError;
		}

		throw returnedError;
	}

	return makeSuccessResult({command, escapedCommand, stdio, all, options});
};

export function execaSync(rawFile, rawArgs, rawOptions) {
	const {file, args, command, escapedCommand, options} = handleSyncArguments(rawFile, rawArgs, rawOptions);
	const stdioStreamsGroups = handleInputSync(options);

	let result;
	try {
		result = childProcess.spawnSync(file, args, options);
	} catch (error) {
		const errorInstance = makeEarlyError({error, command, escapedCommand, stdioStreamsGroups, options});

		if (!options.reject) {
			return errorInstance;
		}

		throw errorInstance;
	}

	pipeOutputSync(stdioStreamsGroups, result);

	const output = result.output || Array.from({length: 3});
	const stdio = output.map(stdioOutput => handleOutput(options, stdioOutput));

	if (result.error !== undefined || isFailedExit(result.status, result.signal)) {
		const error = makeError({
			error: result.error,
			command,
			escapedCommand,
			timedOut: result.error && result.error.code === 'ETIMEDOUT',
			isCanceled: false,
			exitCode: result.status,
			signal: result.signal,
			stdio,
			options,
		});

		if (!options.reject) {
			return error;
		}

		throw error;
	}

	return makeSuccessResult({command, escapedCommand, stdio, options});
}

const normalizeScriptStdin = ({input, inputFile, stdio}) => input === undefined && inputFile === undefined && stdio === undefined
	? {stdin: 'inherit'}
	: {};

const normalizeScriptOptions = (options = {}) => ({
	preferLocal: true,
	...normalizeScriptStdin(options),
	...options,
});

function create$(options) {
	function $(templatesOrOptions, ...expressions) {
		if (!Array.isArray(templatesOrOptions)) {
			return create$({...options, ...templatesOrOptions});
		}

		const [file, ...args] = parseTemplates(templatesOrOptions, expressions);
		return execa(file, args, normalizeScriptOptions(options));
	}

	$.sync = (templates, ...expressions) => {
		if (!Array.isArray(templates)) {
			throw new TypeError('Please use $(options).sync`command` instead of $.sync(options)`command`.');
		}

		const [file, ...args] = parseTemplates(templates, expressions);
		return execaSync(file, args, normalizeScriptOptions(options));
	};

	$.s = $.sync;

	return $;
}

export const $ = create$();

export function execaCommand(command, options) {
	const [file, ...args] = parseCommand(command);
	return execa(file, args, options);
}

export function execaCommandSync(command, options) {
	const [file, ...args] = parseCommand(command);
	return execaSync(file, args, options);
}

export function execaNode(file, args, options) {
	[args, options] = handleOptionalArguments(args, options);

	if (options.node === false) {
		throw new TypeError('The "node" option cannot be false with `execaNode()`.');
	}

	return execa(file, args, {...options, node: true});
}
