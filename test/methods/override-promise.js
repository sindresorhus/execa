import test from 'ava';
// The helper module overrides Promise on import so has to be imported before `execa`.
import {restorePromise} from '../helpers/override-promise.js';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';

restorePromise();
setFixtureDir();

test('should work with third-party Promise', async t => {
	const {stdout} = await execa('noop.js', ['foo']);
	t.is(stdout, 'foo');
});
