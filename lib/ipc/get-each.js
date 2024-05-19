import {once, on} from 'node:events';
import {validateIpcMethod, disconnect} from './validation.js';
import {addReference, removeReference, getIpcEmitter} from './forward.js';

// Like `[sub]process.on('message')` but promise-based
export const getEachMessage = ({anyProcess, isSubprocess, ipc}) => loopOnMessages({
	anyProcess,
	isSubprocess,
	ipc,
	shouldAwait: !isSubprocess,
});

// Same but used internally
export const loopOnMessages = ({anyProcess, isSubprocess, ipc, shouldAwait}) => {
	validateIpcMethod({
		methodName: 'getEachMessage',
		isSubprocess,
		ipc,
		isConnected: anyProcess.channel !== null,
	});

	addReference(anyProcess);
	const ipcEmitter = getIpcEmitter(anyProcess);
	const controller = new AbortController();
	stopOnDisconnect(anyProcess, ipcEmitter, controller);
	return iterateOnMessages({
		anyProcess,
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

const iterateOnMessages = async function * ({anyProcess, ipcEmitter, isSubprocess, shouldAwait, controller}) {
	try {
		for await (const [message] of on(ipcEmitter, 'message', {signal: controller.signal})) {
			yield message;
		}
	} catch {} finally {
		controller.abort();
		removeReference(anyProcess);

		if (!isSubprocess) {
			disconnect(anyProcess);
		}

		if (shouldAwait) {
			await anyProcess;
		}
	}
};
