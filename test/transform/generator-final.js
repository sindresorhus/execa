import assert from 'node:assert/strict';
import test from 'node:test';
import {execa, execaSync} from '../../index.js';
import {foobarString} from '../helpers/input.js';
import {
	getOutputAsyncGenerator,
	getOutputGenerator,
	convertTransformToFinal,
	throwingGenerator,
} from '../helpers/generator.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

const testGeneratorFinal = async (fixtureName, execaMethod) => {
	const {stdout} = await execaMethod(fixtureName, {stdout: convertTransformToFinal(getOutputGenerator(foobarString)(), true)});
	assert.equal(stdout, foobarString);
};

test('Generators "final" can be used', () => testGeneratorFinal('noop.js', execa));
test('Generators "final" is used even on empty streams', () => testGeneratorFinal('empty.js', execa));
test('Generators "final" can be used, sync', () => testGeneratorFinal('noop.js', execaSync));
test('Generators "final" is used even on empty streams, sync', () => testGeneratorFinal('empty.js', execaSync));

const testFinalAlone = async (final, execaMethod) => {
	const {stdout} = await execaMethod('noop-fd.js', ['1', '.'], {stdout: {final: final(foobarString)().transform}});
	assert.equal(stdout, `.\n${foobarString}`);
};

test('Generators "final" can be used without "transform"', () => testFinalAlone(getOutputGenerator, execa));
test('Generators "final" can be used without "transform", sync', () => testFinalAlone(getOutputGenerator, execaSync));
test('Generators "final" can be used without "transform", async', () => testFinalAlone(getOutputAsyncGenerator, execa));

const testFinalNoOutput = async (final, execaMethod) => {
	const {stdout} = await execaMethod('empty.js', {stdout: {final: final(foobarString)().transform}});
	assert.equal(stdout, foobarString);
};

test('Generators "final" can be used without "transform" nor output', () => testFinalNoOutput(getOutputGenerator, execa));
test('Generators "final" can be used without "transform" nor output, sync', () => testFinalNoOutput(getOutputGenerator, execaSync));
test('Generators "final" can be used without "transform" nor output, async', () => testFinalNoOutput(getOutputAsyncGenerator, execa));

const testInputFinalEmpty = options => {
	let finalCount = 0;
	const chunks = [];
	const {stdout} = execaSync('stdin.js', {
		...options,
		stdin: {
			* transform(chunk) {
				chunks.push(chunk);
				yield chunk;
			},
			* final() {
				finalCount += 1;
				yield foobarString;
			},
			binary: true,
		},
	});
	assert.equal(stdout, foobarString);
	assert.equal(finalCount, 1);
	assert.deepEqual(chunks, []);
};

test('Input generators "final" runs without an input source, sync', () => testInputFinalEmpty({}));
test('Input generators "final" runs with an empty string input source, sync', () => testInputFinalEmpty({input: ''}));
test('Input generators "final" runs with an empty Uint8Array input source, sync', () => testInputFinalEmpty({input: new Uint8Array()}));

test('Input generators "final" runs once with multiple empty iterable input sources, sync', () => {
	let finalCount = 0;
	const {stdout} = execaSync('stdin.js', {
		stdin: [[], [], {
			* final() {
				finalCount += 1;
				yield foobarString;
			},
		}],
	});
	assert.equal(stdout, foobarString);
	assert.equal(finalCount, 1);
});

test('Input generators "final" can produce binary input without an input source, sync', () => {
	const {stdout} = execaSync('stdin.js', {
		stdin: {
			* final() {
				yield new TextEncoder().encode('first\nsecond');
			},
			binary: true,
		},
	});
	assert.equal(stdout, 'first\nsecond');
});

test('Input generators "final" output passes through the next transform without an input source, sync', () => {
	const calls = [];
	const {stdout} = execaSync('stdin.js', {
		stdin: [
			{
				* final() {
					yield 'first';
					yield 'second';
				},
			},
			{
				* transform(line) {
					calls.push(line);
					yield line.toUpperCase();
				},
				* final() {
					yield 'last';
				},
			},
		],
	});
	assert.equal(stdout, 'FIRST\nSECOND\nlast');
	assert.deepEqual(calls, ['first', 'second']);
});

test('Input generators "final" errors are reported without an input source, sync', () => {
	const cause = new Error('Input final failed');
	assert.throws(() => {
		execaSync('stdin.js', {
			stdin: {final: throwingGenerator(cause)().transform},
		});
	}, {cause});
});

test('Input generators "final" errors respect reject: false without an input source, sync', () => {
	const cause = new Error('Input final failed');
	const result = execaSync('stdin.js', {
		stdin: {final: throwingGenerator(cause)().transform},
		reject: false,
	});
	assert.equal(result.failed, true);
	assert.equal(result.cause, cause);
});
