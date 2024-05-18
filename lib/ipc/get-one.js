import {once} from 'node:events';
import {
	validateIpcOption,
	validateConnection,
	disconnect,
	throwOnEarlyDisconnect,
} from './validation.js';

// Like `[sub]process.once('message')` but promise-based
export const getOneMessage = ({anyProcess, isSubprocess, ipc}) => {
	const methodName = 'getOneMessage';
	validateIpcOption(methodName, isSubprocess, ipc);
	validateConnection(methodName, isSubprocess, anyProcess.channel !== null);

	return onceMessage(anyProcess, isSubprocess, methodName);
};

const onceMessage = async (anyProcess, isSubprocess, methodName) => {
	const controller = new AbortController();
	try {
		const [message] = await Promise.race([
			once(anyProcess, 'message', {signal: controller.signal}),
			throwOnDisconnect({
				anyProcess,
				isSubprocess,
				methodName,
				controller,
			}),
		]);
		return message;
	} catch (error) {
		disconnect(anyProcess);
		throw error;
	} finally {
		controller.abort();
	}
};

const throwOnDisconnect = async ({anyProcess, isSubprocess, methodName, controller: {signal}}) => {
	await once(anyProcess, 'disconnect', {signal});
	throwOnEarlyDisconnect(methodName, isSubprocess);
};
