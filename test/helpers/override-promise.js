// Can't use `test.before`, because `ava` needs `Promise`.
const nativePromise = Promise;
global.Promise = class BrokenPromise {
	then() { // eslint-disable-line unicorn/no-thenable
		throw new Error('error');
	}
};

export function restorePromise() {
	global.Promise = nativePromise;
}
