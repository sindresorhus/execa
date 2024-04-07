import {basename} from 'node:path';
import process from 'node:process';
import crossSpawn from 'cross-spawn';
import {npmRunPathEnv} from 'npm-run-path';
import {normalizeForceKillAfterDelay} from '../terminate/kill.js';
import {validateTimeout} from '../terminate/timeout.js';
import {handleNodeOption} from '../methods/node.js';
import {validateEncoding, BINARY_ENCODINGS} from './encoding-option.js';
import {normalizeCwd} from './cwd.js';
import {normalizeFileUrl} from './file-url.js';
import {normalizeFdSpecificOptions} from './specific.js';

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
	options.lines = options.lines.map((lines, fdNumber) => lines && !BINARY_ENCODINGS.has(options.encoding) && options.buffer[fdNumber]);

	if (process.platform === 'win32' && basename(file, '.exe') === 'cmd') {
		// #116
		args.unshift('/q');
	}

	return {file, args, options};
};

const addDefaultOptions = ({
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
	ipc = false,
	serialization = 'advanced',
	...options
}) => ({
	...options,
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
