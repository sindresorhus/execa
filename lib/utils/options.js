// The options of methods like `subprocess.pipe()`, `subprocess.readable()` or `sendMessage()` are kept on a null-prototype object, otherwise a polluted `Object.prototype` would inject option values.
// Like destructuring them, `null` throws.
export const copyOptions = (options = {}) => {
	if (options === null) {
		throw new TypeError('The options must be an object, not `null`.');
	}

	return {__proto__: null, ...options};
};
