import {setMaxListeners} from 'node:events';
import {spawn} from 'node:child_process';
import {MaxBufferError} from 'get-stream';
import {handleCommand} from '../arguments/command.js';
import {normalizeOptions} from '../arguments/options.js';
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
import {createDeferred} from '../utils/deferred.js';
import {mergePromise} from './promise.js';

// Main shared logic for all async methods: `execa()`, `execaCommand()`, `$`, `execaNode()`
export const execaCoreAsync = (rawFile, rawArguments, rawOptions, createNested) => {
	const {file, commandArguments, command, escapedCommand, startTime, verboseInfo, options, fileDescriptors} = handleAsyncArguments(rawFile, rawArguments, rawOptions);
	const {subprocess, promise} = spawnSubprocessAsync({
		file,
		commandArguments,
		options,
		startTime,
		verboseInfo,
		command,
		escapedCommand,
		fileDescriptors,
	});
	subprocess.pipe = pipeToSubprocess.bind(undefined, {
		source: subprocess,
		sourcePromise: promise,
		boundOptions: {},
		createNested,
	});
	mergePromise(subprocess, promise);
	SUBPROCESS_OPTIONS.set(subprocess, {options, fileDescriptors});
	return subprocess;
};

// Compute arguments to pass to `child_process.spawn()`
const handleAsyncArguments = (rawFile, rawArguments, rawOptions) => {
	const {command, escapedCommand, startTime, verboseInfo} = handleCommand(rawFile, rawArguments, rawOptions);

	try {
		const {file, commandArguments, options: normalizedOptions} = normalizeOptions(rawFile, rawArguments, rawOptions);
		const options = handleAsyncOptions(normalizedOptions);
		const fileDescriptors = handleStdioAsync(options, verboseInfo);
		return {
			file,
			commandArguments,
			command,
			escapedCommand,
			startTime,
			verboseInfo,
			options,
			fileDescriptors,
		};
	} catch (error) {
		logEarlyResult(error, startTime, verboseInfo);
		throw error;
	}
};

// Options normalization logic specific to async methods.
// Prevent passing the `timeout` option directly to `child_process.spawn()`.
const handleAsyncOptions = ({timeout, signal, cancelSignal, ...options}) => {
	if (signal !== undefined) {
		throw new TypeError('The "signal" option has been renamed to "cancelSignal" instead.');
	}

	return {...options, timeoutDuration: timeout, signal: cancelSignal};
};

const spawnSubprocessAsync = ({file, commandArguments, options, startTime, verboseInfo, command, escapedCommand, fileDescriptors}) => {
	let subprocess;
	try {
		subprocess = spawn(file, commandArguments, options);
	} catch (error) {
		return handleEarlyError({
			error,
			command,
			escapedCommand,
			fileDescriptors,
			options,
			startTime,
			verboseInfo,
		});
	}

	const controller = new AbortController();
	setMaxListeners(Number.POSITIVE_INFINITY, controller.signal);

	const originalStreams = [...subprocess.stdio];
	pipeOutputAsync(subprocess, fileDescriptors, controller);
	cleanupOnExit(subprocess, options, controller);

	const onInternalError = createDeferred();
	subprocess.kill = subprocessKill.bind(undefined, {
		kill: subprocess.kill.bind(subprocess),
		options,
		onInternalError,
		controller,
	});
	subprocess.all = makeAllStream(subprocess, options);
	addConvertedStreams(subprocess, options);

	const promise = handlePromise({
		subprocess,
		options,
		startTime,
		verboseInfo,
		fileDescriptors,
		originalStreams,
		command,
		escapedCommand,
		onInternalError,
		controller,
	});
	return {subprocess, promise};
};

// Asynchronous logic, as opposed to the previous logic which can be run synchronously, i.e. can be returned to user right away
const handlePromise = async ({subprocess, options, startTime, verboseInfo, fileDescriptors, originalStreams, command, escapedCommand, onInternalError, controller}) => {
	const context = {timedOut: false};

	const [errorInfo, [exitCode, signal], stdioResults, allResult] = await waitForSubprocessResult({
		subprocess,
		options,
		context,
		verboseInfo,
		fileDescriptors,
		originalStreams,
		onInternalError,
		controller,
	});
	controller.abort();
	onInternalError.resolve();

	const stdio = stdioResults.map((stdioResult, fdNumber) => stripNewline(stdioResult, options, fdNumber));
	const all = stripNewline(allResult, options, 'all');
	const result = getAsyncResult({
		errorInfo,
		exitCode,
		signal,
		stdio,
		all,
		context,
		options,
		command,
		escapedCommand,
		startTime,
	});
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
	: makeSuccessResult({
		command,
		escapedCommand,
		stdio,
		all,
		options,
		startTime,
	});
