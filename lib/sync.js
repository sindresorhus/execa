import {spawnSync} from 'node:child_process';
import {normalizeArguments, handleCommand, handleArguments} from './arguments/options.js';
import {makeError, makeEarlyError, makeSuccessResult} from './return/error.js';
import {handleOutput, handleResult} from './return/output.js';
import {handleInputSync, pipeOutputSync} from './stdio/sync.js';
import {logEarlyResult} from './verbose/complete.js';
import {isFailedExit} from './exit/code.js';

export const execaSync = (rawFile, rawArgs, rawOptions) => {
	const {file, args, command, escapedCommand, startTime, verboseInfo, options, stdioStreamsGroups} = handleSyncArguments(rawFile, rawArgs, rawOptions);
	const result = spawnSubprocessSync({file, args, options, command, escapedCommand, stdioStreamsGroups, startTime});
	return handleResult(result, verboseInfo, options);
};

const handleSyncArguments = (rawFile, rawArgs, rawOptions) => {
	[rawFile, rawArgs, rawOptions] = normalizeArguments(rawFile, rawArgs, rawOptions);
	const {command, escapedCommand, startTime, verboseInfo} = handleCommand(rawFile, rawArgs, rawOptions);

	try {
		const syncOptions = normalizeSyncOptions(rawOptions);
		const {file, args, options} = handleArguments(rawFile, rawArgs, syncOptions);
		validateSyncOptions(options);
		const stdioStreamsGroups = handleInputSync(options, verboseInfo);
		return {file, args, command, escapedCommand, startTime, verboseInfo, options, stdioStreamsGroups};
	} catch (error) {
		logEarlyResult(error, startTime, verboseInfo);
		throw error;
	}
};

const normalizeSyncOptions = options => options.node && !options.ipc ? {...options, ipc: false} : options;

const validateSyncOptions = ({ipc}) => {
	if (ipc) {
		throw new TypeError('The "ipc: true" option cannot be used with synchronous methods.');
	}
};

const spawnSubprocessSync = ({file, args, options, command, escapedCommand, stdioStreamsGroups, startTime}) => {
	let syncResult;
	try {
		syncResult = spawnSync(file, args, options);
	} catch (error) {
		return makeEarlyError({error, command, escapedCommand, stdioStreamsGroups, options, startTime});
	}

	pipeOutputSync(stdioStreamsGroups, syncResult);

	const output = syncResult.output || Array.from({length: 3});
	const stdio = output.map(stdioOutput => handleOutput(options, stdioOutput));
	return getSyncResult(syncResult, {stdio, options, command, escapedCommand, startTime});
};

const getSyncResult = ({error, status, signal}, {stdio, options, command, escapedCommand, startTime}) => error !== undefined || isFailedExit(status, signal)
	? makeError({
		error,
		command,
		escapedCommand,
		timedOut: error && error.code === 'ETIMEDOUT',
		isCanceled: false,
		exitCode: status,
		signal,
		stdio,
		options,
		startTime,
	})
	: makeSuccessResult({command, escapedCommand, stdio, options, startTime});
