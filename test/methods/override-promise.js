import assert from 'node:assert/strict';
import test from 'node:test';
// The helper module overrides Promise on import so has to be imported before `execa`.
import {restorePromise} from '../helpers/override-promise.js';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';

restorePromise();
setFixtureDirectory();

test('should work with third-party Promise', async () => {
	const {stdout} = await execa('noop.js', ['foo']);
	assert.equal(stdout, 'foo');
});
