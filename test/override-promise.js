import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import test from 'ava';
// The helper module overrides Promise on import so has to be imported before `execa`.
import {restorePromise} from './helpers/override-promise.js';
// eslint-disable-next-line import/order
import {execa} from '../index.js';

restorePromise();

process.env.PATH = fileURLToPath(new URL('fixtures', import.meta.url)) + path.delimiter + process.env.PATH;

test('should work with third-party Promise', async t => {
	const {stdout} = await execa('noop.js', ['foo']);
	t.is(stdout, 'foo');
});
