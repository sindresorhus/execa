import childProcess from 'node:child_process';
import {handleOptionalArguments, handleArguments} from './arguments/options.js';
import {makeError, makeEarlyError, makeSuccessResult} from './return/error.js';
import {handleOutput} from './return/output.js';
import {handleInputSync, pipeOutputSync} from './stdio/sync.js';
import {isFailedExit} from './exit/code.js';

export const execaSync = (rawFile, rawArgs, rawOptions) => {
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
};

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
