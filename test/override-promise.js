import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import test from 'ava';

process.env.PATH = fileURLToPath(new URL('./fixtures', import.meta.url)) + path.delimiter + process.env.PATH;

// Can't use `test.before`, because `ava` needs `Promise`.
const nativePromise = Promise;
global.Promise = class BrokenPromise {
	then() {
		throw new Error('error');
	}
};
// eslint-disable-next-line node/no-unsupported-features/es-syntax
const {execa} = await import('../index.js');

global.Promise = nativePromise;

test('should work with third-party Promise', async t => {
	const {stdout} = await execa('noop.js', ['foo']);
	t.is(stdout, 'foo');
});
