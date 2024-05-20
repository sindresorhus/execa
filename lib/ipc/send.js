import {
	validateIpcMethod,
	handleSerializationError,
	disconnect,
} from './validation.js';

// Like `[sub]process.send()` but promise-based.
// We do not `await subprocess` during `.sendMessage()`, `.getOneMessage()` nor `.exchangeMessage()` since those methods are transient.
// Users would still need to `await subprocess` after the method is done.
// Also, this would prevent `unhandledRejection` event from being emitted, making it silent.
export const sendMessage = ({anyProcess, anyProcessSend, isSubprocess, ipc}, message) => {
	const methodName = 'sendMessage';
	validateIpcMethod({
		methodName,
		isSubprocess,
		ipc,
		isConnected: anyProcess.connected,
	});

	return sendOneMessage({
		anyProcess,
		anyProcessSend,
		isSubprocess,
		methodName,
		message,
	});
};

// Same but used internally
export const sendOneMessage = async ({anyProcess, anyProcessSend, isSubprocess, methodName, message}) => {
	try {
		await anyProcessSend(message);
	} catch (error) {
		disconnect(anyProcess);
		handleSerializationError({
			error,
			isSubprocess,
			methodName,
			message,
		});
		throw error;
	}
};
