import {createDeferred} from '../utils/deferred.js';
import {SUBPROCESS_OPTIONS} from '../arguments/fd-options.js';

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

// Await while `sendMessage()` is ongoing, unless there is already a `message` listener
export const waitForOutgoingMessages = async (anyProcess, ipcEmitter) => {
	while (!hasMessageListeners(anyProcess, ipcEmitter) && OUTGOING_MESSAGES.get(anyProcess)?.size > 0) {
		// eslint-disable-next-line no-await-in-loop
		await Promise.all(OUTGOING_MESSAGES.get(anyProcess));
	}
};

const OUTGOING_MESSAGES = new WeakMap();

// Whether any `message` listener is setup
export const hasMessageListeners = (anyProcess, ipcEmitter) => ipcEmitter.listenerCount('message') > getMinListenerCount(anyProcess);

// When `buffer` is `false`, we set up a `message` listener that should be ignored.
// That listener is only meant to intercept `strict` acknowledgement responses.
const getMinListenerCount = anyProcess => SUBPROCESS_OPTIONS.has(anyProcess)
	&& !SUBPROCESS_OPTIONS.get(anyProcess).options.buffer.at(-1)
	? 1
	: 0;
