import {EventEmitter, once} from 'node:events';
import {onMessage, onDisconnect} from './incoming.js';
import {undoAddedReferences} from './reference.js';

// Forward the `message` and `disconnect` events from the process and subprocess to a proxy emitter.
// This prevents the `error` event from stopping IPC.
// This also allows debouncing the `message` event.
export const getIpcEmitter = (anyProcess, isSubprocess) => {
	if (IPC_EMITTERS.has(anyProcess)) {
		return IPC_EMITTERS.get(anyProcess);
	}

	// Use an `EventEmitter`, like the `process` that is being proxied
	// eslint-disable-next-line unicorn/prefer-event-target
	const ipcEmitter = new EventEmitter();
	ipcEmitter.connected = true;
	IPC_EMITTERS.set(anyProcess, ipcEmitter);
	forwardEvents(ipcEmitter, anyProcess, isSubprocess);
	return ipcEmitter;
};

const IPC_EMITTERS = new WeakMap();

// The `message` and `disconnect` events are buffered in the subprocess until the first listener is setup.
// However, unbuffering happens after one tick, so this give enough time for the caller to setup the listener on the proxy emitter first.
// See https://github.com/nodejs/node/blob/2aaeaa863c35befa2ebaa98fb7737ec84df4d8e9/lib/internal/child_process.js#L721
const forwardEvents = (ipcEmitter, anyProcess, isSubprocess) => {
	const boundOnMessage = onMessage.bind(undefined, anyProcess, ipcEmitter);
	anyProcess.on('message', boundOnMessage);
	anyProcess.once('disconnect', onDisconnect.bind(undefined, {anyProcess, ipcEmitter, boundOnMessage}));
	undoAddedReferences(anyProcess, isSubprocess);
};

// Check whether there might still be some `message` events to receive
export const isConnected = anyProcess => {
	const ipcEmitter = IPC_EMITTERS.get(anyProcess);
	return ipcEmitter === undefined
		? anyProcess.channel !== null
		: ipcEmitter.connected;
};

// Wait for `disconnect` event, including debounced messages processing during disconnection.
// But does not set up message proxying.
export const waitForDisconnect = async subprocess => {
	// Unlike `once()`, this does not stop on `error` events
	await new Promise(resolve => {
		subprocess.once('disconnect', resolve);
	});

	const ipcEmitter = IPC_EMITTERS.get(subprocess);
	if (ipcEmitter === undefined || !ipcEmitter.connected) {
		return;
	}

	// This never emits an `error` event
	await once(ipcEmitter, 'disconnect');
};
