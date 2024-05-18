import {
	validateIpcOption,
	validateConnection,
	handleSerializationError,
	disconnect,
} from './validation.js';

// Like `[sub]process.send()` but promise-based.
// We do not `await subprocess` during `.sendMessage()` nor `.getOneMessage()` since those methods are transient.
// Users would still need to `await subprocess` after the method is done.
// Also, this would prevent `unhandledRejection` event from being emitted, making it silent.
export const sendMessage = ({anyProcess, anyProcessSend, isSubprocess, ipc}, message) => {
	const methodName = 'sendMessage';
	validateIpcOption(methodName, isSubprocess, ipc);
	validateConnection(methodName, isSubprocess, anyProcess.connected);

	return sendOneMessage({
		anyProcess,
		anyProcessSend,
		isSubprocess,
		message,
	});
};

const sendOneMessage = async ({anyProcess, anyProcessSend, isSubprocess, message}) => {
	try {
		await anyProcessSend(message);
	} catch (error) {
		disconnect(anyProcess);
		handleSerializationError(error, isSubprocess, message);
		throw error;
	}
};
