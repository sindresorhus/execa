// By default, Node.js keeps the subprocess alive while it has a `message` or `disconnect` listener.
// We replicate the same logic for the events that we proxy.
// This ensures the subprocess is kept alive while `sendMessage()`, `getOneMessage()` and `getEachMessage()` are ongoing.
// See https://github.com/nodejs/node/blob/2aaeaa863c35befa2ebaa98fb7737ec84df4d8e9/lib/internal/child_process.js#L547
export const addReference = anyProcess => {
	anyProcess.channel?.refCounted();
};

export const removeReference = anyProcess => {
	anyProcess.channel?.unrefCounted();
};

// To proxy events, we setup some global listeners on the `message` and `disconnect` events.
// Those should not keep the subprocess alive, so we remove the automatic counting that Node.js is doing.
// See https://github.com/nodejs/node/blob/1b965270a9c273d4cf70e8808e9d28b9ada7844f/lib/child_process.js#L180
export const undoAddedReferences = (anyProcess, isSubprocess) => {
	if (isSubprocess) {
		removeReference(anyProcess);
		removeReference(anyProcess);
	}
};
