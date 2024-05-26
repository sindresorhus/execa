// Validate the IPC channel is connected before receiving/sending messages
export const validateIpcMethod = ({methodName, isSubprocess, ipc, isConnected}) => {
	validateIpcOption(methodName, isSubprocess, ipc);
	validateConnection(methodName, isSubprocess, isConnected);
};

// Better error message when forgetting to set `ipc: true` and using the IPC methods
const validateIpcOption = (methodName, isSubprocess, ipc) => {
	if (!ipc) {
		throw new Error(`${getNamespaceName(isSubprocess)}${methodName}() can only be used if the \`ipc\` option is \`true\`.`);
	}
};

// Better error message when one process does not send/receive messages once the other process has disconnected.
// This also makes it clear that any buffered messages are lost once either process has disconnected.
const validateConnection = (methodName, isSubprocess, isConnected) => {
	if (!isConnected) {
		throw new Error(`${getNamespaceName(isSubprocess)}${methodName}() cannot be used: the ${getOtherProcessName(isSubprocess)} has already exited or disconnected.`);
	}
};

// When `getOneMessage()` could not complete due to an early disconnection
export const throwOnEarlyDisconnect = isSubprocess => {
	throw new Error(`${getNamespaceName(isSubprocess)}getOneMessage() could not complete: the ${getOtherProcessName(isSubprocess)} exited or disconnected.`);
};

// When the other process used `strict` but the current process had I/O error calling `sendMessage()` for the response
export const getStrictResponseError = (error, isSubprocess) => new Error(`${getNamespaceName(isSubprocess)}sendMessage() failed when sending an acknowledgment response to the ${getOtherProcessName(isSubprocess)}.`, {cause: error});

// When using `strict` but the other process was not listening for messages
export const throwOnMissingStrict = isSubprocess => {
	throw new Error(`${getNamespaceName(isSubprocess)}sendMessage() failed: the ${getOtherProcessName(isSubprocess)} is not listening to incoming messages.`);
};

// When using `strict` but the other process disconnected before receiving the message
export const throwOnStrictDisconnect = isSubprocess => {
	throw new Error(`${getNamespaceName(isSubprocess)}sendMessage() failed: the ${getOtherProcessName(isSubprocess)} exited without listening to incoming messages.`);
};

const getNamespaceName = isSubprocess => isSubprocess ? '' : 'subprocess.';

const getOtherProcessName = isSubprocess => isSubprocess ? 'parent process' : 'subprocess';

// EPIPE can happen when sending a message to a subprocess that is closing but has not disconnected yet
export const handleEpipeError = (error, isSubprocess) => {
	if (error.code === 'EPIPE') {
		throw new Error(`${getNamespaceName(isSubprocess)}sendMessage() cannot be used: the ${getOtherProcessName(isSubprocess)} is disconnecting.`, {cause: error});
	}
};

// Better error message when sending messages which cannot be serialized.
// Works with both `serialization: 'advanced'` and `serialization: 'json'`.
export const handleSerializationError = (error, isSubprocess, message) => {
	if (isSerializationError(error)) {
		throw new Error(`${getNamespaceName(isSubprocess)}sendMessage()'s argument type is invalid: the message cannot be serialized: ${String(message)}.`, {cause: error});
	}
};

const isSerializationError = ({code, message}) => SERIALIZATION_ERROR_CODES.has(code)
	|| SERIALIZATION_ERROR_MESSAGES.some(serializationErrorMessage => message.includes(serializationErrorMessage));

// `error.code` set by Node.js when it failed to serialize the message
const SERIALIZATION_ERROR_CODES = new Set([
	// Message is `undefined`
	'ERR_MISSING_ARGS',
	// Message is a function, a bigint, a symbol
	'ERR_INVALID_ARG_TYPE',
]);

// `error.message` set by Node.js when it failed to serialize the message
const SERIALIZATION_ERROR_MESSAGES = [
	// Message is a promise or a proxy, with `serialization: 'advanced'`
	'could not be cloned',
	// Message has cycles, with `serialization: 'json'`
	'circular structure',
	// Message has cycles inside toJSON(), with `serialization: 'json'`
	'call stack size exceeded',
];

// When any error arises, we disconnect the IPC.
// Otherwise, it is likely that one of the processes will stop sending/receiving messages.
// This would leave the other process hanging.
export const disconnect = anyProcess => {
	if (anyProcess.connected) {
		anyProcess.disconnect();
	}
};
