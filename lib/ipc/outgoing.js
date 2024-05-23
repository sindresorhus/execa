import {createDeferred} from '../utils/deferred.js';

// When `sendMessage()` is ongoing, any `message` being received waits before being emitted.
// This allows calling one or multiple `await sendMessage()` followed by `await getOneMessage()`/`await getEachMessage()`.
// Without running into a race condition when the other process sends a response too fast, before the current process set up a listener.
export const startSendMessage = anyProcess => {
	if (!OUTGOING_MESSAGES.has(anyProcess)) {
		OUTGOING_MESSAGES.set(anyProcess, new Set());
	}

	const outgoingMessages = OUTGOING_MESSAGES.get(anyProcess);
	const onMessageSent = createDeferred();
	outgoingMessages.add(onMessageSent);
	return {outgoingMessages, onMessageSent};
};

export const endSendMessage = ({outgoingMessages, onMessageSent}) => {
	outgoingMessages.delete(onMessageSent);
	onMessageSent.resolve();
};

// Await while `sendMessage()` is ongoing
export const waitForOutgoingMessages = async anyProcess => {
	while (OUTGOING_MESSAGES.get(anyProcess)?.size > 0) {
		// eslint-disable-next-line no-await-in-loop
		await Promise.all(OUTGOING_MESSAGES.get(anyProcess));
	}
};

const OUTGOING_MESSAGES = new WeakMap();
