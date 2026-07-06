import {once, on} from 'node:events';
import {validateIpcMethod, disconnect, getStrictResponseError} from './validation.js';
import {getIpcEmitter, isConnected} from './forward.js';
import {addReference, removeReference} from './reference.js';

export const internalGetEachMessageOptions = Symbol('internalGetEachMessageOptions');

// Like `[sub]process.on('message')` but promise-based
export const getEachMessage = (subprocessInfo, options = {}) => {
	const {reference = true} = options;
	// Internal callers can stop the IPC listener without exposing cancellation or pipe-awaiting options as public API.
	const {signal, shouldAwait = !subprocessInfo.isSubprocess} = options[internalGetEachMessageOptions] ?? {};

	return loopOnMessages({
		...subprocessInfo,
		shouldAwait,
		reference,
		signal,
	});
};

// Same but used internally
export const loopOnMessages = ({anyProcess, channel, isSubprocess, ipc, shouldAwait, reference, signal}) => {
	validateIpcMethod({
		methodName: 'getEachMessage',
		isSubprocess,
		ipc,
		isConnected: isConnected(anyProcess),
	});

	addReference(channel, reference);
	const ipcEmitter = getIpcEmitter(anyProcess, channel, isSubprocess);
	const controller = new AbortController();
	const state = {};
	stopOnAbort(signal, controller);
	stopOnDisconnect(anyProcess, ipcEmitter, controller);
	abortOnStrictError({
		ipcEmitter,
		isSubprocess,
		controller,
		state,
	});
	return iterateOnMessages({
		anyProcess,
		channel,
		ipcEmitter,
		isSubprocess,
		shouldAwait,
		controller,
		state,
		reference,
	});
};

const stopOnAbort = (signal, controller) => {
	if (signal === undefined) {
		return;
	}

	if (signal.aborted) {
		controller.abort();
		return;
	}

	// Reuse the iterator controller for listener cleanup when iteration ends before the internal signal aborts.
	signal.addEventListener('abort', () => {
		controller.abort();
	}, {once: true, signal: controller.signal});
};

const stopOnDisconnect = async (anyProcess, ipcEmitter, controller) => {
	try {
		await once(ipcEmitter, 'disconnect', {signal: controller.signal});
		controller.abort();
	} catch {}
};

const abortOnStrictError = async ({ipcEmitter, isSubprocess, controller, state}) => {
	try {
		const [error] = await once(ipcEmitter, 'strict:error', {signal: controller.signal});
		state.error = getStrictResponseError(error, isSubprocess);
		controller.abort();
	} catch {}
};

const iterateOnMessages = async function * ({anyProcess, channel, ipcEmitter, isSubprocess, shouldAwait, controller, state, reference}) {
	try {
		for await (const [message] of on(ipcEmitter, 'message', {signal: controller.signal})) {
			throwIfStrictError(state);
			yield message;
		}
	} catch {
		throwIfStrictError(state);
	} finally {
		controller.abort();
		removeReference(channel, reference);

		if (!isSubprocess) {
			disconnect(anyProcess);
		}

		if (shouldAwait) {
			await anyProcess;
		}
	}
};

const throwIfStrictError = ({error}) => {
	if (error) {
		throw error;
	}
};
