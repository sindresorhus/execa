import path from 'node:path';
import process from 'node:process';
import {npmRunPathEnv} from 'npm-run-path';
import {normalizeForceKillAfterDelay} from '../terminate/kill.js';
import {normalizeKillSignal} from '../terminate/signal.js';
import {validateCancelSignal} from '../terminate/cancel.js';
import {validateGracefulCancel} from '../terminate/graceful.js';
import {validateTimeout} from '../terminate/timeout.js';
import {handleNodeOption} from '../methods/node.js';
import {validateIpcInputOption} from '../ipc/ipc-input.js';
import {validateEncoding, BINARY_ENCODINGS} from './encoding-option.js';
import {parseCommandFile} from './command-file.js';
import {normalizeCwd} from './cwd.js';
import {normalizeFileUrl} from './file-url.js';
import {normalizeFdSpecificOptions} from './specific.js';

const cmdExeRegExp = /^cmd(?:\.exe)?$/i;

// Normalize the options object, and sometimes also the file paths and arguments.
// Applies default values, validate allowed options, normalize them.
export const normalizeOptions = (filePath, rawArguments, rawOptions) => {
	// Prevent prototype pollution by copying only own properties to a null-prototype object
	const sanitizedOptions = {__proto__: null, ...rawOptions};
	sanitizedOptions.cwd = normalizeCwd(sanitizedOptions.cwd);
	const [processedFile, processedArguments, processedOptions] = handleNodeOption(filePath, rawArguments, sanitizedOptions);
	const fdOptions = normalizeFdSpecificOptions(processedOptions);
	const options = addDefaultOptions(fdOptions);
	options.env = getEnv(options);

	const {file, commandArguments} = parseCommandFile(processedFile, processedArguments, options);

	validateTimeout(options);
	validateEncoding(options);
	validateIpcInputOption(options);
	validateCancelSignal(options);
	validateGracefulCancel(options);
	options.shell = normalizeFileUrl(options.shell);
	options.killSignal = normalizeKillSignal(options.killSignal);
	options.forceKillAfterDelay = normalizeForceKillAfterDelay(options.forceKillAfterDelay);
	options.lines = options.lines.map((lines, fdNumber) => lines && !BINARY_ENCODINGS.has(options.encoding) && options.buffer[fdNumber]);

	// The file is now an absolute path resolved via `PATHEXT`, so its extension might be uppercase (`cmd.EXE`)
	if (process.platform === 'win32' && cmdExeRegExp.test(path.basename(file))) {
		// #116
		commandArguments.unshift('/q');
	}

	return {file, commandArguments, options};
};

// Use null prototype to prevent prototype pollution from leaking through
const addDefaultOptions = ({
	extendEnv = true,
	preferLocal = false,
	cwd,
	localDir: localDirectory = cwd,
	encoding = 'utf8',
	reject = true,
	cleanup = true,
	killDescendants = false,
	all = false,
	windowsHide = true,
	killSignal = 'SIGTERM',
	forceKillAfterDelay = true,
	gracefulCancel = false,
	ipcInput,
	ipc = ipcInput !== undefined || gracefulCancel,
	serialization = 'advanced',
	...options
}) => ({
	__proto__: null,
	...options,
	extendEnv,
	preferLocal,
	cwd,
	localDirectory,
	encoding,
	reject,
	cleanup,
	killDescendants,
	all,
	windowsHide,
	killSignal,
	forceKillAfterDelay,
	gracefulCancel,
	ipcInput,
	ipc,
	serialization,
});

/*
Keep a null prototype, otherwise a polluted `Object.prototype` would inject environment variables.
Unlike the other options, `child_process` intentionally passes the inherited properties of `env` to the subprocess, so they are the ones which must not leak. This includes `PATH`, which decides which file the command resolves to.
`npmRunPathEnv()` returns a plain object, so this is applied to its result too.
*/
const getEnv = options => ({__proto__: null, ...computeEnv(options)});

const computeEnv = ({env: envOption, extendEnv, preferLocal, node, localDirectory, nodePath}) => {
	// Spread `envOption` even when it is `undefined`, so `extendEnv: false` results in an empty environment instead of inheriting `process.env`
	const env = {__proto__: null, ...(extendEnv && process.env), ...envOption};

	if (preferLocal || node) {
		return npmRunPathEnv({
			env,
			cwd: localDirectory,
			execPath: nodePath,
			preferLocal,
			addExecPath: node,
		});
	}

	return env;
};
