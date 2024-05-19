import {once} from 'node:events';
import {createDeferred} from '../utils/deferred.js';
import {SUBPROCESS_OPTIONS} from '../arguments/fd-options.js';
import {incrementMaxListeners} from '../utils/max-listeners.js';
import {sendMessage} from './send.js';
import {throwOnMissingStrict, throwOnStrictDisconnect} from './validation.js';
import {getIpcEmitter} from './forward.js';

// When using the `strict` option, wrap the message with metadata during `sendMessage()`
export const handleSendStrict = ({anyProcess, channel, isSubprocess, message, strict}) => {
	if (!strict) {
		return message;
	}

	getIpcEmitter(anyProcess, channel, isSubprocess);
	return {id: count++, type: REQUEST_TYPE, message};
};

let count = 0n;

// The other process then sends the acknowledgment back as a response
export const handleStrictRequest = async ({wrappedMessage, anyProcess, channel, isSubprocess, ipcEmitter}) => {
	if (wrappedMessage?.type !== REQUEST_TYPE) {
		return wrappedMessage;
	}

	const {id, message} = wrappedMessage;
	const hasListeners = ipcEmitter.listenerCount('message') > getMinListenerCount(anyProcess);
	const response = {id, type: RESPONSE_TYPE, message: hasListeners};

	try {
		await sendMessage({
			anyProcess,
			channel,
			isSubprocess,
			ipc: true,
		}, response);
	} catch (error) {
		ipcEmitter.emit('strict:error', error);
	}

	return message;
};

// When `buffer` is `false`, we set up a `message` listener that should be ignored.
// That listener is only meant to intercept `strict` acknowledgement responses.
const getMinListenerCount = anyProcess => SUBPROCESS_OPTIONS.has(anyProcess)
	&& !SUBPROCESS_OPTIONS.get(anyProcess).options.buffer.at(-1)
	? 1
	: 0;

// Reception of the acknowledgment response
export const handleStrictResponse = wrappedMessage => {
	if (wrappedMessage?.type !== RESPONSE_TYPE) {
		return false;
	}

	const {id, message: hasListeners} = wrappedMessage;
	STRICT_RESPONSES[id].resolve(hasListeners);
	return true;
};

// Wait for the other process to receive the message from `sendMessage()`
export const waitForStrictResponse = async (wrappedMessage, anyProcess, isSubprocess) => {
	if (wrappedMessage?.type !== REQUEST_TYPE) {
		return;
	}

	const deferred = createDeferred();
	STRICT_RESPONSES[wrappedMessage.id] = deferred;

	try {
		const controller = new AbortController();
		const hasListeners = await Promise.race([
			deferred,
			throwOnDisconnect(anyProcess, isSubprocess, controller),
		]);
		controller.abort();

		if (!hasListeners) {
			throwOnMissingStrict(isSubprocess);
		}
	} finally {
		delete STRICT_RESPONSES[wrappedMessage.id];
	}
};

const STRICT_RESPONSES = {};

const throwOnDisconnect = async (anyProcess, isSubprocess, {signal}) => {
	incrementMaxListeners(anyProcess, 1, signal);
	await once(anyProcess, 'disconnect', {signal});
	throwOnStrictDisconnect(isSubprocess);
};

const REQUEST_TYPE = 'execa:ipc:request';
const RESPONSE_TYPE = 'execa:ipc:response';
