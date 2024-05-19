import {once, on} from 'node:events';
import {validateIpcMethod, disconnect} from './validation.js';
import {getIpcEmitter, isConnected} from './forward.js';
import {addReference, removeReference} from './reference.js';

// Like `[sub]process.on('message')` but promise-based
export const getEachMessage = ({anyProcess, channel, isSubprocess, ipc}) => loopOnMessages({
	anyProcess,
	channel,
	isSubprocess,
	ipc,
	shouldAwait: !isSubprocess,
});

// Same but used internally
export const loopOnMessages = ({anyProcess, channel, isSubprocess, ipc, shouldAwait}) => {
	validateIpcMethod({
		methodName: 'getEachMessage',
		isSubprocess,
		ipc,
		isConnected: isConnected(anyProcess),
	});

	addReference(channel);
	const ipcEmitter = getIpcEmitter(anyProcess, channel, isSubprocess);
	const controller = new AbortController();
	stopOnDisconnect(anyProcess, ipcEmitter, controller);
	return iterateOnMessages({
		anyProcess,
		channel,
		ipcEmitter,
		isSubprocess,
		shouldAwait,
		controller,
	});
};

const stopOnDisconnect = async (anyProcess, ipcEmitter, controller) => {
	try {
		await once(ipcEmitter, 'disconnect', {signal: controller.signal});
		controller.abort();
	} catch {}
};

const iterateOnMessages = async function * ({anyProcess, channel, ipcEmitter, isSubprocess, shouldAwait, controller}) {
	try {
		for await (const [message] of on(ipcEmitter, 'message', {signal: controller.signal})) {
			yield message;
		}
	} catch {} finally {
		controller.abort();
		removeReference(channel);

		if (!isSubprocess) {
			disconnect(anyProcess);
		}

		if (shouldAwait) {
			await anyProcess;
		}
	}
};
