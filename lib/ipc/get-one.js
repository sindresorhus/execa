import {once, on} from 'node:events';
import {validateIpcMethod, throwOnEarlyDisconnect} from './validation.js';
import {addReference, removeReference, getIpcEmitter} from './forward.js';

// Like `[sub]process.once('message')` but promise-based
export const getOneMessage = ({anyProcess, isSubprocess, ipc}, {filter} = {}) => {
	const methodName = 'getOneMessage';
	validateIpcMethod({
		methodName,
		isSubprocess,
		ipc,
		isConnected: anyProcess.channel !== null,
	});

	return onceMessage({
		anyProcess,
		isSubprocess,
		methodName,
		filter,
	});
};

// Same but used internally
export const onceMessage = async ({anyProcess, isSubprocess, methodName, filter}) => {
	addReference(anyProcess);
	const ipcEmitter = getIpcEmitter(anyProcess);
	const controller = new AbortController();
	try {
		return await Promise.race([
			getMessage(ipcEmitter, filter, controller),
			throwOnDisconnect({
				ipcEmitter,
				isSubprocess,
				methodName,
				controller,
			}),
		]);
	} finally {
		controller.abort();
		removeReference(anyProcess);
	}
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

const throwOnDisconnect = async ({ipcEmitter, isSubprocess, methodName, controller: {signal}}) => {
	await once(ipcEmitter, 'disconnect', {signal});
	throwOnEarlyDisconnect(methodName, isSubprocess);
};
