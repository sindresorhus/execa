import {
	validateIpcMethod,
	handleEpipeError,
	handleSerializationError,
	disconnect,
} from './validation.js';
import {startSendMessage, endSendMessage} from './outgoing.js';

// Like `[sub]process.send()` but promise-based.
// We do not `await subprocess` during `.sendMessage()` nor `.getOneMessage()` since those methods are transient.
// Users would still need to `await subprocess` after the method is done.
// Also, this would prevent `unhandledRejection` event from being emitted, making it silent.
export const sendMessage = ({anyProcess, anyProcessSend, isSubprocess, ipc}, message) => {
	validateIpcMethod({
		methodName: 'sendMessage',
		isSubprocess,
		ipc,
		isConnected: anyProcess.connected,
	});

	return sendMessageAsync({
		anyProcess,
		anyProcessSend,
		isSubprocess,
		message,
	});
};

const sendMessageAsync = async ({anyProcess, anyProcessSend, isSubprocess, message}) => {
	const outgoingMessagesState = startSendMessage(anyProcess);
	try {
		await anyProcessSend(message);
	} catch (error) {
		disconnect(anyProcess);
		handleEpipeError(error, isSubprocess);
		handleSerializationError(error, isSubprocess, message);
		throw error;
	} finally {
		endSendMessage(outgoingMessagesState);
	}
};
