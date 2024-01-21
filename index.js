import {Buffer} from 'node:buffer';
import path from 'node:path';
import childProcess from 'node:child_process';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import crossSpawn from 'cross-spawn';
import stripFinalNewline from 'strip-final-newline';
import {npmRunPathEnv} from 'npm-run-path';
import {makeError} from './lib/error.js';
import {handleInputAsync, pipeOutputAsync} from './lib/stdio/async.js';
import {handleInputSync, pipeOutputSync} from './lib/stdio/sync.js';
import {normalizeStdioNode} from './lib/stdio/normalize.js';
import {spawnedKill, spawnedCancel, validateTimeout} from './lib/kill.js';
import {addPipeMethods} from './lib/pipe.js';
import {getSpawnedResult, makeAllStream} from './lib/stream.js';
import {mergePromise} from './lib/promise.js';
import {joinCommand, parseCommand, parseTemplates, getEscapedCommand} from './lib/command.js';
import {logCommand, verboseDefault} from './lib/verbose.js';
import {bufferToUint8Array} from './lib/stdio/utils.js';

const DEFAULT_MAX_BUFFER = 1000 * 1000 * 100;

const getEnv = ({env: envOption, extendEnv, preferLocal, localDir, execPath}) => {
	const env = extendEnv ? {...process.env, ...envOption} : envOption;

	if (preferLocal) {
		return npmRunPathEnv({env, cwd: localDir, execPath});
	}

	return env;
};

const normalizeFileUrl = file => file instanceof URL ? fileURLToPath(file) : file;

const getFilePath = rawFile => {
	const fileString = normalizeFileUrl(rawFile);

	if (typeof fileString !== 'string') {
		throw new TypeError('First argument must be a string or a file URL.');
	}

	return fileString;
};

const handleArguments = (rawFile, rawArgs, rawOptions = {}) => {
	const filePath = getFilePath(rawFile);
	const command = joinCommand(filePath, rawArgs);
	const escapedCommand = getEscapedCommand(filePath, rawArgs);

	const {command: file, args, options: initialOptions} = crossSpawn._parse(filePath, rawArgs, rawOptions);

	const options = addDefaultOptions(initialOptions);
	options.shell = normalizeFileUrl(options.shell);
	options.env = getEnv(options);

	if (process.platform === 'win32' && path.basename(file, '.exe') === 'cmd') {
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
	cwd = process.cwd(),
	localDir = cwd,
	execPath = process.execPath,
	encoding = 'utf8',
	reject = true,
	cleanup = true,
	all = false,
	windowsHide = true,
	verbose = verboseDefault,
	killSignal = 'SIGTERM',
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
	execPath,
	encoding,
	reject,
	cleanup,
	all,
	windowsHide,
	verbose,
	killSignal,
});

const handleOutput = (options, value) => {
	if (value === undefined || value === null) {
		return;
	}

	if (Buffer.isBuffer(value)) {
		value = bufferToUint8Array(value);
	}

	return options.stripFinalNewline ? stripFinalNewline(value) : value;
};

export function execa(rawFile, rawArgs, rawOptions) {
	const {file, args, command, escapedCommand, options} = handleArguments(rawFile, rawArgs, rawOptions);
	validateTimeout(options);

	const stdioStreamsGroups = handleInputAsync(options);

	let spawned;
	try {
		spawned = childProcess.spawn(file, args, options);
	} catch (error) {
		// Ensure the returned error is always both a promise and a child process
		const dummySpawned = new childProcess.ChildProcess();
		const errorPromise = Promise.reject(makeError({
			error,
			stdio: Array.from({length: stdioStreamsGroups.length}),
			command,
			escapedCommand,
			options,
			timedOut: false,
			isCanceled: false,
		}));
		mergePromise(dummySpawned, errorPromise);
		return dummySpawned;
	}

	pipeOutputAsync(spawned, stdioStreamsGroups);

	const context = {isCanceled: false, timedOut: false};

	spawned.kill = spawnedKill.bind(null, spawned.kill.bind(spawned));
	spawned.cancel = spawnedCancel.bind(null, spawned, context);
	spawned.all = makeAllStream(spawned, options);

	addPipeMethods(spawned);

	const promise = handlePromise({spawned, options, context, stdioStreamsGroups, command, escapedCommand});
	mergePromise(spawned, promise);
	return spawned;
}

const handlePromise = async ({spawned, options, context, stdioStreamsGroups, command, escapedCommand}) => {
	const [
		[exitCode, signal, error],
		stdioResults,
		allResult,
	] = await getSpawnedResult(spawned, options, context, stdioStreamsGroups);
	const stdio = stdioResults.map(stdioResult => handleOutput(options, stdioResult));
	const all = handleOutput(options, allResult);

	if (error || exitCode !== 0 || signal !== null) {
		const isCanceled = context.isCanceled || Boolean(options.signal?.aborted);
		const returnedError = makeError({
			error,
			exitCode,
			signal,
			stdio,
			all,
			command,
			escapedCommand,
			options,
			timedOut: context.timedOut,
			isCanceled,
		});

		if (!options.reject) {
			return returnedError;
		}

		throw returnedError;
	}

	return {
		command,
		escapedCommand,
		exitCode: 0,
		stdio,
		stdout: stdio[1],
		stderr: stdio[2],
		all,
		failed: false,
		timedOut: false,
		isCanceled: false,
		isTerminated: false,
	};
};

export function execaSync(rawFile, rawArgs, rawOptions) {
	const {file, args, command, escapedCommand, options} = handleArguments(rawFile, rawArgs, rawOptions);

	const stdioStreamsGroups = handleInputSync(options);

	let result;
	try {
		result = childProcess.spawnSync(file, args, options);
	} catch (error) {
		throw makeError({
			error,
			stdio: Array.from({length: stdioStreamsGroups.stdioLength}),
			command,
			escapedCommand,
			options,
			timedOut: false,
			isCanceled: false,
		});
	}

	pipeOutputSync(stdioStreamsGroups, result);

	const output = result.output || Array.from({length: 3});
	const stdio = output.map(stdioOutput => handleOutput(options, stdioOutput));

	if (result.error || result.status !== 0 || result.signal !== null) {
		const error = makeError({
			stdio,
			error: result.error,
			signal: result.signal,
			exitCode: result.status,
			command,
			escapedCommand,
			options,
			timedOut: result.error && result.error.code === 'ETIMEDOUT',
			isCanceled: false,
		});

		if (!options.reject) {
			return error;
		}

		throw error;
	}

	return {
		command,
		escapedCommand,
		exitCode: 0,
		stdio,
		stdout: stdio[1],
		stderr: stdio[2],
		failed: false,
		timedOut: false,
		isCanceled: false,
		isTerminated: false,
	};
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

export function execaNode(scriptPath, args, options = {}) {
	if (args && !Array.isArray(args) && typeof args === 'object') {
		options = args;
		args = [];
	}

	const stdio = normalizeStdioNode(options);
	const defaultExecArgv = process.execArgv.filter(arg => !arg.startsWith('--inspect'));

	const {
		nodePath = process.execPath,
		nodeOptions = defaultExecArgv,
	} = options;

	return execa(
		nodePath,
		[
			...nodeOptions,
			getFilePath(scriptPath),
			...(Array.isArray(args) ? args : []),
		],
		{
			...options,
			stdin: undefined,
			stdout: undefined,
			stderr: undefined,
			stdio,
			shell: false,
		},
	);
}
