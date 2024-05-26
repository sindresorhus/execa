import {promisify} from 'node:util';
import {
	validateIpcMethod,
	handleEpipeError,
	handleSerializationError,
	disconnect,
} from './validation.js';
import {startSendMessage, endSendMessage} from './outgoing.js';
import {handleSendStrict, waitForStrictResponse} from './strict.js';

// Like `[sub]process.send()` but promise-based.
// We do not `await subprocess` during `.sendMessage()` nor `.getOneMessage()` since those methods are transient.
// Users would still need to `await subprocess` after the method is done.
// Also, this would prevent `unhandledRejection` event from being emitted, making it silent.
export const sendMessage = ({anyProcess, channel, isSubprocess, ipc}, message, {strict = false} = {}) => {
	validateIpcMethod({
		methodName: 'sendMessage',
		isSubprocess,
		ipc,
		isConnected: anyProcess.connected,
	});

	return sendMessageAsync({
		anyProcess,
		channel,
		isSubprocess,
		message,
		strict,
	});
};

const sendMessageAsync = async ({anyProcess, channel, isSubprocess, message, strict}) => {
	const outgoingMessagesState = startSendMessage(anyProcess);
	const sendMethod = getSendMethod(anyProcess);
	const wrappedMessage = handleSendStrict({
		anyProcess,
		channel,
		isSubprocess,
		message,
		strict,
	});

	try {
		await Promise.all([
			waitForStrictResponse(wrappedMessage, anyProcess, isSubprocess),
			sendMethod(wrappedMessage),
		]);
	} catch (error) {
		disconnect(anyProcess);
		handleEpipeError(error, isSubprocess);
		handleSerializationError(error, isSubprocess, message);
		throw error;
	} finally {
		endSendMessage(outgoingMessagesState);
	}
};

// [sub]process.send() promisified, memoized
const getSendMethod = anyProcess => {
	if (PROCESS_SEND_METHODS.has(anyProcess)) {
		return PROCESS_SEND_METHODS.get(anyProcess);
	}

	const sendMethod = promisify(anyProcess.send.bind(anyProcess));
	PROCESS_SEND_METHODS.set(anyProcess, sendMethod);
	return sendMethod;
};

const PROCESS_SEND_METHODS = new WeakMap();
