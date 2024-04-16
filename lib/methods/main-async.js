import {setMaxListeners} from 'node:events';
import {spawn} from 'node:child_process';
import {MaxBufferError} from 'get-stream';
import {handleCommand} from '../arguments/command.js';
import {handleOptions} from '../arguments/options.js';
import {SUBPROCESS_OPTIONS} from '../arguments/fd-options.js';
import {makeError, makeSuccessResult} from '../return/result.js';
import {handleResult} from '../return/reject.js';
import {handleEarlyError} from '../return/early-error.js';
import {handleStdioAsync} from '../stdio/handle-async.js';
import {stripNewline} from '../io/strip-newline.js';
import {pipeOutputAsync} from '../io/output-async.js';
import {subprocessKill} from '../terminate/kill.js';
import {cleanupOnExit} from '../terminate/cleanup.js';
import {pipeToSubprocess} from '../pipe/setup.js';
import {logEarlyResult} from '../verbose/complete.js';
import {makeAllStream} from '../resolve/all-async.js';
import {waitForSubprocessResult} from '../resolve/wait-subprocess.js';
import {addConvertedStreams} from '../convert/add.js';
import {mergePromise} from './promise.js';

export const execaCoreAsync = (rawFile, rawArgs, rawOptions, createNested) => {
	const {file, args, command, escapedCommand, startTime, verboseInfo, options, fileDescriptors} = handleAsyncArguments(rawFile, rawArgs, rawOptions);
	const {subprocess, promise} = spawnSubprocessAsync({file, args, options, startTime, verboseInfo, command, escapedCommand, fileDescriptors});
	subprocess.pipe = pipeToSubprocess.bind(undefined, {source: subprocess, sourcePromise: promise, boundOptions: {}, createNested});
	mergePromise(subprocess, promise);
	SUBPROCESS_OPTIONS.set(subprocess, {options, fileDescriptors});
	return subprocess;
};

const handleAsyncArguments = (rawFile, rawArgs, rawOptions) => {
	const {command, escapedCommand, startTime, verboseInfo} = handleCommand(rawFile, rawArgs, rawOptions);

	try {
		const {file, args, options: normalizedOptions} = handleOptions(rawFile, rawArgs, rawOptions);
		const options = handleAsyncOptions(normalizedOptions);
		const fileDescriptors = handleStdioAsync(options, verboseInfo);
		return {file, args, command, escapedCommand, startTime, verboseInfo, options, fileDescriptors};
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

const spawnSubprocessAsync = ({file, args, options, startTime, verboseInfo, command, escapedCommand, fileDescriptors}) => {
	let subprocess;
	try {
		subprocess = spawn(file, args, options);
	} catch (error) {
		return handleEarlyError({error, command, escapedCommand, fileDescriptors, options, startTime, verboseInfo});
	}

	const controller = new AbortController();
	setMaxListeners(Number.POSITIVE_INFINITY, controller.signal);

	const originalStreams = [...subprocess.stdio];
	pipeOutputAsync(subprocess, fileDescriptors, controller);
	cleanupOnExit(subprocess, options, controller);

	subprocess.kill = subprocessKill.bind(undefined, {kill: subprocess.kill.bind(subprocess), subprocess, options, controller});
	subprocess.all = makeAllStream(subprocess, options);
	addConvertedStreams(subprocess, options);

	const promise = handlePromise({subprocess, options, startTime, verboseInfo, fileDescriptors, originalStreams, command, escapedCommand, controller});
	return {subprocess, promise};
};

const handlePromise = async ({subprocess, options, startTime, verboseInfo, fileDescriptors, originalStreams, command, escapedCommand, controller}) => {
	const context = {timedOut: false};

	const [
		errorInfo,
		[exitCode, signal],
		stdioResults,
		allResult,
	] = await waitForSubprocessResult({subprocess, options, context, verboseInfo, fileDescriptors, originalStreams, controller});
	controller.abort();

	const stdio = stdioResults.map((stdioResult, fdNumber) => stripNewline(stdioResult, options, fdNumber));
	const all = stripNewline(allResult, options, 'all');
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
		isMaxBuffer: errorInfo.error instanceof MaxBufferError,
		exitCode,
		signal,
		stdio,
		all,
		options,
		startTime,
		isSync: false,
	})
	: makeSuccessResult({command, escapedCommand, stdio, all, options, startTime});
