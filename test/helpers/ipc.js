// @todo: replace with Array.fromAsync(subprocess.getEachMessage()) after dropping support for Node <22.0.0
export const iterateAllMessages = async subprocess => {
	const messages = [];
	for await (const message of subprocess.getEachMessage()) {
		messages.push(message);
	}

	return messages;
};

export const alwaysPass = () => true;
