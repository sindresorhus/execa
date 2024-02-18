export const getFinalError = (initialError, message) => {
	const error = createFinalError(initialError, message);
	previousErrors.add(error);
	return error;
};

const createFinalError = (error, message) => {
	if (!isErrorInstance(error)) {
		return new Error(message);
	}

	return previousErrors.has(error)
		? cloneError(error, message)
		: setErrorMessage(error, message);
};

export const isErrorInstance = value => Object.prototype.toString.call(value) === '[object Error]';

const cloneError = (oldError, newMessage) => {
	const {name, message, stack} = oldError;
	const error = new Error(newMessage);
	error.stack = fixStack(stack, message, newMessage);
	Object.defineProperty(error, 'name', {value: name, enumerable: false, configurable: true, writable: true});
	copyErrorProperties(error, oldError);
	return error;
};

const copyErrorProperties = (newError, previousError) => {
	for (const propertyName of COPIED_ERROR_PROPERTIES) {
		const descriptor = Object.getOwnPropertyDescriptor(previousError, propertyName);
		if (descriptor !== undefined) {
			Object.defineProperty(newError, propertyName, descriptor);
		}
	}
};

// Known error properties
const COPIED_ERROR_PROPERTIES = [
	'cause',
	'errors',
	'code',
	'errno',
	'syscall',
	'path',
	'dest',
	'address',
	'port',
	'info',
];

// Sets `error.message`.
// Fixes `error.stack` not being updated when it has been already accessed, since it is memoized by V8.
// For example, this happens when calling `stream.destroy(error)`.
// See https://github.com/nodejs/node/issues/51715
const setErrorMessage = (error, newMessage) => {
	const {message, stack} = error;
	error.message = newMessage;
	error.stack = fixStack(stack, message, newMessage);
	return error;
};

const fixStack = (stack, message, newMessage) => stack.includes(newMessage)
	? stack
	: stack.replace(`: ${message}`, `: ${newMessage}`);

// Two `execa()` calls might return the same error.
// So we must close those before directly mutating them.
export const isPreviousError = error => previousErrors.has(error);

const previousErrors = new WeakSet();
