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
import {makeAllStream} from './stream/all.js';
import {getSpawnedResult} from './stream/resolve.js';
import {mergePromise} from './promise.js';

export const execa = (rawFile, rawArgs, rawOptions) => {
	const {file, args, command, escapedCommand, options, stdioStreamsGroups} = handleAsyncArguments(rawFile, rawArgs, rawOptions);
	const {spawned, promise} = spawnProcessAsync({file, args, options, command, escapedCommand, stdioStreamsGroups});
	spawned.pipe = pipeToProcess.bind(undefined, {source: spawned, sourcePromise: promise, stdioStreamsGroups, destinationOptions: {}});
	mergePromise(spawned, promise);
	PROCESS_OPTIONS.set(spawned, options);
	return spawned;
};

const handleAsyncArguments = (rawFile, rawArgs, rawOptions) => {
	[rawFile, rawArgs, rawOptions] = normalizeArguments(rawFile, rawArgs, rawOptions);
	const {command, escapedCommand} = handleCommand(rawFile, rawArgs, rawOptions);
	const {file, args, options: normalizedOptions} = handleArguments(rawFile, rawArgs, rawOptions);
	const options = handleAsyncOptions(normalizedOptions);
	const stdioStreamsGroups = handleInputAsync(options);
	return {file, args, command, escapedCommand, options, stdioStreamsGroups};
};

// Prevent passing the `timeout` option directly to `child_process.spawn()`
const handleAsyncOptions = ({timeout, ...options}) => ({...options, timeoutDuration: timeout});

const spawnProcessAsync = ({file, args, options, command, escapedCommand, stdioStreamsGroups}) => {
	let spawned;
	try {
		spawned = spawn(file, args, options);
	} catch (error) {
		return handleEarlyError({error, command, escapedCommand, stdioStreamsGroups, options});
	}

	const controller = new AbortController();
	setMaxListeners(Number.POSITIVE_INFINITY, controller.signal);

	const originalStreams = [...spawned.stdio];
	pipeOutputAsync(spawned, stdioStreamsGroups, controller);
	cleanupOnExit(spawned, options, controller);

	spawned.kill = spawnedKill.bind(undefined, {kill: spawned.kill.bind(spawned), spawned, options, controller});
	spawned.all = makeAllStream(spawned, options);

	const promise = handlePromise({spawned, options, stdioStreamsGroups, originalStreams, command, escapedCommand, controller});
	return {spawned, promise};
};

const handlePromise = async ({spawned, options, stdioStreamsGroups, originalStreams, command, escapedCommand, controller}) => {
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
	const result = getAsyncResult({errorInfo, exitCode, signal, stdio, all, context, options, command, escapedCommand});
	return handleResult(result, options);
};

const getAsyncResult = ({errorInfo, exitCode, signal, stdio, all, context, options, command, escapedCommand}) => 'error' in errorInfo
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
	})
	: makeSuccessResult({command, escapedCommand, stdio, all, options});
