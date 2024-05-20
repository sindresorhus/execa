import {once, on} from 'node:events';
import {
	validateIpcMethod,
	disconnect,
	throwOnEarlyDisconnect,
} from './validation.js';

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
	const controller = new AbortController();
	try {
		return await Promise.race([
			getMessage(anyProcess, filter, controller),
			throwOnDisconnect({
				anyProcess,
				isSubprocess,
				methodName,
				controller,
			}),
		]);
	} catch (error) {
		disconnect(anyProcess);
		throw error;
	} finally {
		controller.abort();
	}
};

const getMessage = async (anyProcess, filter, {signal}) => {
	if (filter === undefined) {
		const [message] = await once(anyProcess, 'message', {signal});
		return message;
	}

	for await (const [message] of on(anyProcess, 'message', {signal})) {
		if (filter(message)) {
			return message;
		}
	}
};

const throwOnDisconnect = async ({anyProcess, isSubprocess, methodName, controller: {signal}}) => {
	await once(anyProcess, 'disconnect', {signal});
	throwOnEarlyDisconnect(methodName, isSubprocess);
};
