import assert from 'node:assert/strict';
import test from 'node:test';
import {assertThrows} from '../helpers/assert.js';
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

const testVerboseGeneral = async execaMethod => {
	const {all} = await execaMethod('verbose-script.js', {env: {NODE_DEBUG: 'execa'}, all: true});
	assert.deepEqual(getNormalizedLines(all), [
		`${testTimestamp} [0] $ node -e ${QUOTE}console.error(1)${QUOTE}`,
		'1',
		`${testTimestamp} [0] √ (done in 0ms)`,
		`${testTimestamp} [1] $ node -e ${QUOTE}process.exit(2)${QUOTE}`,
		`${testTimestamp} [1] ‼ Command failed with exit code 2: node -e ${QUOTE}process.exit(2)${QUOTE}`,
		`${testTimestamp} [1] ‼ (done in 0ms)`,
	]);
};

test('Prints command, NODE_DEBUG=execa + "inherit"', () => testVerboseGeneral(execa));
test('Prints command, NODE_DEBUG=execa + "inherit", sync', () => testVerboseGeneral(execaSync));

test('NODE_DEBUG=execa changes verbose default value to "full"', async () => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {}, {env: {NODE_DEBUG: 'execa'}});
	assert.equal(getCommandLine(stderr), `${testTimestamp} [0] $ noop.js ${foobarString}`);
	assert.equal(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
});

const testDebugEnvPriority = async isSync => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {verbose: 'short', isSync}, {env: {NODE_DEBUG: 'execa'}});
	assert.equal(getCommandLine(stderr), `${testTimestamp} [0] $ noop.js ${foobarString}`);
	assert.equal(getOutputLine(stderr), undefined);
};

test('NODE_DEBUG=execa has lower priority', () => testDebugEnvPriority(false));
test('NODE_DEBUG=execa has lower priority, sync', () => testDebugEnvPriority(true));

const invalidFalseMessage = 'renamed to "verbose: \'none\'"';
const invalidTrueMessage = 'renamed to "verbose: \'short\'"';
const invalidUnknownMessage = 'Allowed values are: \'none\', \'short\', \'full\'';

const testInvalidVerbose = (verbose, expectedMessage, execaMethod) => {
	const {message} = assertThrows(() => {
		execaMethod('empty.js', {verbose});
	});
	assert.ok(message.includes(expectedMessage));
};

test('Does not allow "verbose: false"', () => testInvalidVerbose(false, invalidFalseMessage, execa));
test('Does not allow "verbose: false", sync', () => testInvalidVerbose(false, invalidFalseMessage, execaSync));
test('Does not allow "verbose: true"', () => testInvalidVerbose(true, invalidTrueMessage, execa));
test('Does not allow "verbose: true", sync', () => testInvalidVerbose(true, invalidTrueMessage, execaSync));
test('Does not allow "verbose: \'unknown\'"', () => testInvalidVerbose('unknown', invalidUnknownMessage, execa));
test('Does not allow "verbose: \'unknown\'", sync', () => testInvalidVerbose('unknown', invalidUnknownMessage, execaSync));

const testValidationError = async isSync => {
	const {stderr, nestedResult} = await nestedSubprocess('empty.js', {verbose: 'full', isSync, timeout: []});
	assert.deepEqual(getNormalizedLines(stderr), [`${testTimestamp} [0] $ empty.js`]);
	assert.ok(nestedResult instanceof Error);
};

test('Prints validation errors', () => testValidationError(false));
test('Prints validation errors, sync', () => testValidationError(true));

test('Prints early spawn errors', async () => {
	const {stderr} = await nestedSubprocess('empty.js', {...earlyErrorOptions, verbose: 'full'});
	assert.deepEqual(getNormalizedLines(stderr), [
		`${testTimestamp} [0] $ empty.js`,
		`${testTimestamp} [0] × Command failed with ERR_INVALID_ARG_TYPE: empty.js`,
		`${testTimestamp} [0] × The "options.detached" property must be of type boolean. Received type string ('true')`,
		`${testTimestamp} [0] × (done in 0ms)`,
	]);
});

test('Prints early spawn errors, sync', async () => {
	const {stderr} = await nestedSubprocess('empty.js', {...earlyErrorOptionsSync, verbose: 'full', isSync: true});
	assert.deepEqual(getNormalizedLines(stderr), [
		`${testTimestamp} [0] $ empty.js`,
		`${testTimestamp} [0] × Command failed with ERR_INVALID_ARG_TYPE: empty.js`,
		`${testTimestamp} [0] × The "options.windowsHide" property must be of type boolean. Received type string ('true')`,
		`${testTimestamp} [0] × (done in 0ms)`,
	]);
});
