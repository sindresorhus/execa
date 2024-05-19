import {once} from 'node:events';
import {scheduler} from 'node:timers/promises';
import {waitForOutgoingMessages} from './outgoing.js';
import {redoAddedReferences} from './reference.js';

// Debounce the `message` event so it is emitted at most once per macrotask.
// This allows users to call `await getOneMessage()`/`getEachMessage()` multiple times in a row.
export const onMessage = async (anyProcess, ipcEmitter, message) => {
	if (!INCOMING_MESSAGES.has(anyProcess)) {
		INCOMING_MESSAGES.set(anyProcess, []);
	}

	const incomingMessages = INCOMING_MESSAGES.get(anyProcess);
	incomingMessages.push(message);

	if (incomingMessages.length > 1) {
		return;
	}

	while (incomingMessages.length > 0) {
		// eslint-disable-next-line no-await-in-loop
		await waitForOutgoingMessages(anyProcess);
		// eslint-disable-next-line no-await-in-loop
		await scheduler.yield();
		ipcEmitter.emit('message', incomingMessages.shift());
	}
};

const INCOMING_MESSAGES = new WeakMap();

// If the `message` event is currently debounced, the `disconnect` event must wait for it
export const onDisconnect = async ({anyProcess, channel, ipcEmitter, boundOnMessage}) => {
	const incomingMessages = INCOMING_MESSAGES.get(anyProcess);
	while (incomingMessages?.length > 0) {
		// eslint-disable-next-line no-await-in-loop
		await once(ipcEmitter, 'message');
	}

	anyProcess.removeListener('message', boundOnMessage);
	redoAddedReferences(channel);
	ipcEmitter.connected = false;
	ipcEmitter.emit('disconnect');
};
