import assert from 'node:assert/strict';
import {Buffer} from 'node:buffer';
import test from 'node:test';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {
	noopGenerator,
	getOutputsGenerator,
	addNoopGenerator,
	convertTransformToFinal,
} from '../helpers/generator.js';
import {
	multibyteChar,
	multibyteString,
	multibyteUint8Array,
	breakingLength,
	brokenSymbol,
} from '../helpers/encoding.js';

setFixtureDirectory();

const foobarArray = ['fo', 'ob', 'ar', '..'];

const testMultibyteCharacters = async (objectMode, addNoopTransform, execaMethod) => {
	const {stdout} = await execaMethod('noop.js', {
		stdout: addNoopGenerator(getOutputsGenerator(foobarArray)(objectMode, true), addNoopTransform, objectMode),
		encoding: 'base64',
	});
	if (objectMode) {
		assert.deepEqual(stdout, foobarArray);
	} else {
		// `Uint8Array#toBase64()` is not available on the minimum supported Node.js version.
		assert.equal(stdout, Buffer.from(foobarArray.join('')).toString('base64'));
	}
};

test('Handle multibyte characters', () => testMultibyteCharacters(false, false, execa));
test('Handle multibyte characters, noop transform', () => testMultibyteCharacters(false, true, execa));
test('Handle multibyte characters, with objectMode', () => testMultibyteCharacters(true, false, execa));
test('Handle multibyte characters, with objectMode, noop transform', () => testMultibyteCharacters(true, true, execa));
test('Handle multibyte characters, sync', () => testMultibyteCharacters(false, false, execaSync));
test('Handle multibyte characters, noop transform, sync', () => testMultibyteCharacters(false, true, execaSync));
test('Handle multibyte characters, with objectMode, sync', () => testMultibyteCharacters(true, false, execaSync));
test('Handle multibyte characters, with objectMode, noop transform, sync', () => testMultibyteCharacters(true, true, execaSync));

const testMultibyte = async (objectMode, execaMethod) => {
	const {stdout} = await execaMethod('stdin.js', {
		stdin: [
			[multibyteUint8Array.slice(0, breakingLength), multibyteUint8Array.slice(breakingLength)],
			noopGenerator(objectMode, true),
		],
	});
	assert.equal(stdout, multibyteString);
};

test('Generator handles multibyte characters with Uint8Array', () => testMultibyte(false, execa));
test('Generator handles multibyte characters with Uint8Array, objectMode', () => testMultibyte(true, execa));
test('Generator handles multibyte characters with Uint8Array, sync', () => testMultibyte(false, execaSync));
test('Generator handles multibyte characters with Uint8Array, objectMode, sync', () => testMultibyte(true, execaSync));

const testMultibytePartial = async (objectMode, execaMethod) => {
	const {stdout} = await execaMethod('stdin.js', {
		stdin: [
			[multibyteUint8Array.slice(0, breakingLength)],
			noopGenerator(objectMode, true),
		],
	});
	assert.equal(stdout, `${multibyteChar}${brokenSymbol}`);
};

test('Generator handles partial multibyte characters with Uint8Array', () => testMultibytePartial(false, execa));
test('Generator handles partial multibyte characters with Uint8Array, objectMode', () => testMultibytePartial(true, execa));
test('Generator handles partial multibyte characters with Uint8Array, sync', () => testMultibytePartial(false, execaSync));
test('Generator handles partial multibyte characters with Uint8Array, objectMode, sync', () => testMultibytePartial(true, execaSync));

const testMultibytePartialOutput = async execaMethod => {
	const {stdout} = await execaMethod('noop.js', {
		stdout: getOutputsGenerator([
			multibyteUint8Array.slice(0, breakingLength),
			multibyteUint8Array.slice(breakingLength),
		])(false, true),
	});
	assert.equal(stdout, multibyteString);
};

test('Generator handles output multibyte characters with Uint8Array', () => testMultibytePartialOutput(execa));
test('Generator handles output multibyte characters with Uint8Array, sync', () => testMultibytePartialOutput(execaSync));

test('Synchronous input transforms preserve the order of mixed text and partial UTF-8 bytes', () => {
	const {stdout} = execaSync('stdin.js', {
		stdin: [
			[new Uint8Array([0xC3]), 'middle', new Uint8Array([0xA9])],
			noopGenerator(false, false, true),
		],
	});
	assert.equal(stdout, '\u{FFFD}middle\u{FFFD}');
});

