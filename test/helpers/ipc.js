import {getEachMessage} from '../../index.js';
import {foobarString} from './input.js';

// @todo: replace with Array.fromAsync(subprocess.getEachMessage()) after dropping support for Node <22.0.0
export const iterateAllMessages = async subprocess => {
	const messages = await Array.fromAsync(subprocess.getEachMessage());

	return messages;
};

export const subprocessGetFirst = async subprocess => {
	const [firstMessage] = await iterateAllMessages(subprocess);
	return firstMessage;
};

export const getFirst = async () => {
	// eslint-disable-next-line no-unreachable-loop
	for await (const message of getEachMessage()) {
		return message;
	}
};

export const subprocessGetOne = (subprocess, options) => subprocess.getOneMessage(options);

export const isAlwaysTrue = () => true;

// `process.send()` can fail due to I/O errors.
// However, I/O errors are seldom and hard to trigger predictably.
// So we mock them.
export const mockSendIoError = anyProcess => {
	const error = new Error(foobarString);
	const target = anyProcess.nodeChildProcess ?? anyProcess;
	target.send = () => {
		throw error;
	};

	return error;
};
