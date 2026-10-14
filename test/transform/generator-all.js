import assert from 'node:assert/strict';
import {Buffer} from 'node:buffer';
import test from 'node:test';
import {execa, execaSync} from '../../index.js';
import {assertRejects} from '../helpers/assert.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarObject, foobarString} from '../helpers/input.js';
import {
	outputObjectGenerator,
	uppercaseGenerator,
	uppercaseBufferGenerator,
} from '../helpers/generator.js';

setFixtureDirectory();

const textEncoder = new TextEncoder();

test('result.all preserves object-mode bytes when stderr is not buffered', async () => {
	const chunk = new Uint8Array([97, 98]);
	const {stdout, all} = await execa('noop-both.js', ['x'], {
		all: true,
		buffer: {stderr: false},
		stdout: {
			objectMode: true,
			* transform() {
				yield chunk;
			},
		},
	});
	assert.deepEqual(stdout, [chunk]);
	assert.deepEqual(all, [chunk]);
	assert.equal(all[0], chunk);
});

const testSingleBufferedObjectMode = async (bufferedDescriptor, failure) => {
	const chunks = [new Uint8Array([97, 98]), Buffer.from('cd'), 'first\nsecond\n', ['nested'], {value: 1}];
	const unbufferedDescriptor = bufferedDescriptor === 'stdout' ? 'stderr' : 'stdout';
	const subprocess = execa(failure ? 'all-fail.js' : 'noop-both.js', {
		all: true,
		lines: true,
		buffer: {[unbufferedDescriptor]: false},
		[bufferedDescriptor]: {
			objectMode: true,
			* transform() {},
			* final() {
				yield * chunks;
			},
		},
	});
	const result = failure ? await assertRejects(subprocess, {exitCode: 1}) : await subprocess;
	assert.equal(result.failed, failure);
	assert.equal(result[unbufferedDescriptor], undefined);
	assert.deepEqual(result[bufferedDescriptor], chunks);
	assert.deepEqual(result.all, chunks);
	for (const [index, chunk] of chunks.entries()) {
		assert.equal(result.all[index], chunk);
	}
};

const testSingleBufferedTextMode = async (bufferedDescriptor, encoding, failure) => {
	const unbufferedDescriptor = bufferedDescriptor === 'stdout' ? 'stderr' : 'stdout';
	const subprocess = execa(failure ? 'all-fail.js' : 'noop-both.js', {
		all: true,
		encoding,
		stripFinalNewline: false,
		buffer: {[unbufferedDescriptor]: false},
		[unbufferedDescriptor]: outputObjectGenerator(),
	});
	const result = failure ? await assertRejects(subprocess, {exitCode: 1}) : await subprocess;
	const failureOutput = bufferedDescriptor === 'stdout' ? 'std\nout' : 'std\nerr';
	const output = `${failure ? failureOutput : foobarString}\n`;
	const expected = encoding === 'buffer' ? textEncoder.encode(output) : Buffer.from(output).toString(encoding);
	assert.equal(result[unbufferedDescriptor], undefined);
	assert.deepEqual(result[bufferedDescriptor], expected);
	assert.deepEqual(result.all, expected);
};

// Object-mode chunks are passed through unchanged, so they are not affected by the `encoding` option
for (const bufferedDescriptor of ['stdout', 'stderr']) {
	for (const failure of [false, true]) {
		const resultType = failure ? 'error' : 'result';
		test(`${resultType}.all preserves object-mode chunks when only ${bufferedDescriptor} is buffered`, () => testSingleBufferedObjectMode(bufferedDescriptor, failure));
	}
}

for (const bufferedDescriptor of ['stdout', 'stderr']) {
	for (const encoding of ['utf8', 'buffer', 'hex']) {
		for (const failure of [false, true]) {
			const resultType = failure ? 'error' : 'result';
			test(`${resultType}.all decodes text when only ${bufferedDescriptor} is buffered and the other descriptor is in object mode, encoding "${encoding}"`, () => testSingleBufferedTextMode(bufferedDescriptor, encoding, failure));
		}
	}
}

