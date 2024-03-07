import {setMaxListeners} from 'node:events';
import {spawn} from 'node:child_process';
import {normalizeArguments, handleCommand, handleArguments} from './arguments/options.js';
import {makeError, makeSuccessResult} from './return/error.js';
import {handleOutput, handleResult} from './return/output.js';
import {handleEarlyError} from './return/early-error.js';
import {handleInputAsync, pipeOutputAsync} from './stdio/async.js';
import {spawnedKill} from './exit/kill.js';
import {cleanupOnExit} from './exit/cleanup.js';
import {pipeToProcess} from './pipe/setup.js';
import {PROCESS_OPTIONS} from './pipe/validate.js';
import {logEarlyResult} from './verbose/complete.js';
import {makeAllStream} from './stream/all.js';
import {getSpawnedResult} from './stream/resolve.js';
import {mergePromise} from './promise.js';

export const execa = (rawFile, rawArgs, rawOptions) => {
	const {file, args, command, escapedCommand, startTime, verboseInfo, options, stdioStreamsGroups, stdioState} = handleAsyncArguments(rawFile, rawArgs, rawOptions);
	const {spawned, promise} = spawnProcessAsync({file, args, options, startTime, verboseInfo, command, escapedCommand, stdioStreamsGroups, stdioState});
	spawned.pipe = pipeToProcess.bind(undefined, {source: spawned, sourcePromise: promise, stdioStreamsGroups, destinationOptions: {}});
	mergePromise(spawned, promise);
	PROCESS_OPTIONS.set(spawned, options);
	return spawned;
};

const handleAsyncArguments = (rawFile, rawArgs, rawOptions) => {
	[rawFile, rawArgs, rawOptions] = normalizeArguments(rawFile, rawArgs, rawOptions);
	const {command, escapedCommand, startTime, verboseInfo} = handleCommand(rawFile, rawArgs, rawOptions);

	try {
		const {file, args, options: normalizedOptions} = handleArguments(rawFile, rawArgs, rawOptions);
		const options = handleAsyncOptions(normalizedOptions);
		const {stdioStreamsGroups, stdioState} = handleInputAsync(options, verboseInfo);
		return {file, args, command, escapedCommand, startTime, verboseInfo, options, stdioStreamsGroups, stdioState};
	} catch (error) {
		logEarlyResult(error, startTime, verboseInfo);
		throw error;
	}
};

// Prevent passing the `timeout` option directly to `child_process.spawn()`
const handleAsyncOptions = ({timeout, signal, cancelSignal, ...options}) => {
	if (signal !== undefined) {
		throw new TypeError('The "signal" option has been renamed to "cancelSignal" instead.');
	}

	return {...options, timeoutDuration: timeout, signal: cancelSignal};
};

const spawnProcessAsync = ({file, args, options, startTime, verboseInfo, command, escapedCommand, stdioStreamsGroups, stdioState}) => {
	let spawned;
	try {
		spawned = spawn(file, args, options);
	} catch (error) {
		return handleEarlyError({error, command, escapedCommand, stdioStreamsGroups, options, startTime, verboseInfo});
	}

	const controller = new AbortController();
	setMaxListeners(Number.POSITIVE_INFINITY, controller.signal);

	const originalStreams = [...spawned.stdio];
	pipeOutputAsync(spawned, stdioStreamsGroups, stdioState, controller);
	cleanupOnExit(spawned, options, controller);

	spawned.kill = spawnedKill.bind(undefined, {kill: spawned.kill.bind(spawned), spawned, options, controller});
	spawned.all = makeAllStream(spawned, options);

	const promise = handlePromise({spawned, options, startTime, verboseInfo, stdioStreamsGroups, originalStreams, command, escapedCommand, controller});
	return {spawned, promise};
};

const handlePromise = async ({spawned, options, startTime, verboseInfo, stdioStreamsGroups, originalStreams, command, escapedCommand, controller}) => {
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
	const result = getAsyncResult({errorInfo, exitCode, signal, stdio, all, context, options, command, escapedCommand, startTime});
	return handleResult(result, verboseInfo, options);
};

const getAsyncResult = ({errorInfo, exitCode, signal, stdio, all, context, options, command, escapedCommand, startTime}) => 'error' in errorInfo
	? makeError({
		error: errorInfo.error,
		command,
		escapedCommand,
		timedOut: context.timedOut,
		isCanceled: options.signal?.aborted === true,
		exitCode,
		signal,
		stdio,
		all,
		options,
		startTime,
	})
	: makeSuccessResult({command, escapedCommand, stdio, all, options, startTime});
