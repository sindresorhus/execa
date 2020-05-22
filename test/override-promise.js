import path from 'path';
import test from 'ava';

process.env.PATH = path.join(__dirname, 'fixtures') + path.delimiter + process.env.PATH;

// Can't use `test.before`, because `ava` needs `Promise`.
// Can't use `import(…)` either, because `execa` is not an ES Module.
const nativePromise = Promise;
global.Promise = class BrokenPromise {
	then() {
		throw new Error('error');
	}
};
const execa = require('..');
global.Promise = nativePromise;

test('should work with third-party Promise', async t => {
	const {stdout} = await execa('noop', ['foo']);
	t.is(stdout, 'foo');
});
