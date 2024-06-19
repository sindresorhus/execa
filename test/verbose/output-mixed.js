import {inspect} from 'node:util';
import test from 'ava';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarObject} from '../helpers/input.js';
import {simpleFull, noNewlinesChunks} from '../helpers/lines.js';
import {nestedSubprocess} from '../helpers/nested.js';
import {getOutputLine, getOutputLines, testTimestamp} from '../helpers/verbose.js';

setFixtureDirectory();

const testLines = async (t, lines, stripFinalNewline, isSync) => {
	const {stderr} = await nestedSubprocess('noop-fd.js', ['1', simpleFull], {
		verbose: 'full',
		lines,
		stripFinalNewline,
		isSync,
	});
	t.deepEqual(getOutputLines(stderr), noNewlinesChunks.map(line => `${testTimestamp} [0]   ${line}`));
};

test('Prints stdout, "lines: true"', testLines, true, false, false);
test('Prints stdout, "lines: true", fd-specific', testLines, {stdout: true}, false, false);
test('Prints stdout, "lines: true", stripFinalNewline', testLines, true, true, false);
test('Prints stdout, "lines: true", sync', testLines, true, false, true);
test('Prints stdout, "lines: true", fd-specific, sync', testLines, {stdout: true}, false, true);
test('Prints stdout, "lines: true", stripFinalNewline, sync', testLines, true, true, true);

const testOnlyTransforms = async (t, isSync) => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {
		optionsFixture: 'generator-uppercase.js',
		verbose: 'full',
		isSync,
	});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString.toUpperCase()}`);
};

test('Prints stdout with only transforms', testOnlyTransforms, false);
test('Prints stdout with only transforms, sync', testOnlyTransforms, true);

test('Prints stdout with only duplexes', async t => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {
		optionsFixture: 'generator-duplex.js',
		verbose: 'full',
	});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString.toUpperCase()}`);
});

const testObjectMode = async (t, isSync) => {
	const {stderr} = await nestedSubprocess('noop.js', {
		optionsFixture: 'generator-object.js',
		verbose: 'full',
		isSync,
	});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${inspect(foobarObject)}`);
};

test('Prints stdout with object transforms', testObjectMode, false);
test('Prints stdout with object transforms, sync', testObjectMode, true);

const testBigArray = async (t, isSync) => {
	const {stderr} = await nestedSubprocess('noop.js', {
		optionsFixture: 'generator-big-array.js',
		verbose: 'full',
		isSync,
	});
	const lines = getOutputLines(stderr);
	t.is(lines[0], `${testTimestamp} [0]   [`);
	t.true(lines[1].startsWith(`${testTimestamp} [0]      0,  1,`));
	t.is(lines.at(-1), `${testTimestamp} [0]   ]`);
};

test('Prints stdout with big object transforms', testBigArray, false);
test('Prints stdout with big object transforms, sync', testBigArray, true);

const testObjectModeString = async (t, isSync) => {
	const {stderr} = await nestedSubprocess('noop.js', {
		optionsFixture: 'generator-string-object.js',
		verbose: 'full',
		isSync,
	});
	t.deepEqual(getOutputLines(stderr), noNewlinesChunks.map(line => `${testTimestamp} [0]   ${line}`));
};

test('Prints stdout with string transforms in objectMode', testObjectModeString, false);
test('Prints stdout with string transforms in objectMode, sync', testObjectModeString, true);
