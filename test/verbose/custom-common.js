import assert from 'node:assert/strict';
import test from 'node:test';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {nestedSubprocess} from '../helpers/nested.js';
import {QUOTE, getCommandLine, testTimestamp} from '../helpers/verbose.js';

setFixtureDirectory();

const testCustomReturn = async (verboseOutput, expectedOutput) => {
	const {stderr} = await nestedSubprocess(
		'empty.js',
		{optionsFixture: 'custom-return.js', optionsInput: {verboseOutput}},
		{stripFinalNewline: false},
	);
	assert.equal(stderr, expectedOutput);
};

test('"verbose" returning a string prints it', () => testCustomReturn(`${foobarString}\n`, `${foobarString}\n`));
test('"verbose" returning a string without a newline adds it', () => testCustomReturn(foobarString, `${foobarString}\n`));
test('"verbose" returning a string with multiple newlines keeps them', () => testCustomReturn(`${foobarString}\n\n`, `${foobarString}\n\n`));
test('"verbose" returning an empty string prints an empty line', () => testCustomReturn('', '\n'));
test('"verbose" returning undefined ignores it', () => testCustomReturn(undefined, ''));
test('"verbose" returning a number ignores it', () => testCustomReturn(0, ''));
test('"verbose" returning a bigint ignores it', () => testCustomReturn(0n, ''));
test('"verbose" returning a boolean ignores it', () => testCustomReturn(true, ''));
test('"verbose" returning an object ignores it', () => testCustomReturn({}, ''));
test('"verbose" returning an array ignores it', () => testCustomReturn([], ''));

test('"verbose" receives verboseLine string as first argument', async () => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {optionsFixture: 'custom-uppercase.js'});
	assert.equal(getCommandLine(stderr), `${testTimestamp} [0] $ NOOP.js ${foobarString}`);
});

test('"verbose" can print as JSON', async () => {
	const {stderr} = await nestedSubprocess('noop.js', ['. .'], {optionsFixture: 'custom-json.js', type: 'duration', reject: false});
	const {type, message, escapedCommand, commandId, timestamp, piped, result, options} = JSON.parse(stderr);
	assert.equal(type, 'duration');
	assert.ok(message.includes('done in'));
	assert.equal(escapedCommand, `noop.js ${QUOTE}. .${QUOTE}`);
	assert.equal(commandId, '0');
	assert.ok(Number.isInteger(new Date(timestamp).getTime()));
	assert.equal(piped, false);
	assert.equal(result.failed, false);
	assert.equal(result.exitCode, 0);
	assert.equal(result.stdout, '. .');
	assert.equal(result.stderr, '');
	assert.equal(options.reject, false);
});
