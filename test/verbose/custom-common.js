import test from 'ava';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {nestedSubprocess} from '../helpers/nested.js';
import {QUOTE, getCommandLine, testTimestamp} from '../helpers/verbose.js';

setFixtureDirectory();

const testCustomReturn = async (t, verboseOutput, expectedOutput) => {
	const {stderr} = await nestedSubprocess(
		'empty.js',
		{optionsFixture: 'custom-return.js', optionsInput: {verboseOutput}},
		{stripFinalNewline: false},
	);
	t.is(stderr, expectedOutput);
};

test('"verbose" returning a string prints it', testCustomReturn, `${foobarString}\n`, `${foobarString}\n`);
test('"verbose" returning a string without a newline adds it', testCustomReturn, foobarString, `${foobarString}\n`);
test('"verbose" returning a string with multiple newlines keeps them', testCustomReturn, `${foobarString}\n\n`, `${foobarString}\n\n`);
test('"verbose" returning an empty string prints an empty line', testCustomReturn, '', '\n');
test('"verbose" returning undefined ignores it', testCustomReturn, undefined, '');
test('"verbose" returning a number ignores it', testCustomReturn, 0, '');
test('"verbose" returning a bigint ignores it', testCustomReturn, 0n, '');
test('"verbose" returning a boolean ignores it', testCustomReturn, true, '');
test('"verbose" returning an object ignores it', testCustomReturn, {}, '');
test('"verbose" returning an array ignores it', testCustomReturn, [], '');

test('"verbose" receives verboseLine string as first argument', async t => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {optionsFixture: 'custom-uppercase.js'});
	t.is(getCommandLine(stderr), `${testTimestamp} [0] $ NOOP.js ${foobarString}`);
});

test('"verbose" can print as JSON', async t => {
	const {stderr} = await nestedSubprocess('noop.js', ['. .'], {optionsFixture: 'custom-json.js', type: 'duration', reject: false});
	const {type, message, escapedCommand, commandId, timestamp, piped, result, options} = JSON.parse(stderr);
	t.is(type, 'duration');
	t.true(message.includes('done in'));
	t.is(escapedCommand, `noop.js ${QUOTE}. .${QUOTE}`);
	t.is(commandId, '0');
	t.true(Number.isInteger(new Date(timestamp).getTime()));
	t.false(piped);
	t.false(result.failed);
	t.is(result.exitCode, 0);
	t.is(result.stdout, '. .');
	t.is(result.stderr, '');
	t.false(options.reject);
});
