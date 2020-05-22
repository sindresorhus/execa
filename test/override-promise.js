import path from 'path';
import test from 'ava';

process.env.PATH = path.join(__dirname, 'fixtures') + path.delimiter + process.env.PATH;

// Can't use `test.before`, maybe because `ava` need `Promise`
// Can't use `import('..')` too, because `execa` is not ES Module
const nativePromise = Promise;
global.Promise = class BrokenPromise {
	then() {
		throw new Error('error');
	}
};
const execa = require('..');
global.Promise = nativePromise;

test('Should work with third party Promise', async t => {
	const {stdout} = await execa('noop', ['foo']);
	t.is(stdout, 'foo');
});