const getAllStdioOption = (stdioOption, encoding, objectMode) => {
	if (stdioOption) {
		return 'pipe';
	}

	if (objectMode) {
		return outputObjectGenerator();
	}

	return encoding === 'utf8' ? uppercaseGenerator() : uppercaseBufferGenerator();
};

const getStdoutStderrOutput = ({output, stdioOption, encoding, objectMode, lines}) => {
	if (objectMode && !stdioOption) {
		return encoding === 'utf8' ? [foobarObject, foobarObject] : [foobarObject];
	}

	const stdioOutput = stdioOption ? output : output.toUpperCase();

	if (encoding === 'hex') {
		return Buffer.from(stdioOutput).toString('hex');
	}

	if (encoding === 'buffer') {
		return textEncoder.encode(stdioOutput);
	}

	return lines ? stdioOutput.trim().split('\n').map(string => `${string}\n`) : stdioOutput;
};

const getAllOutput = ({stdoutOutput, stderrOutput, encoding, objectMode, lines}) => {
	if (objectMode || (lines && encoding === 'utf8')) {
		return [stdoutOutput, stderrOutput].flat();
	}

	return encoding === 'buffer'
		? new Uint8Array([...stdoutOutput, ...stderrOutput])
		: `${stdoutOutput}${stderrOutput}`;
};

// eslint-disable-next-line max-params
const testGeneratorAll = async (reject, encoding, objectMode, stdoutOption, stderrOption, lines, execaMethod) => {
	const fixtureName = reject ? 'all.js' : 'all-fail.js';
	const {stdout, stderr, all} = await execaMethod(fixtureName, {
		all: true,
		reject,
		stdout: getAllStdioOption(stdoutOption, encoding, objectMode),
		stderr: getAllStdioOption(stderrOption, encoding, objectMode),
		encoding,
		lines,
		stripFinalNewline: false,
	});

	const stdoutOutput = getStdoutStderrOutput({
		output: 'std\nout\n',
		stdioOption: stdoutOption,
		encoding,
		objectMode,
		lines,
	});
	assert.deepEqual(stdout, stdoutOutput);
	const stderrOutput = getStdoutStderrOutput({
		output: 'std\nerr\n',
		stdioOption: stderrOption,
		encoding,
		objectMode,
		lines,
	});
	assert.deepEqual(stderr, stderrOutput);
	const allOutput = getAllOutput({
		stdoutOutput,
		stderrOutput,
		encoding,
		objectMode,
		lines,
	});
	if (Array.isArray(all) && Array.isArray(allOutput)) {
		assert.deepEqual([...all].sort(), [...allOutput].sort());
	} else {
		assert.deepEqual(all, allOutput);
	}
};

