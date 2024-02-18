import test from 'ava';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {execa} from '../../index.js';
import {foobarString} from '../helpers/input.js';
import {
	QUOTE,
	nestedExecaAsync,
	nestedExecaSync,
	getCommandLine,
	getOutputLine,
	getNormalizedLines,
	testTimestamp,
} from '../helpers/verbose.js';

setFixtureDir();

test('Prints command, NODE_DEBUG=execa + "inherit"', async t => {
	const {all} = await execa('verbose-script.js', {env: {NODE_DEBUG: 'execa'}, all: true});
	t.deepEqual(getNormalizedLines(all), [
		`${testTimestamp} [0] $ node -e ${QUOTE}console.error(1)${QUOTE}`,
		'1',
		`${testTimestamp} [0] √ (done in 0ms)`,
		`${testTimestamp} [1] $ node -e ${QUOTE}process.exit(2)${QUOTE}`,
		`${testTimestamp} [1] ‼ Command failed with exit code 2: node -e ${QUOTE}process.exit(2)${QUOTE}`,
		`${testTimestamp} [1] ‼ (done in 0ms)`,
	]);
});

test('NODE_DEBUG=execa changes verbose default value to "full"', async t => {
	const {stderr} = await nestedExecaAsync('noop.js', [foobarString], {}, {env: {NODE_DEBUG: 'execa'}});
	t.is(getCommandLine(stderr), `${testTimestamp} [0] $ noop.js ${foobarString}`);
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
});

const testDebugEnvPriority = async (t, execaMethod) => {
	const {stderr} = await execaMethod('noop.js', [foobarString], {verbose: 'short'}, {env: {NODE_DEBUG: 'execa'}});
	t.is(getCommandLine(stderr), `${testTimestamp} [0] $ noop.js ${foobarString}`);
	t.is(getOutputLine(stderr), undefined);
};

test('NODE_DEBUG=execa has lower priority', testDebugEnvPriority, nestedExecaAsync);
test('NODE_DEBUG=execa has lower priority, sync', testDebugEnvPriority, nestedExecaSync);
