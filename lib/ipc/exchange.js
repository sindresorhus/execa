import {validateIpcMethod} from './validation.js';
import {sendOneMessage} from './send.js';
import {onceMessage} from './get-one.js';

// Like `[sub]process.send()` followed by `[sub]process.getOneMessage()`.
// Avoids the following race condition: listening to `message` after the other process already responded.
export const exchangeMessage = ({anyProcess, anyProcessSend, isSubprocess, ipc}, message, {filter} = {}) => {
	const methodName = 'exchangeMessage';
	validateIpcMethod({
		methodName,
		isSubprocess,
		ipc,
		isConnected: anyProcess.connected,
	});

	return exchangeOneMessage({
		anyProcess,
		anyProcessSend,
		isSubprocess,
		methodName,
		message,
		filter,
	});
};

const exchangeOneMessage = async ({anyProcess, anyProcessSend, isSubprocess, methodName, message, filter}) => {
	const [response] = await Promise.all([
		onceMessage({
			anyProcess,
			isSubprocess,
			methodName,
			filter,
		}),
		sendOneMessage({
			anyProcess,
			anyProcessSend,
			isSubprocess,
			methodName,
			message,
		}),
	]);
	return response;
};