const mixedInputCases = new Map([
	['a two-byte character interrupted by text', [new Uint8Array([0xC3]), 'middle', new Uint8Array([0xA9])]],
	['a three-byte character interrupted by text', [new Uint8Array([0xE2, 0x82]), 'middle', new Uint8Array([0xAC])]],
	['a four-byte character interrupted by a newline', [new Uint8Array([0xF0, 0x9F]), '\n', new Uint8Array([0x98, 0x80])]],
	['an unfinished character before final text', [new Uint8Array([0xC3]), 'last']],
	['an empty string between character bytes', [new Uint8Array([0xC3]), '', new Uint8Array([0xA9])]],
	['text between complete byte characters', [new Uint8Array([0xC3, 0xA9]), '🙂', new Uint8Array([0xE2, 0x82, 0xAC])]],
	['text before a split byte character', ['first', new Uint8Array([0xC3]), new Uint8Array([0xA9])]],
	['adjacent text chunks', ['first', '🙂', 'last']],
	['separate string surrogate halves', ['\u{D83D}', '\u{DE00}']],
]);

const getMixedInputBytes = chunks => Buffer.concat(chunks.map(chunk => typeof chunk === 'string' ? Buffer.from(chunk) : chunk));

const testMixedInput = async (chunks, execaMethod) => {
	const {stdout} = await execaMethod('stdin.js', {
		stdin: [chunks, noopGenerator(false, false, true)],
		stripFinalNewline: false,
	});
	assert.equal(stdout, getMixedInputBytes(chunks).toString());
};

for (const [name, chunks] of mixedInputCases) {
	test(`Input transforms preserve ${name}`, () => testMixedInput(chunks, execa));
	test(`Input transforms preserve ${name}, sync`, () => testMixedInput(chunks, execaSync));
}

const interruptedChunks = mixedInputCases.get('a two-byte character interrupted by text');

const testMixedTransformChain = async (direction, final, execaMethod) => {
	const outputTransform = getOutputsGenerator(interruptedChunks)(false, false, true);
	const {stdout} = await execaMethod(direction === 'stdin' ? 'stdin.js' : 'noop.js', {
		[direction]: [convertTransformToFinal(outputTransform, final), noopGenerator(false, false, true)],
		...(direction === 'stdin' && {input: 'trigger'}),
		stripFinalNewline: false,
	});
	assert.equal(stdout, getMixedInputBytes(interruptedChunks).toString());
};

for (const direction of ['stdin', 'stdout']) {
	for (const final of [false, true]) {
		const phase = final ? 'final' : 'transform';
		test(`Chained ${direction} generators preserve mixed chunks yielded by ${phase}`, () => testMixedTransformChain(direction, final, execa));
		test(`Chained ${direction} generators preserve mixed chunks yielded by ${phase}, sync`, () => testMixedTransformChain(direction, final, execaSync));
	}
}

const testMixedBinaryInput = async execaMethod => {
	const {stdout} = await execaMethod('stdin.js', {
		stdin: [interruptedChunks, noopGenerator(false, true)],
		encoding: 'buffer',
		stripFinalNewline: false,
	});
	assert.deepEqual(stdout, new Uint8Array(getMixedInputBytes(interruptedChunks)));
};

test('Binary input transforms preserve mixed chunks as bytes', () => testMixedBinaryInput(execa));
test('Binary input transforms preserve mixed chunks as bytes, sync', () => testMixedBinaryInput(execaSync));

const testMixedObjectInput = async execaMethod => {
	const chunks = [...interruptedChunks, '\u{D800}', {value: true}];
	const received = [];
	await execaMethod('stdin.js', {
		stdin: [chunks, {
			objectMode: true,
			preserveNewlines: true,
			* transform(chunk) {
				received.push(chunk);
				yield JSON.stringify(chunk);
			},
		}],
	});
	assert.deepEqual(received, chunks);
	for (const [index, chunk] of chunks.entries()) {
		assert.equal(received[index], chunk);
	}
};

test('Object-mode input transforms preserve mixed chunk identity and raw text', () => testMixedObjectInput(execa));
test('Object-mode input transforms preserve mixed chunk identity and raw text, sync', () => testMixedObjectInput(execaSync));

const testMixedAllRawString = async (encoding, execaMethod) => {
	const chunk = '\u{D800}';
	const {stdout, all} = await execaMethod('noop.js', {
		all: true,
		encoding,
		stdout: getOutputsGenerator([chunk])(true),
	});
	assert.deepEqual(stdout, [chunk]);
	assert.deepEqual(all, [chunk]);
};

test('Mixed object-mode all preserves raw strings with UTF-8', () => testMixedAllRawString('utf8', execa));
test('Mixed object-mode all preserves raw strings with UTF-8, sync', () => testMixedAllRawString('utf8', execaSync));
test('Mixed object-mode all preserves raw strings with hex', () => testMixedAllRawString('hex', execa));
test('Mixed object-mode all preserves raw strings with hex, sync', () => testMixedAllRawString('hex', execaSync));
