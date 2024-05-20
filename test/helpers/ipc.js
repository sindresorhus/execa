import isPlainObj from 'is-plain-obj';

export const subprocessGetOne = (subprocess, options) => subprocess.getOneMessage(options);

export const subprocessSendGetOne = async (subprocess, message) => {
	const [response] = await Promise.all([
		subprocess.getOneMessage(),
		subprocess.sendMessage(message),
	]);
	return response;
};

export const subprocessExchange = (subprocess, messageOrOptions) => isPlainObj(messageOrOptions)
	? subprocess.exchangeMessage('.', messageOrOptions)
	: subprocess.exchangeMessage(messageOrOptions);

// @todo: replace with Array.fromAsync(subprocess.getEachMessage()) after dropping support for Node <22.0.0
export const iterateAllMessages = async subprocess => {
	const messages = [];
	for await (const message of subprocess.getEachMessage()) {
		messages.push(message);
	}

	return messages;
};

export const alwaysPass = () => true;
