import {once, on} from 'node:events';
import {validateIpcOption, validateConnection} from './validation.js';

// Like `[sub]process.on('message')` but promise-based
export const getEachMessage = function ({anyProcess, isSubprocess, ipc}) {
	const methodName = 'getEachMessage';
	validateIpcOption(methodName, isSubprocess, ipc);
	validateConnection(methodName, isSubprocess, anyProcess.channel !== null);

	const controller = new AbortController();
	stopOnExit(anyProcess, isSubprocess, controller);

	return iterateOnMessages(anyProcess, isSubprocess, controller);
};

const stopOnExit = async (anyProcess, isSubprocess, controller) => {
	try {
		const onDisconnect = once(anyProcess, 'disconnect', {signal: controller.signal});
		await (isSubprocess
			? onDisconnect
			: Promise.race([onDisconnect, anyProcess]));
	} catch {} finally {
		controller.abort();
	}
};

const iterateOnMessages = async function * (anyProcess, isSubprocess, controller) {
	try {
		for await (const [message] of on(anyProcess, 'message', {signal: controller.signal})) {
			yield message;
		}
	} catch (error) {
		if (!controller.signal.aborted) {
			throw error;
		}
	} finally {
		if (!isSubprocess) {
			await anyProcess;
		}

		controller.abort();
	}
};
