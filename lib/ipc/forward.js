import {EventEmitter} from 'node:events';

// By default, Node.js keeps the subprocess alive while it has a `message` or `disconnect` listener.
// This is implemented by calling `.channel.ref()` and `.channel.unref()` automatically.
// However, this prevents forwarding those events to our proxy, since that requires setting up additional listeners.
// Therefore, we need to do manual referencing counting.
// See https://github.com/nodejs/node/blob/2aaeaa863c35befa2ebaa98fb7737ec84df4d8e9/lib/internal/child_process.js#L547
export const addReference = anyProcess => {
	const referencesCount = IPC_REFERENCES.get(anyProcess) ?? 0;
	if (referencesCount === 0) {
		anyProcess.channel?.ref();
	}

	IPC_REFERENCES.set(anyProcess, referencesCount + 1);
};

export const removeReference = anyProcess => {
	const referencesCount = IPC_REFERENCES.get(anyProcess);
	if (referencesCount === 1) {
		anyProcess.channel?.unref();
	}

	IPC_REFERENCES.set(anyProcess, referencesCount - 1);
};

const IPC_REFERENCES = new WeakMap();

// Forward the `message` and `disconnect` events from the process and subprocess to a proxy emitter.
// This prevents the `error` event from stopping IPC.
export const getIpcEmitter = anyProcess => {
	if (IPC_EMITTERS.has(anyProcess)) {
		return IPC_EMITTERS.get(anyProcess);
	}

	// Use an `EventEmitter`, like the `process` that is being proxied
	// eslint-disable-next-line unicorn/prefer-event-target
	const ipcEmitter = new EventEmitter();
	IPC_EMITTERS.set(anyProcess, ipcEmitter);
	forwardEvents(ipcEmitter, anyProcess);
	return ipcEmitter;
};

const IPC_EMITTERS = new WeakMap();

// The `message` and `disconnect` events are buffered in the subprocess until the first listener is setup.
// However, unbuffering happens after one tick, so this give enough time for the caller to setup the listener on the proxy emitter first.
// See https://github.com/nodejs/node/blob/2aaeaa863c35befa2ebaa98fb7737ec84df4d8e9/lib/internal/child_process.js#L721
const forwardEvents = (ipcEmitter, anyProcess) => {
	forwardEvent(ipcEmitter, anyProcess, 'message');
	forwardEvent(ipcEmitter, anyProcess, 'disconnect');
};

const forwardEvent = (ipcEmitter, anyProcess, eventName) => {
	const eventListener = forwardListener.bind(undefined, ipcEmitter, eventName);
	anyProcess.on(eventName, eventListener);
	anyProcess.once('disconnect', cleanupListener.bind(undefined, anyProcess, eventName, eventListener));
};

const forwardListener = (ipcEmitter, eventName, payload) => {
	ipcEmitter.emit(eventName, payload);
};

const cleanupListener = (anyProcess, eventName, eventListener) => {
	anyProcess.removeListener(eventName, eventListener);
};
