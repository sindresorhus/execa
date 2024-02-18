import {basename} from 'node:path';
import process from 'node:process';
import crossSpawn from 'cross-spawn';
import {npmRunPathEnv} from 'npm-run-path';
import isPlainObject from 'is-plain-obj';
import {normalizeForceKillAfterDelay} from '../exit/kill.js';
import {validateTimeout} from '../exit/timeout.js';
import {logCommand} from '../verbose/start.js';
import {handleNodeOption} from './node.js';
import {joinCommand} from './escape.js';
import {normalizeCwd, safeNormalizeFileUrl, normalizeFileUrl} from './cwd.js';

export const normalizeArguments = (rawFile, rawArgs = [], rawOptions = {}) => {
	const filePath = safeNormalizeFileUrl(rawFile, 'First argument');
	const [args, options] = isPlainObject(rawArgs)
		? [[], rawArgs]
		: [rawArgs, rawOptions];

	if (!Array.isArray(args)) {
		throw new TypeError(`Second argument must be either an array of arguments or an options object: ${args}`);
	}

	if (args.some(arg => typeof arg === 'object' && arg !== null)) {
		throw new TypeError(`Second argument must be an array of strings: ${args}`);
	}

	const normalizedArgs = args.map(String);
	const nullByteArg = normalizedArgs.find(arg => arg.includes('\0'));
	if (nullByteArg !== undefined) {
		throw new TypeError(`Arguments cannot contain null bytes ("\\0"): ${nullByteArg}`);
	}

	if (!isPlainObject(options)) {
		throw new TypeError(`Last argument must be an options object: ${options}`);
	}

	return [filePath, normalizedArgs, options];
};

export const handleCommand = (filePath, rawArgs, rawOptions) => {
	const {command, escapedCommand} = joinCommand(filePath, rawArgs);
	logCommand(escapedCommand, rawOptions);
	return {command, escapedCommand};
};

export const handleArguments = (filePath, rawArgs, rawOptions) => {
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

	return {file, args, options};
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
	killSignal,
	forceKillAfterDelay,
	lines,
	ipc,
});

const DEFAULT_MAX_BUFFER = 1000 * 1000 * 100;

const getEnv = ({env: envOption, extendEnv, preferLocal, node, localDir, nodePath}) => {
	const env = extendEnv ? {...process.env, ...envOption} : envOption;

	if (preferLocal || node) {
		return npmRunPathEnv({env, cwd: localDir, execPath: nodePath, preferLocal, addExecPath: node});
	}

	return env;
};
