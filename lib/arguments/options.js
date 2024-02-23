import {basename} from 'node:path';
import process from 'node:process';
import crossSpawn from 'cross-spawn';
import {npmRunPathEnv} from 'npm-run-path';
import isPlainObject from 'is-plain-obj';
import {normalizeForceKillAfterDelay} from '../exit/kill.js';
import {validateTimeout} from '../exit/timeout.js';
import {handleNodeOption} from './node.js';
import {logCommand, verboseDefault} from './verbose.js';
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

	if (!isPlainObject(options)) {
		throw new TypeError(`Last argument must be an options object: ${options}`);
	}

	return [filePath, args, options];
};

export const handleArguments = (filePath, rawArgs, rawOptions) => {
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

const DEFAULT_MAX_BUFFER = 1000 * 1000 * 100;

const getEnv = ({env: envOption, extendEnv, preferLocal, node, localDir, nodePath}) => {
	const env = extendEnv ? {...process.env, ...envOption} : envOption;

	if (preferLocal || node) {
		return npmRunPathEnv({env, cwd: localDir, execPath: nodePath, preferLocal, addExecPath: node});
	}

	return env;
};
