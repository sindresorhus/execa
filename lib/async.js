import {setMaxListeners} from 'node:events';
import {spawn} from 'node:child_process';
import {normalizeArguments, handleArguments} from './arguments/options.js';
import {makeError, makeSuccessResult} from './return/error.js';
import {handleOutput} from './return/output.js';
import {handleEarlyError} from './return/early-error.js';
import {handleInputAsync, pipeOutputAsync} from './stdio/async.js';
import {spawnedKill} from './exit/kill.js';
import {cleanupOnExit} from './exit/cleanup.js';
import {pipeToProcess} from './pipe/setup.js';
import {makeAllStream} from './stream/all.js';
import {getSpawnedResult} from './stream/resolve.js';
import {mergePromise} from './promise.js';

export const execa = (rawFile, rawArgs, rawOptions) => {
	const {file, args, command, escapedCommand, options} = handleAsyncArguments(rawFile, rawArgs, rawOptions);
	const stdioStreamsGroups = handleInputAsync(options);

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
	spawned.pipe = pipeToProcess.bind(undefined, {source: spawned, sourcePromise: promise, stdioStreamsGroups, options});
	mergePromise(spawned, promise);
	return spawned;
};

const handleAsyncArguments = (rawFile, rawArgs, rawOptions) => {
	[rawFile, rawArgs, rawOptions] = normalizeArguments(rawFile, rawArgs, rawOptions);
	const {file, args, command, escapedCommand, options: normalizedOptions} = handleArguments(rawFile, rawArgs, rawOptions);
	const options = handleAsyncOptions(normalizedOptions);
	return {file, args, command, escapedCommand, options};
};

// Prevent passing the `timeout` option directly to `child_process.spawn()`
const handleAsyncOptions = ({timeout, ...options}) => ({...options, timeoutDuration: timeout});

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

	if ('error' in errorInfo) {
		const isCanceled = options.signal?.aborted === true;
		const returnedError = makeError({
			error: errorInfo.error,
			command,
			escapedCommand,
			timedOut: context.timedOut,
			isCanceled,
			exitCode,
			signal,
			stdio,
			all,
			options,
		});

		if (!options.reject) {
			return returnedError;
		}

		throw returnedError;
	}

	return makeSuccessResult({command, escapedCommand, stdio, all, options});
};
