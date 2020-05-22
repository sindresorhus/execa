import test from 'ava';

// Can't use `test.before`, maybe because `ava` need `Promise`
// Can't use `import('..')` too, unknown reason
const nativePromise = Promise;
global.Promise = class BrokenPromise {
	then() {
		throw new Error('error');
	}
};
const execa = require('..');
global.Promise = nativePromise;

test('Should work with third party Promise', async t => {
	const {stdout} = await execa('echo execa');
	t.is(stdout, 'execa');
});
