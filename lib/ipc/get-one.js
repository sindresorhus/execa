import {once, on} from 'node:events';
import {
	validateIpcMethod,
	throwOnEarlyDisconnect,
	disconnect,
	getStrictResponseError,
} from './validation.js';
import {getIpcEmitter, isConnected} from './forward.js';
import {addReference, removeReference} from './reference.js';

export const internalGetOneMessageOptions = Symbol('internalGetOneMessageOptions');

// Like `[sub]process.once('message')` but promise-based
export const getOneMessage = ({anyProcess, channel, isSubprocess, ipc}, options = {}) => {
	const {reference = true, filter} = options;
	const {signal} = options[internalGetOneMessageOptions] ?? {};

	validateIpcMethod({
		methodName: 'getOneMessage',
		isSubprocess,
		ipc,
		isConnected: isConnected(anyProcess),
	});

	return getOneMessageAsync({
		anyProcess,
		channel,
		isSubprocess,
		filter,
		reference,
		signal,
	});
};

const getOneMessageAsync = async ({anyProcess, channel, isSubprocess, filter, reference, signal}) => {
	addReference(channel, reference);
	const ipcEmitter = getIpcEmitter(anyProcess, channel, isSubprocess);
	const controller = new AbortController();
	stopOnAbort(signal, controller);

	try {
		return await Promise.race([
			getMessage(ipcEmitter, filter, controller),
			throwOnDisconnect(ipcEmitter, isSubprocess, controller),
			throwOnStrictError(ipcEmitter, isSubprocess, controller),
		]);
	} catch (error) {
		disconnect(anyProcess);
		throw error;
	} finally {
		controller.abort();
		removeReference(channel, reference);
	}
};

const stopOnAbort = (signal, controller) => {
	if (signal === undefined) {
		return;
	}

	if (signal.aborted) {
		controller.abort();
		return;
	}

	signal.addEventListener('abort', () => {
		controller.abort();
	}, {once: true, signal: controller.signal});
};

const getMessage = async (ipcEmitter, filter, {signal}) => {
	if (filter === undefined) {
		const [message] = await once(ipcEmitter, 'message', {signal});
		return message;
	}

	for await (const [message] of on(ipcEmitter, 'message', {signal})) {
		if (filter(message)) {
			return message;
		}
	}
};

const throwOnDisconnect = async (ipcEmitter, isSubprocess, {signal}) => {
	await once(ipcEmitter, 'disconnect', {signal});
	throwOnEarlyDisconnect(isSubprocess);
};

const throwOnStrictError = async (ipcEmitter, isSubprocess, {signal}) => {
	const [error] = await once(ipcEmitter, 'strict:error', {signal});
	throw getStrictResponseError(error, isSubprocess);
};
