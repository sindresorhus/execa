import {getEachMessage} from '../../index.js';

// @todo: replace with Array.fromAsync(subprocess.getEachMessage()) after dropping support for Node <22.0.0
export const iterateAllMessages = async subprocess => {
	const messages = [];
	for await (const message of subprocess.getEachMessage()) {
		messages.push(message);
	}

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

export const alwaysPass = () => true;
