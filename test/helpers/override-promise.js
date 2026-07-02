// Can't use `test.before`, because `ava` needs `Promise`.
const nativePromise = Promise;
// eslint-disable-next-line unicorn/no-global-object-property-assignment -- intentionally mocking the global `Promise`
globalThis.Promise = class BrokenPromise {
	then() { // eslint-disable-line unicorn/no-thenable
		throw new Error('error');
	}
};

export function restorePromise() {
	// eslint-disable-next-line unicorn/no-global-object-property-assignment -- restoring the mocked global `Promise`
	globalThis.Promise = nativePromise;
}
