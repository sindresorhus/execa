import test from 'ava';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {execa, execaSync} from '../../index.js';
import {foobarString} from '../helpers/input.js';
import {nestedSubprocess} from '../helpers/nested.js';
import {
	QUOTE,
	getCommandLine,
	getOutputLine,
	getNormalizedLines,
	testTimestamp,
} from '../helpers/verbose.js';
import {earlyErrorOptions, earlyErrorOptionsSync} from '../helpers/early-error.js';

setFixtureDirectory();

const testVerboseGeneral = async (t, execaMethod) => {
	const {all} = await execaMethod('verbose-script.js', {env: {NODE_DEBUG: 'execa'}, all: true});
	t.deepEqual(getNormalizedLines(all), [
		`${testTimestamp} [0] $ node -e ${QUOTE}console.error(1)${QUOTE}`,
		'1',
		`${testTimestamp} [0] √ (done in 0ms)`,
		`${testTimestamp} [1] $ node -e ${QUOTE}process.exit(2)${QUOTE}`,
		`${testTimestamp} [1] ‼ Command failed with exit code 2: node -e ${QUOTE}process.exit(2)${QUOTE}`,
		`${testTimestamp} [1] ‼ (done in 0ms)`,
	]);
};

test('Prints command, NODE_DEBUG=execa + "inherit"', testVerboseGeneral, execa);
test('Prints command, NODE_DEBUG=execa + "inherit", sync', testVerboseGeneral, execaSync);

test('NODE_DEBUG=execa changes verbose default value to "full"', async t => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {}, {env: {NODE_DEBUG: 'execa'}});
	t.is(getCommandLine(stderr), `${testTimestamp} [0] $ noop.js ${foobarString}`);
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
});

const testDebugEnvPriority = async (t, isSync) => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {verbose: 'short', isSync}, {env: {NODE_DEBUG: 'execa'}});
	t.is(getCommandLine(stderr), `${testTimestamp} [0] $ noop.js ${foobarString}`);
	t.is(getOutputLine(stderr), undefined);
};

test('NODE_DEBUG=execa has lower priority', testDebugEnvPriority, false);
test('NODE_DEBUG=execa has lower priority, sync', testDebugEnvPriority, true);

const invalidFalseMessage = 'renamed to "verbose: \'none\'"';
const invalidTrueMessage = 'renamed to "verbose: \'short\'"';
const invalidUnknownMessage = 'Allowed values are: \'none\', \'short\', \'full\'';

const testInvalidVerbose = (t, verbose, expectedMessage, execaMethod) => {
	const {message} = t.throws(() => {
		execaMethod('empty.js', {verbose});
	});
	t.true(message.includes(expectedMessage));
};

test('Does not allow "verbose: false"', testInvalidVerbose, false, invalidFalseMessage, execa);
test('Does not allow "verbose: false", sync', testInvalidVerbose, false, invalidFalseMessage, execaSync);
test('Does not allow "verbose: true"', testInvalidVerbose, true, invalidTrueMessage, execa);
test('Does not allow "verbose: true", sync', testInvalidVerbose, true, invalidTrueMessage, execaSync);
test('Does not allow "verbose: \'unknown\'"', testInvalidVerbose, 'unknown', invalidUnknownMessage, execa);
test('Does not allow "verbose: \'unknown\'", sync', testInvalidVerbose, 'unknown', invalidUnknownMessage, execaSync);

const testValidationError = async (t, isSync) => {
	const {stderr, nestedResult} = await nestedSubprocess('empty.js', {verbose: 'full', isSync, timeout: []});
	t.deepEqual(getNormalizedLines(stderr), [`${testTimestamp} [0] $ empty.js`]);
	t.true(nestedResult instanceof Error);
};

test('Prints validation errors', testValidationError, false);
test('Prints validation errors, sync', testValidationError, true);

test('Prints early spawn errors', async t => {
	const {stderr} = await nestedSubprocess('empty.js', {...earlyErrorOptions, verbose: 'full'});
	t.deepEqual(getNormalizedLines(stderr), [
		`${testTimestamp} [0] $ empty.js`,
		`${testTimestamp} [0] × Command failed with ERR_INVALID_ARG_TYPE: empty.js`,
		`${testTimestamp} [0] × The "options.detached" property must be of type boolean. Received type string ('true')`,
		`${testTimestamp} [0] × (done in 0ms)`,
	]);
});

test('Prints early spawn errors, sync', async t => {
	const {stderr} = await nestedSubprocess('empty.js', {...earlyErrorOptionsSync, verbose: 'full', isSync: true});
	t.deepEqual(getNormalizedLines(stderr), [
		`${testTimestamp} [0] $ empty.js`,
		`${testTimestamp} [0] × Command failed with ERR_OUT_OF_RANGE: empty.js`,
		`${testTimestamp} [0] × The value of "options.maxBuffer" is out of range. It must be a positive number. Received false`,
		`${testTimestamp} [0] × (done in 0ms)`,
	]);
});
