import {once, on} from 'node:events';
import {validateIpcOption, validateConnection} from './validation.js';

// Like `[sub]process.on('message')` but promise-based
export const getEachMessage = ({anyProcess, isSubprocess, ipc}) => loopOnMessages({
	anyProcess,
	isSubprocess,
	ipc,
	shouldAwait: !isSubprocess,
});

// Same but used internally
export const loopOnMessages = ({anyProcess, isSubprocess, ipc, shouldAwait}) => {
	const methodName = 'getEachMessage';
	validateIpcOption(methodName, isSubprocess, ipc);
	validateConnection(methodName, isSubprocess, anyProcess.channel !== null);

	const controller = new AbortController();
	stopOnExit(anyProcess, controller);
	return iterateOnMessages(anyProcess, shouldAwait, controller);
};

const stopOnExit = async (anyProcess, controller) => {
	try {
		await once(anyProcess, 'disconnect', {signal: controller.signal});
	} catch {} finally {
		controller.abort();
	}
};

const iterateOnMessages = async function * (anyProcess, shouldAwait, controller) {
	try {
		for await (const [message] of on(anyProcess, 'message', {signal: controller.signal})) {
			yield message;
		}
	} catch (error) {
		if (!controller.signal.aborted) {
			throw error;
		}
	} finally {
		controller.abort();

		if (shouldAwait) {
			await anyProcess;
		}
	}
};
