import {basename} from 'node:path';
import process from 'node:process';
import crossSpawn from 'cross-spawn';
import {npmRunPathEnv} from 'npm-run-path';
import {normalizeForceKillAfterDelay} from '../exit/kill.js';
import {validateTimeout} from '../exit/timeout.js';
import {logCommand} from '../verbose/start.js';
import {getVerboseInfo} from '../verbose/info.js';
import {getStartTime} from '../return/duration.js';
import {validateEncoding, BINARY_ENCODINGS} from './encoding.js';
import {handleNodeOption} from './node.js';
import {joinCommand} from './escape.js';
import {normalizeCwd, normalizeFileUrl} from './cwd.js';
import {normalizeFdSpecificOptions, normalizeFdSpecificOption} from './specific.js';

export const handleCommand = (filePath, rawArgs, rawOptions) => {
	const startTime = getStartTime();
	const {command, escapedCommand} = joinCommand(filePath, rawArgs);
	const verboseInfo = getVerboseInfo(normalizeFdSpecificOption(rawOptions, 'verbose'));
	logCommand(escapedCommand, verboseInfo, rawOptions);
	return {command, escapedCommand, startTime, verboseInfo};
};

export const handleOptions = (filePath, rawArgs, rawOptions) => {
	rawOptions.cwd = normalizeCwd(rawOptions.cwd);
	const [processedFile, processedArgs, processedOptions] = handleNodeOption(filePath, rawArgs, rawOptions);

	const {command: file, args, options: initialOptions} = crossSpawn._parse(processedFile, processedArgs, processedOptions);

	const fdOptions = normalizeFdSpecificOptions(initialOptions);
	const options = addDefaultOptions(fdOptions);
	validateTimeout(options);
	validateEncoding(options);
	options.shell = normalizeFileUrl(options.shell);
	options.env = getEnv(options);
	options.forceKillAfterDelay = normalizeForceKillAfterDelay(options.forceKillAfterDelay);
	options.lines &&= !BINARY_ENCODINGS.has(options.encoding) && options.buffer;

	if (process.platform === 'win32' && basename(file, '.exe') === 'cmd') {
		// #116
		args.unshift('/q');
	}

	return {file, args, options};
};

const addDefaultOptions = ({
	buffer = true,
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
	serialization = 'advanced',
	...options
}) => ({
	...options,
	buffer,
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
	serialization,
});

const getEnv = ({env: envOption, extendEnv, preferLocal, node, localDir, nodePath}) => {
	const env = extendEnv ? {...process.env, ...envOption} : envOption;

	if (preferLocal || node) {
		return npmRunPathEnv({env, cwd: localDir, execPath: nodePath, preferLocal, addExecPath: node});
	}

	return env;
};
