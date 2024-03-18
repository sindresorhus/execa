import {setMaxListeners} from 'node:events';
import {spawn} from 'node:child_process';
import {normalizeArguments, handleCommand, handleArguments} from './arguments/options.js';
import {makeError, makeSuccessResult} from './return/error.js';
import {handleOutput, handleResult} from './return/output.js';
import {handleEarlyError} from './return/early-error.js';
import {handleInputAsync, pipeOutputAsync} from './stdio/async.js';
import {subprocessKill} from './exit/kill.js';
import {cleanupOnExit} from './exit/cleanup.js';
import {pipeToSubprocess} from './pipe/setup.js';
import {SUBPROCESS_OPTIONS} from './pipe/validate.js';
import {logEarlyResult} from './verbose/complete.js';
import {makeAllStream} from './stream/all.js';
import {addConvertedStreams} from './convert/add.js';
import {getSubprocessResult} from './stream/resolve.js';
import {mergePromise} from './promise.js';

export const execa = (rawFile, rawArgs, rawOptions) => {
	const {file, args, command, escapedCommand, startTime, verboseInfo, options, stdioStreamsGroups, stdioState} = handleAsyncArguments(rawFile, rawArgs, rawOptions);
	const {subprocess, promise} = spawnSubprocessAsync({file, args, options, startTime, verboseInfo, command, escapedCommand, stdioStreamsGroups, stdioState});
	subprocess.pipe = pipeToSubprocess.bind(undefined, {source: subprocess, sourcePromise: promise, boundOptions: {}});
	mergePromise(subprocess, promise);
	SUBPROCESS_OPTIONS.set(subprocess, {options, stdioStreamsGroups});
	return subprocess;
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

const spawnSubprocessAsync = ({file, args, options, startTime, verboseInfo, command, escapedCommand, stdioStreamsGroups, stdioState}) => {
	let subprocess;
	try {
		subprocess = spawn(file, args, options);
	} catch (error) {
		return handleEarlyError({error, command, escapedCommand, stdioStreamsGroups, options, startTime, verboseInfo});
	}

	const controller = new AbortController();
	setMaxListeners(Number.POSITIVE_INFINITY, controller.signal);

	const originalStreams = [...subprocess.stdio];
	pipeOutputAsync(subprocess, stdioStreamsGroups, stdioState, controller);
	cleanupOnExit(subprocess, options, controller);

	subprocess.kill = subprocessKill.bind(undefined, {kill: subprocess.kill.bind(subprocess), subprocess, options, controller});
	subprocess.all = makeAllStream(subprocess, options);
	addConvertedStreams(subprocess);

	const promise = handlePromise({subprocess, options, startTime, verboseInfo, stdioStreamsGroups, originalStreams, command, escapedCommand, controller});
	return {subprocess, promise};
};

const handlePromise = async ({subprocess, options, startTime, verboseInfo, stdioStreamsGroups, originalStreams, command, escapedCommand, controller}) => {
	const context = {timedOut: false};

	const [
		errorInfo,
		[exitCode, signal],
		stdioResults,
		allResult,
	] = await getSubprocessResult({subprocess, options, context, stdioStreamsGroups, originalStreams, controller});
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
		isSync: false,
	})
	: makeSuccessResult({command, escapedCommand, stdio, all, options, startTime});
