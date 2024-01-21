import test from 'ava';
import {execa} from '../index.js';
import {setFixtureDir} from './helpers/fixtures-dir.js';

setFixtureDir();

const normalizeTimestamp = output => output.replaceAll(/\d/g, '0');
const testTimestamp = '[00:00:00.000]';

test('Prints command when "verbose" is true', async t => {
	const {stdout, stderr} = await execa('nested.js', [JSON.stringify({verbose: true, stdio: 'inherit'}), 'noop.js', 'test'], {all: true});
	t.is(stdout, 'test');
	t.is(normalizeTimestamp(stderr), `${testTimestamp} noop.js test`);
});

test('Prints command with NODE_DEBUG=execa', async t => {
	const {stdout, stderr} = await execa('nested.js', [JSON.stringify({stdio: 'inherit'}), 'noop.js', 'test'], {all: true, env: {NODE_DEBUG: 'execa'}});
	t.is(stdout, 'test');
	t.is(normalizeTimestamp(stderr), `${testTimestamp} noop.js test`);
});

test('Escape verbose command', async t => {
	const {stderr} = await execa('nested.js', [JSON.stringify({verbose: true, stdio: 'inherit'}), 'noop.js', 'one two', '"'], {all: true});
	t.true(stderr.endsWith('"one two" "\\""'));
});

test('Verbose option works with inherit', async t => {
	const {all} = await execa('verbose-script.js', {all: true, env: {NODE_DEBUG: 'execa'}});
	t.is(normalizeTimestamp(all), `${testTimestamp} node -e "console.error(\\"one\\")"
one
${testTimestamp} node -e "console.error(\\"two\\")"
two`);
});
