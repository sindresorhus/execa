import {spawnSync} from 'node:child_process';
import {handleCommand, handleOptions} from './arguments/options.js';
import {makeError, makeEarlyError, makeSuccessResult} from './return/error.js';
import {stripNewline, handleResult} from './return/output.js';
import {handleInputSync} from './stdio/sync.js';
import {addInputOptionsSync} from './stdio/input-sync.js';
import {transformOutputSync, getAllSync} from './stdio/output-sync.js';
import {logEarlyResult} from './verbose/complete.js';
import {getSyncExitResult} from './exit/code.js';
import {getMaxBufferSync} from './stream/max-buffer.js';

export const execaCoreSync = (rawFile, rawArgs, rawOptions) => {
	const {file, args, command, escapedCommand, startTime, verboseInfo, options, fileDescriptors} = handleSyncArguments(rawFile, rawArgs, rawOptions);
	const result = spawnSubprocessSync({file, args, options, command, escapedCommand, verboseInfo, fileDescriptors, startTime});
	return handleResult(result, verboseInfo, options);
};

const handleSyncArguments = (rawFile, rawArgs, rawOptions) => {
	const {command, escapedCommand, startTime, verboseInfo} = handleCommand(rawFile, rawArgs, rawOptions);

	try {
		const syncOptions = normalizeSyncOptions(rawOptions);
		const {file, args, options} = handleOptions(rawFile, rawArgs, syncOptions);
		validateSyncOptions(options);
		const fileDescriptors = handleInputSync(options, verboseInfo);
		return {file, args, command, escapedCommand, startTime, verboseInfo, options, fileDescriptors};
	} catch (error) {
		logEarlyResult(error, startTime, verboseInfo);
		throw error;
	}
};

const normalizeSyncOptions = options => options.node && !options.ipc ? {...options, ipc: false} : options;

const validateSyncOptions = ({ipc, detached, cancelSignal}) => {
	if (ipc) {
		throwInvalidSyncOption('ipc: true');
	}

	if (detached) {
		throwInvalidSyncOption('detached: true');
	}

	if (cancelSignal) {
		throwInvalidSyncOption('cancelSignal');
	}
};

const throwInvalidSyncOption = value => {
	throw new TypeError(`The "${value}" option cannot be used with synchronous methods.`);
};

const spawnSubprocessSync = ({file, args, options, command, escapedCommand, verboseInfo, fileDescriptors, startTime}) => {
	const syncResult = runSubprocessSync({file, args, options, command, escapedCommand, fileDescriptors, startTime});
	if (syncResult.failed) {
		return syncResult;
	}

	const {resultError, exitCode, signal, timedOut, isMaxBuffer} = getSyncExitResult(syncResult, options);
	const {output, error = resultError} = transformOutputSync({fileDescriptors, syncResult, options, isMaxBuffer, verboseInfo});
	const stdio = output.map(stdioOutput => stripNewline(stdioOutput, options));
	const all = stripNewline(getAllSync(output, options), options);
	return getSyncResult({error, exitCode, signal, timedOut, isMaxBuffer, stdio, all, options, command, escapedCommand, startTime});
};

const runSubprocessSync = ({file, args, options, command, escapedCommand, fileDescriptors, startTime}) => {
	try {
		addInputOptionsSync(fileDescriptors, options);
		const normalizedOptions = normalizeSpawnSyncOptions(options);
		return spawnSync(file, args, normalizedOptions);
	} catch (error) {
		return makeEarlyError({error, command, escapedCommand, fileDescriptors, options, startTime, isSync: true});
	}
};

const normalizeSpawnSyncOptions = ({encoding, maxBuffer, ...options}) => ({...options, encoding: 'buffer', maxBuffer: getMaxBufferSync(maxBuffer)});

const getSyncResult = ({error, exitCode, signal, timedOut, isMaxBuffer, stdio, all, options, command, escapedCommand, startTime}) => error === undefined
	? makeSuccessResult({command, escapedCommand, stdio, all, options, startTime})
	: makeError({
		error,
		command,
		escapedCommand,
		timedOut,
		isCanceled: false,
		isMaxBuffer,
		exitCode,
		signal,
		stdio,
		all,
		options,
		startTime,
		isSync: true,
	});
