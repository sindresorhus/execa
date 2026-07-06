import {setMaxListeners} from 'node:events';
import {spawn} from 'node:child_process';
import {MaxBufferError} from 'get-stream';
import {handleCommand} from '../arguments/command.js';
import {normalizeOptions} from '../arguments/options.js';
import {SUBPROCESS_OPTIONS} from '../arguments/fd-options.js';
import {concatenateShell} from '../arguments/shell.js';
import {addIpcMethods} from '../ipc/methods.js';
import {setIpcSubprocessOptions} from '../ipc/outgoing.js';
import {makeError, makeSuccessResult} from '../return/result.js';
import {handleResult} from '../return/reject.js';
import {handleEarlyError} from '../return/early-error.js';
import {handleStdioAsync} from '../stdio/handle-async.js';
import {stripNewline} from '../io/strip-newline.js';
import {pipeOutputAsync} from '../io/output-async.js';
import {subprocessKill} from '../terminate/kill.js';
import {cleanupOnExit} from '../terminate/cleanup.js';
import {pipeToSubprocess} from '../pipe/setup.js';
import {makeAllStream} from '../resolve/all-async.js';
import {waitForSubprocessResult} from '../resolve/wait-subprocess.js';
import {addConvertedStreams} from '../convert/add.js';
import {createDeferred} from '../utils/deferred.js';
import {mergePromise} from './promise.js';

// Main shared logic for all async methods: `execa()`, `$`, `execaNode()`
export const execaCoreAsync = (rawFile, rawArguments, rawOptions, createNested) => {
	const {file, commandArguments, command, escapedCommand, startTime, verboseInfo, options, fileDescriptors} = handleAsyncArguments(rawFile, rawArguments, rawOptions);
	const {subprocess: nodeChildProcess, promise, kill, all, convertedStreams} = spawnSubprocessAsync({
		file,
		commandArguments,
		options,
		startTime,
		verboseInfo,
		command,
		escapedCommand,
		fileDescriptors,
	});
	const subprocess = getSubprocessPromise({
		promise,
		nodeChildProcess,
		kill,
		all,
		convertedStreams,
		options,
	});
	subprocess.pipe = pipeToSubprocess.bind(undefined, {
		source: subprocess,
		sourcePromise: promise,
		boundOptions: {},
		createNested,
	});
	SUBPROCESS_OPTIONS.set(subprocess, {options, fileDescriptors});
	return subprocess;
};

// Compute arguments to pass to `child_process.spawn()`
const handleAsyncArguments = (rawFile, rawArguments, rawOptions) => {
	const {command, escapedCommand, startTime, verboseInfo} = handleCommand(rawFile, rawArguments, rawOptions);
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
};

// Options normalization logic specific to async methods.
// Prevent passing the `timeout` option directly to `child_process.spawn()`.
const handleAsyncOptions = ({timeout, signal, ...options}) => {
	if (signal !== undefined) {
		throw new TypeError('The "signal" option has been renamed to "cancelSignal" instead.');
	}

	return {...options, timeoutDuration: timeout};
};

const spawnSubprocessAsync = ({file, commandArguments, options, startTime, verboseInfo, command, escapedCommand, fileDescriptors}) => {
	let subprocess;
	try {
		subprocess = spawn(...concatenateShell(file, commandArguments, options));
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
	setMaxListeners(Infinity, controller.signal);

	const originalStreams = [...subprocess.stdio];
	pipeOutputAsync(subprocess, fileDescriptors, controller);
	setIpcSubprocessOptions(subprocess, options);

	const context = {};
	const onInternalError = createDeferred();
	const kill = subprocessKill.bind(undefined, {
		kill: subprocess.kill.bind(subprocess),
		options,
		onInternalError,
		context,
		controller,
	});
	cleanupOnExit(kill, options, controller);
	const all = makeAllStream(subprocess, options);

	const promise = handlePromise({
		subprocess,
		kill,
		all,
		options,
		startTime,
		verboseInfo,
		fileDescriptors,
		originalStreams,
		command,
		escapedCommand,
		context,
		onInternalError,
		controller,
	});
	return {
		subprocess,
		promise,
		kill,
		all,
	};
};

const getSubprocessPromise = ({promise, nodeChildProcess, kill, all, convertedStreams, options}) => {
	const subprocess = mergePromise(promise, getSubprocessProperties(nodeChildProcess, all));
	subprocess.kill = kill ?? subprocess.kill;
	if (convertedStreams === undefined) {
		addConvertedStreams(subprocess, options);
	} else {
		Object.assign(subprocess, convertedStreams);
	}

	addIpcMethods(subprocess, nodeChildProcess, options);
	return subprocess;
};

const getSubprocessProperties = (nodeChildProcess, all) => ({
	nodeChildProcess,
	pid: nodeChildProcess.pid,
	stdin: nodeChildProcess.stdin,
	stdout: nodeChildProcess.stdout,
	stderr: nodeChildProcess.stderr,
	stdio: nodeChildProcess.stdio,
	all,
	kill: nodeChildProcess.kill.bind(nodeChildProcess),
});

// Asynchronous logic, as opposed to the previous logic which can be run synchronously, i.e. can be returned to user right away
const handlePromise = async ({subprocess, kill, all: allStream, options, startTime, verboseInfo, fileDescriptors, originalStreams, command, escapedCommand, context, onInternalError, controller}) => {
	const [
		errorInfo,
		[exitCode, signal],
		stdioResults,
		allResult,
		ipcOutput,
	] = await waitForSubprocessResult({
		subprocess,
		kill,
		all: allStream,
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
		ipcOutput,
		context,
		options,
		command,
		escapedCommand,
		startTime,
	});
	return handleResult(result, verboseInfo, options);
};

const getAsyncResult = ({errorInfo, exitCode, signal, stdio, all, ipcOutput, context, options, command, escapedCommand, startTime}) => 'error' in errorInfo
	? makeError({
		error: errorInfo.error,
		command,
		escapedCommand,
		timedOut: context.terminationReason === 'timeout',
		isCanceled: context.terminationReason === 'cancel' || context.terminationReason === 'gracefulCancel',
		isGracefullyCanceled: context.terminationReason === 'gracefulCancel',
		isMaxBuffer: errorInfo.error instanceof MaxBufferError,
		isForcefullyTerminated: context.isForcefullyTerminated,
		exitCode,
		signal,
		stdio,
		all,
		ipcOutput,
		options,
		startTime,
		isSync: false,
	})
	: makeSuccessResult({
		command,
		escapedCommand,
		stdio,
		all,
		ipcOutput,
		options,
		startTime,
	});
