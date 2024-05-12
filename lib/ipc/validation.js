// Better error message when forgetting to set `ipc: true` and using the IPC methods
export const validateIpcOption = (methodName, isSubprocess, ipc) => {
	if (!ipc) {
		throw new Error(`${getNamespaceName(isSubprocess)}${methodName}() can only be used if the \`ipc\` option is \`true\`.`);
	}
};

// Better error message when one process does not send/receive messages once the other process has disconnected.
// This also makes it clear that any buffered messages are lost once either process has disconnected.
export const validateConnection = (methodName, isSubprocess, isConnected) => {
	if (!isConnected) {
		throw new Error(`${getNamespaceName(isSubprocess)}${methodName}() cannot be used: the ${getOtherProcessName(isSubprocess)} has already exited or disconnected.`);
	}
};

const getNamespaceName = isSubprocess => isSubprocess ? '' : 'subprocess.';

const getOtherProcessName = isSubprocess => isSubprocess ? 'parent process' : 'subprocess';

// Better error message when sending messages which cannot be serialized.
// Works with both `serialization: 'advanced'` and `serialization: 'json'`.
export const handleSerializationError = (error, isSubprocess, message) => {
	if (isSerializationError(error)) {
		error.message = `${getNamespaceName(isSubprocess)}sendMessage()'s argument type is invalid: the message cannot be serialized: ${String(message)}.\n${error.message}`;
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