test('Can use generators with result.all = transform + transform', () => testGeneratorAll(true, 'utf8', false, false, false, false, execa));
test('Can use generators with error.all = transform + transform', () => testGeneratorAll(false, 'utf8', false, false, false, false, execa));
test('Can use generators with result.all = transform + transform, encoding "buffer"', () => testGeneratorAll(true, 'buffer', false, false, false, false, execa));
test('Can use generators with error.all = transform + transform, encoding "buffer"', () => testGeneratorAll(false, 'buffer', false, false, false, false, execa));
test('Can use generators with result.all = transform + transform, encoding "hex"', () => testGeneratorAll(true, 'hex', false, false, false, false, execa));
test('Can use generators with error.all = transform + transform, encoding "hex"', () => testGeneratorAll(false, 'hex', false, false, false, false, execa));
test('Can use generators with result.all = transform + pipe', () => testGeneratorAll(true, 'utf8', false, false, true, false, execa));
test('Can use generators with error.all = transform + pipe', () => testGeneratorAll(false, 'utf8', false, false, true, false, execa));
test('Can use generators with result.all = transform + pipe, encoding "buffer"', () => testGeneratorAll(true, 'buffer', false, false, true, false, execa));
test('Can use generators with error.all = transform + pipe, encoding "buffer"', () => testGeneratorAll(false, 'buffer', false, false, true, false, execa));
test('Can use generators with result.all = transform + pipe, encoding "hex"', () => testGeneratorAll(true, 'hex', false, false, true, false, execa));
test('Can use generators with error.all = transform + pipe, encoding "hex"', () => testGeneratorAll(false, 'hex', false, false, true, false, execa));
test('Can use generators with result.all = pipe + transform', () => testGeneratorAll(true, 'utf8', false, true, false, false, execa));
test('Can use generators with error.all = pipe + transform', () => testGeneratorAll(false, 'utf8', false, true, false, false, execa));
test('Can use generators with result.all = pipe + transform, encoding "buffer"', () => testGeneratorAll(true, 'buffer', false, true, false, false, execa));
test('Can use generators with error.all = pipe + transform, encoding "buffer"', () => testGeneratorAll(false, 'buffer', false, true, false, false, execa));
test('Can use generators with result.all = pipe + transform, encoding "hex"', () => testGeneratorAll(true, 'hex', false, true, false, false, execa));
test('Can use generators with error.all = pipe + transform, encoding "hex"', () => testGeneratorAll(false, 'hex', false, true, false, false, execa));
test('Can use generators with result.all = transform + transform, objectMode', () => testGeneratorAll(true, 'utf8', true, false, false, false, execa));
test('Can use generators with error.all = transform + transform, objectMode', () => testGeneratorAll(false, 'utf8', true, false, false, false, execa));
test('Can use generators with result.all = transform + transform, objectMode, encoding "buffer"', () => testGeneratorAll(true, 'buffer', true, false, false, false, execa));
test('Can use generators with error.all = transform + transform, objectMode, encoding "buffer"', () => testGeneratorAll(false, 'buffer', true, false, false, false, execa));
test('Can use generators with result.all = transform + transform, objectMode, encoding "hex"', () => testGeneratorAll(true, 'hex', true, false, false, false, execa));
test('Can use generators with error.all = transform + transform, objectMode, encoding "hex"', () => testGeneratorAll(false, 'hex', true, false, false, false, execa));
test('Can use generators with result.all = transform + pipe, objectMode', () => testGeneratorAll(true, 'utf8', true, false, true, false, execa));
test('Can use generators with error.all = transform + pipe, objectMode', () => testGeneratorAll(false, 'utf8', true, false, true, false, execa));
test('Can use generators with result.all = transform + pipe, objectMode, encoding "buffer"', () => testGeneratorAll(true, 'buffer', true, false, true, false, execa));
test('Can use generators with error.all = transform + pipe, objectMode, encoding "buffer"', () => testGeneratorAll(false, 'buffer', true, false, true, false, execa));
test('Can use generators with result.all = transform + pipe, objectMode, encoding "hex"', () => testGeneratorAll(true, 'hex', true, false, true, false, execa));
test('Can use generators with error.all = transform + pipe, objectMode, encoding "hex"', () => testGeneratorAll(false, 'hex', true, false, true, false, execa));
test('Can use generators with result.all = pipe + transform, objectMode', () => testGeneratorAll(true, 'utf8', true, true, false, false, execa));
test('Can use generators with error.all = pipe + transform, objectMode', () => testGeneratorAll(false, 'utf8', true, true, false, false, execa));
test('Can use generators with result.all = pipe + transform, objectMode, encoding "buffer"', () => testGeneratorAll(true, 'buffer', true, true, false, false, execa));
test('Can use generators with error.all = pipe + transform, objectMode, encoding "buffer"', () => testGeneratorAll(false, 'buffer', true, true, false, false, execa));
test('Can use generators with result.all = pipe + transform, objectMode, encoding "hex"', () => testGeneratorAll(true, 'hex', true, true, false, false, execa));
test('Can use generators with error.all = pipe + transform, objectMode, encoding "hex"', () => testGeneratorAll(false, 'hex', true, true, false, false, execa));
test('Can use generators with result.all = transform + transform, sync', () => testGeneratorAll(true, 'utf8', false, false, false, false, execaSync));
test('Can use generators with error.all = transform + transform, sync', () => testGeneratorAll(false, 'utf8', false, false, false, false, execaSync));
test('Can use generators with result.all = transform + transform, encoding "buffer", sync', () => testGeneratorAll(true, 'buffer', false, false, false, false, execaSync));
test('Can use generators with error.all = transform + transform, encoding "buffer", sync', () => testGeneratorAll(false, 'buffer', false, false, false, false, execaSync));
test('Can use generators with result.all = transform + transform, encoding "hex", sync', () => testGeneratorAll(true, 'hex', false, false, false, false, execaSync));
test('Can use generators with error.all = transform + transform, encoding "hex", sync', () => testGeneratorAll(false, 'hex', false, false, false, false, execaSync));
test('Can use generators with result.all = transform + pipe, sync', () => testGeneratorAll(true, 'utf8', false, false, true, false, execaSync));
test('Can use generators with error.all = transform + pipe, sync', () => testGeneratorAll(false, 'utf8', false, false, true, false, execaSync));
test('Can use generators with result.all = transform + pipe, encoding "buffer", sync', () => testGeneratorAll(true, 'buffer', false, false, true, false, execaSync));
test('Can use generators with error.all = transform + pipe, encoding "buffer", sync', () => testGeneratorAll(false, 'buffer', false, false, true, false, execaSync));
test('Can use generators with result.all = transform + pipe, encoding "hex", sync', () => testGeneratorAll(true, 'hex', false, false, true, false, execaSync));
test('Can use generators with error.all = transform + pipe, encoding "hex", sync', () => testGeneratorAll(false, 'hex', false, false, true, false, execaSync));
test('Can use generators with result.all = pipe + transform, sync', () => testGeneratorAll(true, 'utf8', false, true, false, false, execaSync));
test('Can use generators with error.all = pipe + transform, sync', () => testGeneratorAll(false, 'utf8', false, true, false, false, execaSync));
test('Can use generators with result.all = pipe + transform, encoding "buffer", sync', () => testGeneratorAll(true, 'buffer', false, true, false, false, execaSync));
test('Can use generators with error.all = pipe + transform, encoding "buffer", sync', () => testGeneratorAll(false, 'buffer', false, true, false, false, execaSync));
test('Can use generators with result.all = pipe + transform, encoding "hex", sync', () => testGeneratorAll(true, 'hex', false, true, false, false, execaSync));
test('Can use generators with error.all = pipe + transform, encoding "hex", sync', () => testGeneratorAll(false, 'hex', false, true, false, false, execaSync));
test('Can use generators with result.all = transform + transform, objectMode, sync', () => testGeneratorAll(true, 'utf8', true, false, false, false, execaSync));
test('Can use generators with error.all = transform + transform, objectMode, sync', () => testGeneratorAll(false, 'utf8', true, false, false, false, execaSync));
test('Can use generators with result.all = transform + transform, objectMode, encoding "buffer", sync', () => testGeneratorAll(true, 'buffer', true, false, false, false, execaSync));
test('Can use generators with error.all = transform + transform, objectMode, encoding "buffer", sync', () => testGeneratorAll(false, 'buffer', true, false, false, false, execaSync));
test('Can use generators with result.all = transform + transform, objectMode, encoding "hex", sync', () => testGeneratorAll(true, 'hex', true, false, false, false, execaSync));
test('Can use generators with error.all = transform + transform, objectMode, encoding "hex", sync', () => testGeneratorAll(false, 'hex', true, false, false, false, execaSync));
test('Can use generators with result.all = transform + pipe, objectMode, sync', () => testGeneratorAll(true, 'utf8', true, false, true, false, execaSync));
test('Can use generators with error.all = transform + pipe, objectMode, sync', () => testGeneratorAll(false, 'utf8', true, false, true, false, execaSync));
test('Can use generators with result.all = transform + pipe, objectMode, encoding "buffer", sync', () => testGeneratorAll(true, 'buffer', true, false, true, false, execaSync));
test('Can use generators with error.all = transform + pipe, objectMode, encoding "buffer", sync', () => testGeneratorAll(false, 'buffer', true, false, true, false, execaSync));
test('Can use generators with result.all = transform + pipe, objectMode, encoding "hex", sync', () => testGeneratorAll(true, 'hex', true, false, true, false, execaSync));
test('Can use generators with error.all = transform + pipe, objectMode, encoding "hex", sync', () => testGeneratorAll(false, 'hex', true, false, true, false, execaSync));
test('Can use generators with result.all = pipe + transform, objectMode, sync', () => testGeneratorAll(true, 'utf8', true, true, false, false, execaSync));
test('Can use generators with error.all = pipe + transform, objectMode, sync', () => testGeneratorAll(false, 'utf8', true, true, false, false, execaSync));
test('Can use generators with result.all = pipe + transform, objectMode, encoding "buffer", sync', () => testGeneratorAll(true, 'buffer', true, true, false, false, execaSync));
test('Can use generators with error.all = pipe + transform, objectMode, encoding "buffer", sync', () => testGeneratorAll(false, 'buffer', true, true, false, false, execaSync));
test('Can use generators with result.all = pipe + transform, objectMode, encoding "hex", sync', () => testGeneratorAll(true, 'hex', true, true, false, false, execaSync));
test('Can use generators with error.all = pipe + transform, objectMode, encoding "hex", sync', () => testGeneratorAll(false, 'hex', true, true, false, false, execaSync));
test('Can use generators with result.all = transform + transform, lines', () => testGeneratorAll(true, 'utf8', false, false, false, true, execa));
test('Can use generators with error.all = transform + transform, lines', () => testGeneratorAll(false, 'utf8', false, false, false, true, execa));
test('Can use generators with result.all = transform + transform, encoding "buffer", lines', () => testGeneratorAll(true, 'buffer', false, false, false, true, execa));
test('Can use generators with error.all = transform + transform, encoding "buffer", lines', () => testGeneratorAll(false, 'buffer', false, false, false, true, execa));
test('Can use generators with result.all = transform + transform, encoding "hex", lines', () => testGeneratorAll(true, 'hex', false, false, false, true, execa));
test('Can use generators with error.all = transform + transform, encoding "hex", lines', () => testGeneratorAll(false, 'hex', false, false, false, true, execa));
test('Can use generators with result.all = transform + pipe, lines', () => testGeneratorAll(true, 'utf8', false, false, true, true, execa));
test('Can use generators with error.all = transform + pipe, lines', () => testGeneratorAll(false, 'utf8', false, false, true, true, execa));
test('Can use generators with result.all = transform + pipe, encoding "buffer", lines', () => testGeneratorAll(true, 'buffer', false, false, true, true, execa));
test('Can use generators with error.all = transform + pipe, encoding "buffer", lines', () => testGeneratorAll(false, 'buffer', false, false, true, true, execa));
test('Can use generators with result.all = transform + pipe, encoding "hex", lines', () => testGeneratorAll(true, 'hex', false, false, true, true, execa));
test('Can use generators with error.all = transform + pipe, encoding "hex", lines', () => testGeneratorAll(false, 'hex', false, false, true, true, execa));
test('Can use generators with result.all = pipe + transform, lines', () => testGeneratorAll(true, 'utf8', false, true, false, true, execa));
test('Can use generators with error.all = pipe + transform, lines', () => testGeneratorAll(false, 'utf8', false, true, false, true, execa));
test('Can use generators with result.all = pipe + transform, encoding "buffer", lines', () => testGeneratorAll(true, 'buffer', false, true, false, true, execa));
test('Can use generators with error.all = pipe + transform, encoding "buffer", lines', () => testGeneratorAll(false, 'buffer', false, true, false, true, execa));
test('Can use generators with result.all = pipe + transform, encoding "hex", lines', () => testGeneratorAll(true, 'hex', false, true, false, true, execa));
test('Can use generators with error.all = pipe + transform, encoding "hex", lines', () => testGeneratorAll(false, 'hex', false, true, false, true, execa));
test('Can use generators with result.all = transform + transform, objectMode, lines', () => testGeneratorAll(true, 'utf8', true, false, false, true, execa));
test('Can use generators with error.all = transform + transform, objectMode, lines', () => testGeneratorAll(false, 'utf8', true, false, false, true, execa));
test('Can use generators with result.all = transform + transform, objectMode, encoding "buffer", lines', () => testGeneratorAll(true, 'buffer', true, false, false, true, execa));
test('Can use generators with error.all = transform + transform, objectMode, encoding "buffer", lines', () => testGeneratorAll(false, 'buffer', true, false, false, true, execa));
test('Can use generators with result.all = transform + transform, objectMode, encoding "hex", lines', () => testGeneratorAll(true, 'hex', true, false, false, true, execa));
test('Can use generators with error.all = transform + transform, objectMode, encoding "hex", lines', () => testGeneratorAll(false, 'hex', true, false, false, true, execa));
test('Can use generators with result.all = transform + pipe, objectMode, lines', () => testGeneratorAll(true, 'utf8', true, false, true, true, execa));
test('Can use generators with error.all = transform + pipe, objectMode, lines', () => testGeneratorAll(false, 'utf8', true, false, true, true, execa));
test('Can use generators with result.all = transform + pipe, objectMode, encoding "buffer", lines', () => testGeneratorAll(true, 'buffer', true, false, true, true, execa));
test('Can use generators with error.all = transform + pipe, objectMode, encoding "buffer", lines', () => testGeneratorAll(false, 'buffer', true, false, true, true, execa));
test('Can use generators with result.all = transform + pipe, objectMode, encoding "hex", lines', () => testGeneratorAll(true, 'hex', true, false, true, true, execa));
test('Can use generators with error.all = transform + pipe, objectMode, encoding "hex", lines', () => testGeneratorAll(false, 'hex', true, false, true, true, execa));
test('Can use generators with result.all = pipe + transform, objectMode, lines', () => testGeneratorAll(true, 'utf8', true, true, false, true, execa));
test('Can use generators with error.all = pipe + transform, objectMode, lines', () => testGeneratorAll(false, 'utf8', true, true, false, true, execa));
test('Can use generators with result.all = pipe + transform, objectMode, encoding "buffer", lines', () => testGeneratorAll(true, 'buffer', true, true, false, true, execa));
test('Can use generators with error.all = pipe + transform, objectMode, encoding "buffer", lines', () => testGeneratorAll(false, 'buffer', true, true, false, true, execa));
test('Can use generators with result.all = pipe + transform, objectMode, encoding "hex", lines', () => testGeneratorAll(true, 'hex', true, true, false, true, execa));
test('Can use generators with error.all = pipe + transform, objectMode, encoding "hex", lines', () => testGeneratorAll(false, 'hex', true, true, false, true, execa));
test('Can use generators with result.all = transform + transform, sync, lines', () => testGeneratorAll(true, 'utf8', false, false, false, true, execaSync));
test('Can use generators with error.all = transform + transform, sync, lines', () => testGeneratorAll(false, 'utf8', false, false, false, true, execaSync));
test('Can use generators with result.all = transform + transform, encoding "buffer", sync, lines', () => testGeneratorAll(true, 'buffer', false, false, false, true, execaSync));
test('Can use generators with error.all = transform + transform, encoding "buffer", sync, lines', () => testGeneratorAll(false, 'buffer', false, false, false, true, execaSync));
test('Can use generators with result.all = transform + transform, encoding "hex", sync, lines', () => testGeneratorAll(true, 'hex', false, false, false, true, execaSync));
test('Can use generators with error.all = transform + transform, encoding "hex", sync, lines', () => testGeneratorAll(false, 'hex', false, false, false, true, execaSync));
test('Can use generators with result.all = transform + pipe, sync, lines', () => testGeneratorAll(true, 'utf8', false, false, true, true, execaSync));
test('Can use generators with error.all = transform + pipe, sync, lines', () => testGeneratorAll(false, 'utf8', false, false, true, true, execaSync));
test('Can use generators with result.all = transform + pipe, encoding "buffer", sync, lines', () => testGeneratorAll(true, 'buffer', false, false, true, true, execaSync));
test('Can use generators with error.all = transform + pipe, encoding "buffer", sync, lines', () => testGeneratorAll(false, 'buffer', false, false, true, true, execaSync));
test('Can use generators with result.all = transform + pipe, encoding "hex", sync, lines', () => testGeneratorAll(true, 'hex', false, false, true, true, execaSync));
test('Can use generators with error.all = transform + pipe, encoding "hex", sync, lines', () => testGeneratorAll(false, 'hex', false, false, true, true, execaSync));
test('Can use generators with result.all = pipe + transform, sync, lines', () => testGeneratorAll(true, 'utf8', false, true, false, true, execaSync));
test('Can use generators with error.all = pipe + transform, sync, lines', () => testGeneratorAll(false, 'utf8', false, true, false, true, execaSync));
test('Can use generators with result.all = pipe + transform, encoding "buffer", sync, lines', () => testGeneratorAll(true, 'buffer', false, true, false, true, execaSync));
test('Can use generators with error.all = pipe + transform, encoding "buffer", sync, lines', () => testGeneratorAll(false, 'buffer', false, true, false, true, execaSync));
test('Can use generators with result.all = pipe + transform, encoding "hex", sync, lines', () => testGeneratorAll(true, 'hex', false, true, false, true, execaSync));
test('Can use generators with error.all = pipe + transform, encoding "hex", sync, lines', () => testGeneratorAll(false, 'hex', false, true, false, true, execaSync));
test('Can use generators with result.all = transform + transform, objectMode, sync, lines', () => testGeneratorAll(true, 'utf8', true, false, false, true, execaSync));
test('Can use generators with error.all = transform + transform, objectMode, sync, lines', () => testGeneratorAll(false, 'utf8', true, false, false, true, execaSync));
test('Can use generators with result.all = transform + transform, objectMode, encoding "buffer", sync, lines', () => testGeneratorAll(true, 'buffer', true, false, false, true, execaSync));
test('Can use generators with error.all = transform + transform, objectMode, encoding "buffer", sync, lines', () => testGeneratorAll(false, 'buffer', true, false, false, true, execaSync));
test('Can use generators with result.all = transform + transform, objectMode, encoding "hex", sync, lines', () => testGeneratorAll(true, 'hex', true, false, false, true, execaSync));
test('Can use generators with error.all = transform + transform, objectMode, encoding "hex", sync, lines', () => testGeneratorAll(false, 'hex', true, false, false, true, execaSync));
test('Can use generators with result.all = transform + pipe, objectMode, sync, lines', () => testGeneratorAll(true, 'utf8', true, false, true, true, execaSync));
test('Can use generators with error.all = transform + pipe, objectMode, sync, lines', () => testGeneratorAll(false, 'utf8', true, false, true, true, execaSync));
test('Can use generators with result.all = transform + pipe, objectMode, encoding "buffer", sync, lines', () => testGeneratorAll(true, 'buffer', true, false, true, true, execaSync));
test('Can use generators with error.all = transform + pipe, objectMode, encoding "buffer", sync, lines', () => testGeneratorAll(false, 'buffer', true, false, true, true, execaSync));
test('Can use generators with result.all = transform + pipe, objectMode, encoding "hex", sync, lines', () => testGeneratorAll(true, 'hex', true, false, true, true, execaSync));
test('Can use generators with error.all = transform + pipe, objectMode, encoding "hex", sync, lines', () => testGeneratorAll(false, 'hex', true, false, true, true, execaSync));
test('Can use generators with result.all = pipe + transform, objectMode, sync, lines', () => testGeneratorAll(true, 'utf8', true, true, false, true, execaSync));
test('Can use generators with error.all = pipe + transform, objectMode, sync, lines', () => testGeneratorAll(false, 'utf8', true, true, false, true, execaSync));
test('Can use generators with result.all = pipe + transform, objectMode, encoding "buffer", sync, lines', () => testGeneratorAll(true, 'buffer', true, true, false, true, execaSync));
test('Can use generators with error.all = pipe + transform, objectMode, encoding "buffer", sync, lines', () => testGeneratorAll(false, 'buffer', true, true, false, true, execaSync));
test('Can use generators with result.all = pipe + transform, objectMode, encoding "hex", sync, lines', () => testGeneratorAll(true, 'hex', true, true, false, true, execaSync));
test('Can use generators with error.all = pipe + transform, objectMode, encoding "hex", sync, lines', () => testGeneratorAll(false, 'hex', true, true, false, true, execaSync));
