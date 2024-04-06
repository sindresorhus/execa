import {Buffer} from 'node:buffer';
import {readFile, writeFile, rm} from 'node:fs/promises';
import {PassThrough} from 'node:stream';
import test from 'ava';
import getStream, {getStreamAsArray} from 'get-stream';
import tempfile from 'tempfile';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdio} from '../helpers/stdio.js';
import {
	foobarString,
	foobarUppercase,
	foobarHex,
	foobarUint8Array,
	foobarBuffer,
	foobarObject,
	foobarObjectString,
} from '../helpers/input.js';
import {
	outputObjectGenerator,
	uppercaseGenerator,
	uppercaseBufferGenerator,
	appendGenerator,
	appendAsyncGenerator,
	casedSuffix,
} from '../helpers/generator.js';
import {appendDuplex, uppercaseBufferDuplex} from '../helpers/duplex.js';
import {appendWebTransform, uppercaseBufferWebTransform} from '../helpers/web-transform.js';
import {generatorsMap} from '../helpers/map.js';

setFixtureDir();

const textEncoder = new TextEncoder();

const getInputObjectMode = (objectMode, addNoopTransform, type) => objectMode
	? {
		input: [foobarObject],
		generators: generatorsMap[type].addNoop(generatorsMap[type].serialize(objectMode), addNoopTransform, objectMode),
		output: foobarObjectString,
	}
	: {
		input: foobarUint8Array,
		generators: generatorsMap[type].addNoop(generatorsMap[type].uppercase(objectMode), addNoopTransform, objectMode),
		output: foobarUppercase,
	};

const getOutputObjectMode = (objectMode, addNoopTransform, type, binary) => objectMode
	? {
		generators: generatorsMap[type].addNoop(generatorsMap[type].outputObject(), addNoopTransform, objectMode, binary),
		output: [foobarObject],
		getStreamMethod: getStreamAsArray,
	}
	: {
		generators: generatorsMap[type].addNoop(generatorsMap[type].uppercaseBuffer(objectMode, true), addNoopTransform, objectMode, binary),
		output: foobarUppercase,
		getStreamMethod: getStream,
	};

// eslint-disable-next-line max-params
const testGeneratorInput = async (t, fdNumber, objectMode, addNoopTransform, type, execaMethod) => {
	const {input, generators, output} = getInputObjectMode(objectMode, addNoopTransform, type);
	const {stdout} = await execaMethod('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, [input, ...generators]));
	t.is(stdout, output);
};

test('Can use generators with result.stdin', testGeneratorInput, 0, false, false, 'generator', execa);
test('Can use generators with result.stdio[*] as input', testGeneratorInput, 3, false, false, 'generator', execa);
test('Can use generators with result.stdin, objectMode', testGeneratorInput, 0, true, false, 'generator', execa);
test('Can use generators with result.stdio[*] as input, objectMode', testGeneratorInput, 3, true, false, 'generator', execa);
test('Can use generators with result.stdin, noop transform', testGeneratorInput, 0, false, true, 'generator', execa);
test('Can use generators with result.stdio[*] as input, noop transform', testGeneratorInput, 3, false, true, 'generator', execa);
test('Can use generators with result.stdin, objectMode, noop transform', testGeneratorInput, 0, true, true, 'generator', execa);
test('Can use generators with result.stdio[*] as input, objectMode, noop transform', testGeneratorInput, 3, true, true, 'generator', execa);
test('Can use generators with result.stdin, sync', testGeneratorInput, 0, false, false, 'generator', execaSync);
test('Can use generators with result.stdin, objectMode, sync', testGeneratorInput, 0, true, false, 'generator', execaSync);
test('Can use generators with result.stdin, noop transform, sync', testGeneratorInput, 0, false, true, 'generator', execaSync);
test('Can use generators with result.stdin, objectMode, noop transform, sync', testGeneratorInput, 0, true, true, 'generator', execaSync);
test('Can use duplexes with result.stdin', testGeneratorInput, 0, false, false, 'duplex', execa);
test('Can use duplexes with result.stdio[*] as input', testGeneratorInput, 3, false, false, 'duplex', execa);
test('Can use duplexes with result.stdin, objectMode', testGeneratorInput, 0, true, false, 'duplex', execa);
test('Can use duplexes with result.stdio[*] as input, objectMode', testGeneratorInput, 3, true, false, 'duplex', execa);
test('Can use duplexes with result.stdin, noop transform', testGeneratorInput, 0, false, true, 'duplex', execa);
test('Can use duplexes with result.stdio[*] as input, noop transform', testGeneratorInput, 3, false, true, 'duplex', execa);
test('Can use duplexes with result.stdin, objectMode, noop transform', testGeneratorInput, 0, true, true, 'duplex', execa);
test('Can use duplexes with result.stdio[*] as input, objectMode, noop transform', testGeneratorInput, 3, true, true, 'duplex', execa);
test('Can use webTransforms with result.stdin', testGeneratorInput, 0, false, false, 'webTransform', execa);
test('Can use webTransforms with result.stdio[*] as input', testGeneratorInput, 3, false, false, 'webTransform', execa);
test('Can use webTransforms with result.stdin, objectMode', testGeneratorInput, 0, true, false, 'webTransform', execa);
test('Can use webTransforms with result.stdio[*] as input, objectMode', testGeneratorInput, 3, true, false, 'webTransform', execa);
test('Can use webTransforms with result.stdin, noop transform', testGeneratorInput, 0, false, true, 'webTransform', execa);
test('Can use webTransforms with result.stdio[*] as input, noop transform', testGeneratorInput, 3, false, true, 'webTransform', execa);
test('Can use webTransforms with result.stdin, objectMode, noop transform', testGeneratorInput, 0, true, true, 'webTransform', execa);
test('Can use webTransforms with result.stdio[*] as input, objectMode, noop transform', testGeneratorInput, 3, true, true, 'webTransform', execa);

// eslint-disable-next-line max-params
const testGeneratorInputPipe = async (t, useShortcutProperty, objectMode, addNoopTransform, type, input) => {
	const {generators, output} = getInputObjectMode(objectMode, addNoopTransform, type);
	const subprocess = execa('stdin-fd.js', ['0'], getStdio(0, generators));
	const stream = useShortcutProperty ? subprocess.stdin : subprocess.stdio[0];
	stream.end(...input);
	const {stdout} = await subprocess;
	const expectedOutput = input[1] === 'utf16le' ? Buffer.from(output, input[1]).toString() : output;
	t.is(stdout, expectedOutput);
};

test('Can use generators with subprocess.stdio[0] and default encoding', testGeneratorInputPipe, false, false, false, 'generator', [foobarString, 'utf8']);
test('Can use generators with subprocess.stdin and default encoding', testGeneratorInputPipe, true, false, false, 'generator', [foobarString, 'utf8']);
test('Can use generators with subprocess.stdio[0] and encoding "utf16le"', testGeneratorInputPipe, false, false, false, 'generator', [foobarString, 'utf16le']);
test('Can use generators with subprocess.stdin and encoding "utf16le"', testGeneratorInputPipe, true, false, false, 'generator', [foobarString, 'utf16le']);
test('Can use generators with subprocess.stdio[0] and encoding "buffer"', testGeneratorInputPipe, false, false, false, 'generator', [foobarBuffer, 'buffer']);
test('Can use generators with subprocess.stdin and encoding "buffer"', testGeneratorInputPipe, true, false, false, 'generator', [foobarBuffer, 'buffer']);
test('Can use generators with subprocess.stdio[0] and encoding "hex"', testGeneratorInputPipe, false, false, false, 'generator', [foobarHex, 'hex']);
test('Can use generators with subprocess.stdin and encoding "hex"', testGeneratorInputPipe, true, false, false, 'generator', [foobarHex, 'hex']);
test('Can use generators with subprocess.stdio[0], objectMode', testGeneratorInputPipe, false, true, false, 'generator', [foobarObject]);
test('Can use generators with subprocess.stdin, objectMode', testGeneratorInputPipe, true, true, false, 'generator', [foobarObject]);
test('Can use generators with subprocess.stdio[0] and default encoding, noop transform', testGeneratorInputPipe, false, false, true, 'generator', [foobarString, 'utf8']);
test('Can use generators with subprocess.stdin and default encoding, noop transform', testGeneratorInputPipe, true, false, true, 'generator', [foobarString, 'utf8']);
test('Can use generators with subprocess.stdio[0] and encoding "utf16le", noop transform', testGeneratorInputPipe, false, false, true, 'generator', [foobarString, 'utf16le']);
test('Can use generators with subprocess.stdin and encoding "utf16le", noop transform', testGeneratorInputPipe, true, false, true, 'generator', [foobarString, 'utf16le']);
test('Can use generators with subprocess.stdio[0] and encoding "buffer", noop transform', testGeneratorInputPipe, false, false, true, 'generator', [foobarBuffer, 'buffer']);
test('Can use generators with subprocess.stdin and encoding "buffer", noop transform', testGeneratorInputPipe, true, false, true, 'generator', [foobarBuffer, 'buffer']);
test('Can use generators with subprocess.stdio[0] and encoding "hex", noop transform', testGeneratorInputPipe, false, false, true, 'generator', [foobarHex, 'hex']);
test('Can use generators with subprocess.stdin and encoding "hex", noop transform', testGeneratorInputPipe, true, false, true, 'generator', [foobarHex, 'hex']);
test('Can use generators with subprocess.stdio[0], objectMode, noop transform', testGeneratorInputPipe, false, true, true, 'generator', [foobarObject]);
test('Can use generators with subprocess.stdin, objectMode, noop transform', testGeneratorInputPipe, true, true, true, 'generator', [foobarObject]);
test('Can use duplexes with subprocess.stdio[0] and default encoding', testGeneratorInputPipe, false, false, false, 'duplex', [foobarString, 'utf8']);
test('Can use duplexes with subprocess.stdin and default encoding', testGeneratorInputPipe, true, false, false, 'duplex', [foobarString, 'utf8']);
test('Can use duplexes with subprocess.stdio[0] and encoding "utf16le"', testGeneratorInputPipe, false, false, false, 'duplex', [foobarString, 'utf16le']);
test('Can use duplexes with subprocess.stdin and encoding "utf16le"', testGeneratorInputPipe, true, false, false, 'duplex', [foobarString, 'utf16le']);
test('Can use duplexes with subprocess.stdio[0] and encoding "buffer"', testGeneratorInputPipe, false, false, false, 'duplex', [foobarBuffer, 'buffer']);
test('Can use duplexes with subprocess.stdin and encoding "buffer"', testGeneratorInputPipe, true, false, false, 'duplex', [foobarBuffer, 'buffer']);
test('Can use duplexes with subprocess.stdio[0] and encoding "hex"', testGeneratorInputPipe, false, false, false, 'duplex', [foobarHex, 'hex']);
test('Can use duplexes with subprocess.stdin and encoding "hex"', testGeneratorInputPipe, true, false, false, 'duplex', [foobarHex, 'hex']);
test('Can use duplexes with subprocess.stdio[0], objectMode', testGeneratorInputPipe, false, true, false, 'duplex', [foobarObject]);
test('Can use duplexes with subprocess.stdin, objectMode', testGeneratorInputPipe, true, true, false, 'duplex', [foobarObject]);
test('Can use duplexes with subprocess.stdio[0] and default encoding, noop transform', testGeneratorInputPipe, false, false, true, 'duplex', [foobarString, 'utf8']);
test('Can use duplexes with subprocess.stdin and default encoding, noop transform', testGeneratorInputPipe, true, false, true, 'duplex', [foobarString, 'utf8']);
test('Can use duplexes with subprocess.stdio[0] and encoding "utf16le", noop transform', testGeneratorInputPipe, false, false, true, 'duplex', [foobarString, 'utf16le']);
test('Can use duplexes with subprocess.stdin and encoding "utf16le", noop transform', testGeneratorInputPipe, true, false, true, 'duplex', [foobarString, 'utf16le']);
test('Can use duplexes with subprocess.stdio[0] and encoding "buffer", noop transform', testGeneratorInputPipe, false, false, true, 'duplex', [foobarBuffer, 'buffer']);
test('Can use duplexes with subprocess.stdin and encoding "buffer", noop transform', testGeneratorInputPipe, true, false, true, 'duplex', [foobarBuffer, 'buffer']);
test('Can use duplexes with subprocess.stdio[0] and encoding "hex", noop transform', testGeneratorInputPipe, false, false, true, 'duplex', [foobarHex, 'hex']);
test('Can use duplexes with subprocess.stdin and encoding "hex", noop transform', testGeneratorInputPipe, true, false, true, 'duplex', [foobarHex, 'hex']);
test('Can use duplexes with subprocess.stdio[0], objectMode, noop transform', testGeneratorInputPipe, false, true, true, 'duplex', [foobarObject]);
test('Can use duplexes with subprocess.stdin, objectMode, noop transform', testGeneratorInputPipe, true, true, true, 'duplex', [foobarObject]);
test('Can use webTransforms with subprocess.stdio[0] and default encoding', testGeneratorInputPipe, false, false, false, 'webTransform', [foobarString, 'utf8']);
test('Can use webTransforms with subprocess.stdin and default encoding', testGeneratorInputPipe, true, false, false, 'webTransform', [foobarString, 'utf8']);
test('Can use webTransforms with subprocess.stdio[0] and encoding "utf16le"', testGeneratorInputPipe, false, false, false, 'webTransform', [foobarString, 'utf16le']);
test('Can use webTransforms with subprocess.stdin and encoding "utf16le"', testGeneratorInputPipe, true, false, false, 'webTransform', [foobarString, 'utf16le']);
test('Can use webTransforms with subprocess.stdio[0] and encoding "buffer"', testGeneratorInputPipe, false, false, false, 'webTransform', [foobarBuffer, 'buffer']);
test('Can use webTransforms with subprocess.stdin and encoding "buffer"', testGeneratorInputPipe, true, false, false, 'webTransform', [foobarBuffer, 'buffer']);
test('Can use webTransforms with subprocess.stdio[0] and encoding "hex"', testGeneratorInputPipe, false, false, false, 'webTransform', [foobarHex, 'hex']);
test('Can use webTransforms with subprocess.stdin and encoding "hex"', testGeneratorInputPipe, true, false, false, 'webTransform', [foobarHex, 'hex']);
test('Can use webTransforms with subprocess.stdio[0], objectMode', testGeneratorInputPipe, false, true, false, 'webTransform', [foobarObject]);
test('Can use webTransforms with subprocess.stdin, objectMode', testGeneratorInputPipe, true, true, false, 'webTransform', [foobarObject]);
test('Can use webTransforms with subprocess.stdio[0] and default encoding, noop transform', testGeneratorInputPipe, false, false, true, 'webTransform', [foobarString, 'utf8']);
test('Can use webTransforms with subprocess.stdin and default encoding, noop transform', testGeneratorInputPipe, true, false, true, 'webTransform', [foobarString, 'utf8']);
test('Can use webTransforms with subprocess.stdio[0] and encoding "utf16le", noop transform', testGeneratorInputPipe, false, false, true, 'webTransform', [foobarString, 'utf16le']);
test('Can use webTransforms with subprocess.stdin and encoding "utf16le", noop transform', testGeneratorInputPipe, true, false, true, 'webTransform', [foobarString, 'utf16le']);
test('Can use webTransforms with subprocess.stdio[0] and encoding "buffer", noop transform', testGeneratorInputPipe, false, false, true, 'webTransform', [foobarBuffer, 'buffer']);
test('Can use webTransforms with subprocess.stdin and encoding "buffer", noop transform', testGeneratorInputPipe, true, false, true, 'webTransform', [foobarBuffer, 'buffer']);
test('Can use webTransforms with subprocess.stdio[0] and encoding "hex", noop transform', testGeneratorInputPipe, false, false, true, 'webTransform', [foobarHex, 'hex']);
test('Can use webTransforms with subprocess.stdin and encoding "hex", noop transform', testGeneratorInputPipe, true, false, true, 'webTransform', [foobarHex, 'hex']);
test('Can use webTransforms with subprocess.stdio[0], objectMode, noop transform', testGeneratorInputPipe, false, true, true, 'webTransform', [foobarObject]);
test('Can use webTransforms with subprocess.stdin, objectMode, noop transform', testGeneratorInputPipe, true, true, true, 'webTransform', [foobarObject]);

const testGeneratorStdioInputPipe = async (t, objectMode, addNoopTransform, type) => {
	const {input, generators, output} = getInputObjectMode(objectMode, addNoopTransform, type);
	const subprocess = execa('stdin-fd.js', ['3'], getStdio(3, [[], ...generators]));
	subprocess.stdio[3].write(Array.isArray(input) ? input[0] : input);
	const {stdout} = await subprocess;
	t.is(stdout, output);
};

test('Can use generators with subprocess.stdio[*] as input', testGeneratorStdioInputPipe, false, false, 'generator');
test('Can use generators with subprocess.stdio[*] as input, objectMode', testGeneratorStdioInputPipe, true, false, 'generator');
test('Can use generators with subprocess.stdio[*] as input, noop transform', testGeneratorStdioInputPipe, false, true, 'generator');
test('Can use generators with subprocess.stdio[*] as input, objectMode, noop transform', testGeneratorStdioInputPipe, true, true, 'generator');
test('Can use duplexes with subprocess.stdio[*] as input', testGeneratorStdioInputPipe, false, false, 'duplex');
test('Can use duplexes with subprocess.stdio[*] as input, objectMode', testGeneratorStdioInputPipe, true, false, 'duplex');
test('Can use duplexes with subprocess.stdio[*] as input, noop transform', testGeneratorStdioInputPipe, false, true, 'duplex');
test('Can use duplexes with subprocess.stdio[*] as input, objectMode, noop transform', testGeneratorStdioInputPipe, true, true, 'duplex');
test('Can use webTransforms with subprocess.stdio[*] as input', testGeneratorStdioInputPipe, false, false, 'webTransform');
test('Can use webTransforms with subprocess.stdio[*] as input, objectMode', testGeneratorStdioInputPipe, true, false, 'webTransform');
test('Can use webTransforms with subprocess.stdio[*] as input, noop transform', testGeneratorStdioInputPipe, false, true, 'webTransform');
test('Can use webTransforms with subprocess.stdio[*] as input, objectMode, noop transform', testGeneratorStdioInputPipe, true, true, 'webTransform');

// eslint-disable-next-line max-params
const testGeneratorOutput = async (t, fdNumber, reject, useShortcutProperty, objectMode, addNoopTransform, type, execaMethod) => {
	const {generators, output} = getOutputObjectMode(objectMode, addNoopTransform, type);
	const fixtureName = reject ? 'noop-fd.js' : 'noop-fail.js';
	const {stdout, stderr, stdio} = await execaMethod(fixtureName, [`${fdNumber}`, foobarString], {...getStdio(fdNumber, generators), reject});
	const result = useShortcutProperty ? [stdout, stderr][fdNumber - 1] : stdio[fdNumber];
	t.deepEqual(result, output);
};

test('Can use generators with result.stdio[1]', testGeneratorOutput, 1, true, false, false, false, 'generator', execa);
test('Can use generators with result.stdout', testGeneratorOutput, 1, true, true, false, false, 'generator', execa);
test('Can use generators with result.stdio[2]', testGeneratorOutput, 2, true, false, false, false, 'generator', execa);
test('Can use generators with result.stderr', testGeneratorOutput, 2, true, true, false, false, 'generator', execa);
test('Can use generators with result.stdio[*] as output', testGeneratorOutput, 3, true, false, false, false, 'generator', execa);
test('Can use generators with error.stdio[1]', testGeneratorOutput, 1, false, false, false, false, 'generator', execa);
test('Can use generators with error.stdout', testGeneratorOutput, 1, false, true, false, false, 'generator', execa);
test('Can use generators with error.stdio[2]', testGeneratorOutput, 2, false, false, false, false, 'generator', execa);
test('Can use generators with error.stderr', testGeneratorOutput, 2, false, true, false, false, 'generator', execa);
test('Can use generators with error.stdio[*] as output', testGeneratorOutput, 3, false, false, false, false, 'generator', execa);
test('Can use generators with result.stdio[1], objectMode', testGeneratorOutput, 1, true, false, true, false, 'generator', execa);
test('Can use generators with result.stdout, objectMode', testGeneratorOutput, 1, true, true, true, false, 'generator', execa);
test('Can use generators with result.stdio[2], objectMode', testGeneratorOutput, 2, true, false, true, false, 'generator', execa);
test('Can use generators with result.stderr, objectMode', testGeneratorOutput, 2, true, true, true, false, 'generator', execa);
test('Can use generators with result.stdio[*] as output, objectMode', testGeneratorOutput, 3, true, false, true, false, 'generator', execa);
test('Can use generators with error.stdio[1], objectMode', testGeneratorOutput, 1, false, false, true, false, 'generator', execa);
test('Can use generators with error.stdout, objectMode', testGeneratorOutput, 1, false, true, true, false, 'generator', execa);
test('Can use generators with error.stdio[2], objectMode', testGeneratorOutput, 2, false, false, true, false, 'generator', execa);
test('Can use generators with error.stderr, objectMode', testGeneratorOutput, 2, false, true, true, false, 'generator', execa);
test('Can use generators with error.stdio[*] as output, objectMode', testGeneratorOutput, 3, false, false, true, false, 'generator', execa);
test('Can use generators with result.stdio[1], noop transform', testGeneratorOutput, 1, true, false, false, true, 'generator', execa);
test('Can use generators with result.stdout, noop transform', testGeneratorOutput, 1, true, true, false, true, 'generator', execa);
test('Can use generators with result.stdio[2], noop transform', testGeneratorOutput, 2, true, false, false, true, 'generator', execa);
test('Can use generators with result.stderr, noop transform', testGeneratorOutput, 2, true, true, false, true, 'generator', execa);
test('Can use generators with result.stdio[*] as output, noop transform', testGeneratorOutput, 3, true, false, false, true, 'generator', execa);
test('Can use generators with error.stdio[1], noop transform', testGeneratorOutput, 1, false, false, false, true, 'generator', execa);
test('Can use generators with error.stdout, noop transform', testGeneratorOutput, 1, false, true, false, true, 'generator', execa);
test('Can use generators with error.stdio[2], noop transform', testGeneratorOutput, 2, false, false, false, true, 'generator', execa);
test('Can use generators with error.stderr, noop transform', testGeneratorOutput, 2, false, true, false, true, 'generator', execa);
test('Can use generators with error.stdio[*] as output, noop transform', testGeneratorOutput, 3, false, false, false, true, 'generator', execa);
test('Can use generators with result.stdio[1], objectMode, noop transform', testGeneratorOutput, 1, true, false, true, true, 'generator', execa);
test('Can use generators with result.stdout, objectMode, noop transform', testGeneratorOutput, 1, true, true, true, true, 'generator', execa);
test('Can use generators with result.stdio[2], objectMode, noop transform', testGeneratorOutput, 2, true, false, true, true, 'generator', execa);
test('Can use generators with result.stderr, objectMode, noop transform', testGeneratorOutput, 2, true, true, true, true, 'generator', execa);
test('Can use generators with result.stdio[*] as output, objectMode, noop transform', testGeneratorOutput, 3, true, false, true, true, 'generator', execa);
test('Can use generators with error.stdio[1], objectMode, noop transform', testGeneratorOutput, 1, false, false, true, true, 'generator', execa);
test('Can use generators with error.stdout, objectMode, noop transform', testGeneratorOutput, 1, false, true, true, true, 'generator', execa);
test('Can use generators with error.stdio[2], objectMode, noop transform', testGeneratorOutput, 2, false, false, true, true, 'generator', execa);
test('Can use generators with error.stderr, objectMode, noop transform', testGeneratorOutput, 2, false, true, true, true, 'generator', execa);
test('Can use generators with error.stdio[*] as output, objectMode, noop transform', testGeneratorOutput, 3, false, false, true, true, 'generator', execa);
test('Can use generators with result.stdio[1], sync', testGeneratorOutput, 1, true, false, false, false, 'generator', execaSync);
test('Can use generators with result.stdout, sync', testGeneratorOutput, 1, true, true, false, false, 'generator', execaSync);
test('Can use generators with result.stdio[2], sync', testGeneratorOutput, 2, true, false, false, false, 'generator', execaSync);
test('Can use generators with result.stderr, sync', testGeneratorOutput, 2, true, true, false, false, 'generator', execaSync);
test('Can use generators with result.stdio[*] as output, sync', testGeneratorOutput, 3, true, false, false, false, 'generator', execaSync);
test('Can use generators with error.stdio[1], sync', testGeneratorOutput, 1, false, false, false, false, 'generator', execaSync);
test('Can use generators with error.stdout, sync', testGeneratorOutput, 1, false, true, false, false, 'generator', execaSync);
test('Can use generators with error.stdio[2], sync', testGeneratorOutput, 2, false, false, false, false, 'generator', execaSync);
test('Can use generators with error.stderr, sync', testGeneratorOutput, 2, false, true, false, false, 'generator', execaSync);
test('Can use generators with error.stdio[*] as output, sync', testGeneratorOutput, 3, false, false, false, false, 'generator', execaSync);
test('Can use generators with result.stdio[1], objectMode, sync', testGeneratorOutput, 1, true, false, true, false, 'generator', execaSync);
test('Can use generators with result.stdout, objectMode, sync', testGeneratorOutput, 1, true, true, true, false, 'generator', execaSync);
test('Can use generators with result.stdio[2], objectMode, sync', testGeneratorOutput, 2, true, false, true, false, 'generator', execaSync);
test('Can use generators with result.stderr, objectMode, sync', testGeneratorOutput, 2, true, true, true, false, 'generator', execaSync);
test('Can use generators with result.stdio[*] as output, objectMode, sync', testGeneratorOutput, 3, true, false, true, false, 'generator', execaSync);
test('Can use generators with error.stdio[1], objectMode, sync', testGeneratorOutput, 1, false, false, true, false, 'generator', execaSync);
test('Can use generators with error.stdout, objectMode, sync', testGeneratorOutput, 1, false, true, true, false, 'generator', execaSync);
test('Can use generators with error.stdio[2], objectMode, sync', testGeneratorOutput, 2, false, false, true, false, 'generator', execaSync);
test('Can use generators with error.stderr, objectMode, sync', testGeneratorOutput, 2, false, true, true, false, 'generator', execaSync);
test('Can use generators with error.stdio[*] as output, objectMode, sync', testGeneratorOutput, 3, false, false, true, false, 'generator', execaSync);
test('Can use generators with result.stdio[1], noop transform, sync', testGeneratorOutput, 1, true, false, false, true, 'generator', execaSync);
test('Can use generators with result.stdout, noop transform, sync', testGeneratorOutput, 1, true, true, false, true, 'generator', execaSync);
test('Can use generators with result.stdio[2], noop transform, sync', testGeneratorOutput, 2, true, false, false, true, 'generator', execaSync);
test('Can use generators with result.stderr, noop transform, sync', testGeneratorOutput, 2, true, true, false, true, 'generator', execaSync);
test('Can use generators with result.stdio[*] as output, noop transform, sync', testGeneratorOutput, 3, true, false, false, true, 'generator', execaSync);
test('Can use generators with error.stdio[1], noop transform, sync', testGeneratorOutput, 1, false, false, false, true, 'generator', execaSync);
test('Can use generators with error.stdout, noop transform, sync', testGeneratorOutput, 1, false, true, false, true, 'generator', execaSync);
test('Can use generators with error.stdio[2], noop transform, sync', testGeneratorOutput, 2, false, false, false, true, 'generator', execaSync);
test('Can use generators with error.stderr, noop transform, sync', testGeneratorOutput, 2, false, true, false, true, 'generator', execaSync);
test('Can use generators with error.stdio[*] as output, noop transform, sync', testGeneratorOutput, 3, false, false, false, true, 'generator', execaSync);
test('Can use generators with result.stdio[1], objectMode, noop transform, sync', testGeneratorOutput, 1, true, false, true, true, 'generator', execaSync);
test('Can use generators with result.stdout, objectMode, noop transform, sync', testGeneratorOutput, 1, true, true, true, true, 'generator', execaSync);
test('Can use generators with result.stdio[2], objectMode, noop transform, sync', testGeneratorOutput, 2, true, false, true, true, 'generator', execaSync);
test('Can use generators with result.stderr, objectMode, noop transform, sync', testGeneratorOutput, 2, true, true, true, true, 'generator', execaSync);
test('Can use generators with result.stdio[*] as output, objectMode, noop transform, sync', testGeneratorOutput, 3, true, false, true, true, 'generator', execaSync);
test('Can use generators with error.stdio[1], objectMode, noop transform, sync', testGeneratorOutput, 1, false, false, true, true, 'generator', execaSync);
test('Can use generators with error.stdout, objectMode, noop transform, sync', testGeneratorOutput, 1, false, true, true, true, 'generator', execaSync);
test('Can use generators with error.stdio[2], objectMode, noop transform, sync', testGeneratorOutput, 2, false, false, true, true, 'generator', execaSync);
test('Can use generators with error.stderr, objectMode, noop transform, sync', testGeneratorOutput, 2, false, true, true, true, 'generator', execaSync);
test('Can use generators with error.stdio[*] as output, objectMode, noop transform, sync', testGeneratorOutput, 3, false, false, true, true, 'generator', execaSync);
test('Can use duplexes with result.stdio[1]', testGeneratorOutput, 1, true, false, false, false, 'duplex', execa);
test('Can use duplexes with result.stdout', testGeneratorOutput, 1, true, true, false, false, 'duplex', execa);
test('Can use duplexes with result.stdio[2]', testGeneratorOutput, 2, true, false, false, false, 'duplex', execa);
test('Can use duplexes with result.stderr', testGeneratorOutput, 2, true, true, false, false, 'duplex', execa);
test('Can use duplexes with result.stdio[*] as output', testGeneratorOutput, 3, true, false, false, false, 'duplex', execa);
test('Can use duplexes with error.stdio[1]', testGeneratorOutput, 1, false, false, false, false, 'duplex', execa);
test('Can use duplexes with error.stdout', testGeneratorOutput, 1, false, true, false, false, 'duplex', execa);
test('Can use duplexes with error.stdio[2]', testGeneratorOutput, 2, false, false, false, false, 'duplex', execa);
test('Can use duplexes with error.stderr', testGeneratorOutput, 2, false, true, false, false, 'duplex', execa);
test('Can use duplexes with error.stdio[*] as output', testGeneratorOutput, 3, false, false, false, false, 'duplex', execa);
test('Can use duplexes with result.stdio[1], objectMode', testGeneratorOutput, 1, true, false, true, false, 'duplex', execa);
test('Can use duplexes with result.stdout, objectMode', testGeneratorOutput, 1, true, true, true, false, 'duplex', execa);
test('Can use duplexes with result.stdio[2], objectMode', testGeneratorOutput, 2, true, false, true, false, 'duplex', execa);
test('Can use duplexes with result.stderr, objectMode', testGeneratorOutput, 2, true, true, true, false, 'duplex', execa);
test('Can use duplexes with result.stdio[*] as output, objectMode', testGeneratorOutput, 3, true, false, true, false, 'duplex', execa);
test('Can use duplexes with error.stdio[1], objectMode', testGeneratorOutput, 1, false, false, true, false, 'duplex', execa);
test('Can use duplexes with error.stdout, objectMode', testGeneratorOutput, 1, false, true, true, false, 'duplex', execa);
test('Can use duplexes with error.stdio[2], objectMode', testGeneratorOutput, 2, false, false, true, false, 'duplex', execa);
test('Can use duplexes with error.stderr, objectMode', testGeneratorOutput, 2, false, true, true, false, 'duplex', execa);
test('Can use duplexes with error.stdio[*] as output, objectMode', testGeneratorOutput, 3, false, false, true, false, 'duplex', execa);
test('Can use duplexes with result.stdio[1], noop transform', testGeneratorOutput, 1, true, false, false, true, 'duplex', execa);
test('Can use duplexes with result.stdout, noop transform', testGeneratorOutput, 1, true, true, false, true, 'duplex', execa);
test('Can use duplexes with result.stdio[2], noop transform', testGeneratorOutput, 2, true, false, false, true, 'duplex', execa);
test('Can use duplexes with result.stderr, noop transform', testGeneratorOutput, 2, true, true, false, true, 'duplex', execa);
test('Can use duplexes with result.stdio[*] as output, noop transform', testGeneratorOutput, 3, true, false, false, true, 'duplex', execa);
test('Can use duplexes with error.stdio[1], noop transform', testGeneratorOutput, 1, false, false, false, true, 'duplex', execa);
test('Can use duplexes with error.stdout, noop transform', testGeneratorOutput, 1, false, true, false, true, 'duplex', execa);
test('Can use duplexes with error.stdio[2], noop transform', testGeneratorOutput, 2, false, false, false, true, 'duplex', execa);
test('Can use duplexes with error.stderr, noop transform', testGeneratorOutput, 2, false, true, false, true, 'duplex', execa);
test('Can use duplexes with error.stdio[*] as output, noop transform', testGeneratorOutput, 3, false, false, false, true, 'duplex', execa);
test('Can use duplexes with result.stdio[1], objectMode, noop transform', testGeneratorOutput, 1, true, false, true, true, 'duplex', execa);
test('Can use duplexes with result.stdout, objectMode, noop transform', testGeneratorOutput, 1, true, true, true, true, 'duplex', execa);
test('Can use duplexes with result.stdio[2], objectMode, noop transform', testGeneratorOutput, 2, true, false, true, true, 'duplex', execa);
test('Can use duplexes with result.stderr, objectMode, noop transform', testGeneratorOutput, 2, true, true, true, true, 'duplex', execa);
test('Can use duplexes with result.stdio[*] as output, objectMode, noop transform', testGeneratorOutput, 3, true, false, true, true, 'duplex', execa);
test('Can use duplexes with error.stdio[1], objectMode, noop transform', testGeneratorOutput, 1, false, false, true, true, 'duplex', execa);
test('Can use duplexes with error.stdout, objectMode, noop transform', testGeneratorOutput, 1, false, true, true, true, 'duplex', execa);
test('Can use duplexes with error.stdio[2], objectMode, noop transform', testGeneratorOutput, 2, false, false, true, true, 'duplex', execa);
test('Can use duplexes with error.stderr, objectMode, noop transform', testGeneratorOutput, 2, false, true, true, true, 'duplex', execa);
test('Can use duplexes with error.stdio[*] as output, objectMode, noop transform', testGeneratorOutput, 3, false, false, true, true, 'duplex', execa);
test('Can use webTransforms with result.stdio[1]', testGeneratorOutput, 1, true, false, false, false, 'webTransform', execa);
test('Can use webTransforms with result.stdout', testGeneratorOutput, 1, true, true, false, false, 'webTransform', execa);
test('Can use webTransforms with result.stdio[2]', testGeneratorOutput, 2, true, false, false, false, 'webTransform', execa);
test('Can use webTransforms with result.stderr', testGeneratorOutput, 2, true, true, false, false, 'webTransform', execa);
test('Can use webTransforms with result.stdio[*] as output', testGeneratorOutput, 3, true, false, false, false, 'webTransform', execa);
test('Can use webTransforms with error.stdio[1]', testGeneratorOutput, 1, false, false, false, false, 'webTransform', execa);
test('Can use webTransforms with error.stdout', testGeneratorOutput, 1, false, true, false, false, 'webTransform', execa);
test('Can use webTransforms with error.stdio[2]', testGeneratorOutput, 2, false, false, false, false, 'webTransform', execa);
test('Can use webTransforms with error.stderr', testGeneratorOutput, 2, false, true, false, false, 'webTransform', execa);
test('Can use webTransforms with error.stdio[*] as output', testGeneratorOutput, 3, false, false, false, false, 'webTransform', execa);
test('Can use webTransforms with result.stdio[1], objectMode', testGeneratorOutput, 1, true, false, true, false, 'webTransform', execa);
test('Can use webTransforms with result.stdout, objectMode', testGeneratorOutput, 1, true, true, true, false, 'webTransform', execa);
test('Can use webTransforms with result.stdio[2], objectMode', testGeneratorOutput, 2, true, false, true, false, 'webTransform', execa);
test('Can use webTransforms with result.stderr, objectMode', testGeneratorOutput, 2, true, true, true, false, 'webTransform', execa);
test('Can use webTransforms with result.stdio[*] as output, objectMode', testGeneratorOutput, 3, true, false, true, false, 'webTransform', execa);
test('Can use webTransforms with error.stdio[1], objectMode', testGeneratorOutput, 1, false, false, true, false, 'webTransform', execa);
test('Can use webTransforms with error.stdout, objectMode', testGeneratorOutput, 1, false, true, true, false, 'webTransform', execa);
test('Can use webTransforms with error.stdio[2], objectMode', testGeneratorOutput, 2, false, false, true, false, 'webTransform', execa);
test('Can use webTransforms with error.stderr, objectMode', testGeneratorOutput, 2, false, true, true, false, 'webTransform', execa);
test('Can use webTransforms with error.stdio[*] as output, objectMode', testGeneratorOutput, 3, false, false, true, false, 'webTransform', execa);
test('Can use webTransforms with result.stdio[1], noop transform', testGeneratorOutput, 1, true, false, false, true, 'webTransform', execa);
test('Can use webTransforms with result.stdout, noop transform', testGeneratorOutput, 1, true, true, false, true, 'webTransform', execa);
test('Can use webTransforms with result.stdio[2], noop transform', testGeneratorOutput, 2, true, false, false, true, 'webTransform', execa);
test('Can use webTransforms with result.stderr, noop transform', testGeneratorOutput, 2, true, true, false, true, 'webTransform', execa);
test('Can use webTransforms with result.stdio[*] as output, noop transform', testGeneratorOutput, 3, true, false, false, true, 'webTransform', execa);
test('Can use webTransforms with error.stdio[1], noop transform', testGeneratorOutput, 1, false, false, false, true, 'webTransform', execa);
test('Can use webTransforms with error.stdout, noop transform', testGeneratorOutput, 1, false, true, false, true, 'webTransform', execa);
test('Can use webTransforms with error.stdio[2], noop transform', testGeneratorOutput, 2, false, false, false, true, 'webTransform', execa);
test('Can use webTransforms with error.stderr, noop transform', testGeneratorOutput, 2, false, true, false, true, 'webTransform', execa);
test('Can use webTransforms with error.stdio[*] as output, noop transform', testGeneratorOutput, 3, false, false, false, true, 'webTransform', execa);
test('Can use webTransforms with result.stdio[1], objectMode, noop transform', testGeneratorOutput, 1, true, false, true, true, 'webTransform', execa);
test('Can use webTransforms with result.stdout, objectMode, noop transform', testGeneratorOutput, 1, true, true, true, true, 'webTransform', execa);
test('Can use webTransforms with result.stdio[2], objectMode, noop transform', testGeneratorOutput, 2, true, false, true, true, 'webTransform', execa);
test('Can use webTransforms with result.stderr, objectMode, noop transform', testGeneratorOutput, 2, true, true, true, true, 'webTransform', execa);
test('Can use webTransforms with result.stdio[*] as output, objectMode, noop transform', testGeneratorOutput, 3, true, false, true, true, 'webTransform', execa);
test('Can use webTransforms with error.stdio[1], objectMode, noop transform', testGeneratorOutput, 1, false, false, true, true, 'webTransform', execa);
test('Can use webTransforms with error.stdout, objectMode, noop transform', testGeneratorOutput, 1, false, true, true, true, 'webTransform', execa);
test('Can use webTransforms with error.stdio[2], objectMode, noop transform', testGeneratorOutput, 2, false, false, true, true, 'webTransform', execa);
test('Can use webTransforms with error.stderr, objectMode, noop transform', testGeneratorOutput, 2, false, true, true, true, 'webTransform', execa);
test('Can use webTransforms with error.stdio[*] as output, objectMode, noop transform', testGeneratorOutput, 3, false, false, true, true, 'webTransform', execa);

// eslint-disable-next-line max-params
const testGeneratorOutputPipe = async (t, fdNumber, useShortcutProperty, objectMode, addNoopTransform, type) => {
	const {generators, output, getStreamMethod} = getOutputObjectMode(objectMode, addNoopTransform, type, true);
	const subprocess = execa('noop-fd.js', [`${fdNumber}`, foobarString], getStdio(fdNumber, generators));
	const stream = useShortcutProperty ? [subprocess.stdout, subprocess.stderr][fdNumber - 1] : subprocess.stdio[fdNumber];
	const [result] = await Promise.all([getStreamMethod(stream), subprocess]);
	t.deepEqual(result, output);
};

test('Can use generators with subprocess.stdio[1]', testGeneratorOutputPipe, 1, false, false, false, 'generator');
test('Can use generators with subprocess.stdout', testGeneratorOutputPipe, 1, true, false, false, 'generator');
test('Can use generators with subprocess.stdio[2]', testGeneratorOutputPipe, 2, false, false, false, 'generator');
test('Can use generators with subprocess.stderr', testGeneratorOutputPipe, 2, true, false, false, 'generator');
test('Can use generators with subprocess.stdio[*] as output', testGeneratorOutputPipe, 3, false, false, false, 'generator');
test('Can use generators with subprocess.stdio[1], objectMode', testGeneratorOutputPipe, 1, false, true, false, 'generator');
test('Can use generators with subprocess.stdout, objectMode', testGeneratorOutputPipe, 1, true, true, false, 'generator');
test('Can use generators with subprocess.stdio[2], objectMode', testGeneratorOutputPipe, 2, false, true, false, 'generator');
test('Can use generators with subprocess.stderr, objectMode', testGeneratorOutputPipe, 2, true, true, false, 'generator');
test('Can use generators with subprocess.stdio[*] as output, objectMode', testGeneratorOutputPipe, 3, false, true, false, 'generator');
test('Can use generators with subprocess.stdio[1], noop transform', testGeneratorOutputPipe, 1, false, false, true, 'generator');
test('Can use generators with subprocess.stdout, noop transform', testGeneratorOutputPipe, 1, true, false, true, 'generator');
test('Can use generators with subprocess.stdio[2], noop transform', testGeneratorOutputPipe, 2, false, false, true, 'generator');
test('Can use generators with subprocess.stderr, noop transform', testGeneratorOutputPipe, 2, true, false, true, 'generator');
test('Can use generators with subprocess.stdio[*] as output, noop transform', testGeneratorOutputPipe, 3, false, false, true, 'generator');
test('Can use generators with subprocess.stdio[1], objectMode, noop transform', testGeneratorOutputPipe, 1, false, true, true, 'generator');
test('Can use generators with subprocess.stdout, objectMode, noop transform', testGeneratorOutputPipe, 1, true, true, true, 'generator');
test('Can use generators with subprocess.stdio[2], objectMode, noop transform', testGeneratorOutputPipe, 2, false, true, true, 'generator');
test('Can use generators with subprocess.stderr, objectMode, noop transform', testGeneratorOutputPipe, 2, true, true, true, 'generator');
test('Can use generators with subprocess.stdio[*] as output, objectMode, noop transform', testGeneratorOutputPipe, 3, false, true, true, 'generator');
test('Can use duplexes with subprocess.stdio[1]', testGeneratorOutputPipe, 1, false, false, false, 'duplex');
test('Can use duplexes with subprocess.stdout', testGeneratorOutputPipe, 1, true, false, false, 'duplex');
test('Can use duplexes with subprocess.stdio[2]', testGeneratorOutputPipe, 2, false, false, false, 'duplex');
test('Can use duplexes with subprocess.stderr', testGeneratorOutputPipe, 2, true, false, false, 'duplex');
test('Can use duplexes with subprocess.stdio[*] as output', testGeneratorOutputPipe, 3, false, false, false, 'duplex');
test('Can use duplexes with subprocess.stdio[1], objectMode', testGeneratorOutputPipe, 1, false, true, false, 'duplex');
test('Can use duplexes with subprocess.stdout, objectMode', testGeneratorOutputPipe, 1, true, true, false, 'duplex');
test('Can use duplexes with subprocess.stdio[2], objectMode', testGeneratorOutputPipe, 2, false, true, false, 'duplex');
test('Can use duplexes with subprocess.stderr, objectMode', testGeneratorOutputPipe, 2, true, true, false, 'duplex');
test('Can use duplexes with subprocess.stdio[*] as output, objectMode', testGeneratorOutputPipe, 3, false, true, false, 'duplex');
test('Can use duplexes with subprocess.stdio[1], noop transform', testGeneratorOutputPipe, 1, false, false, true, 'duplex');
test('Can use duplexes with subprocess.stdout, noop transform', testGeneratorOutputPipe, 1, true, false, true, 'duplex');
test('Can use duplexes with subprocess.stdio[2], noop transform', testGeneratorOutputPipe, 2, false, false, true, 'duplex');
test('Can use duplexes with subprocess.stderr, noop transform', testGeneratorOutputPipe, 2, true, false, true, 'duplex');
test('Can use duplexes with subprocess.stdio[*] as output, noop transform', testGeneratorOutputPipe, 3, false, false, true, 'duplex');
test('Can use duplexes with subprocess.stdio[1], objectMode, noop transform', testGeneratorOutputPipe, 1, false, true, true, 'duplex');
test('Can use duplexes with subprocess.stdout, objectMode, noop transform', testGeneratorOutputPipe, 1, true, true, true, 'duplex');
test('Can use duplexes with subprocess.stdio[2], objectMode, noop transform', testGeneratorOutputPipe, 2, false, true, true, 'duplex');
test('Can use duplexes with subprocess.stderr, objectMode, noop transform', testGeneratorOutputPipe, 2, true, true, true, 'duplex');
test('Can use duplexes with subprocess.stdio[*] as output, objectMode, noop transform', testGeneratorOutputPipe, 3, false, true, true, 'duplex');
test('Can use webTransforms with subprocess.stdio[1]', testGeneratorOutputPipe, 1, false, false, false, 'webTransform');
test('Can use webTransforms with subprocess.stdout', testGeneratorOutputPipe, 1, true, false, false, 'webTransform');
test('Can use webTransforms with subprocess.stdio[2]', testGeneratorOutputPipe, 2, false, false, false, 'webTransform');
test('Can use webTransforms with subprocess.stderr', testGeneratorOutputPipe, 2, true, false, false, 'webTransform');
test('Can use webTransforms with subprocess.stdio[*] as output', testGeneratorOutputPipe, 3, false, false, false, 'webTransform');
test('Can use webTransforms with subprocess.stdio[1], objectMode', testGeneratorOutputPipe, 1, false, true, false, 'webTransform');
test('Can use webTransforms with subprocess.stdout, objectMode', testGeneratorOutputPipe, 1, true, true, false, 'webTransform');
test('Can use webTransforms with subprocess.stdio[2], objectMode', testGeneratorOutputPipe, 2, false, true, false, 'webTransform');
test('Can use webTransforms with subprocess.stderr, objectMode', testGeneratorOutputPipe, 2, true, true, false, 'webTransform');
test('Can use webTransforms with subprocess.stdio[*] as output, objectMode', testGeneratorOutputPipe, 3, false, true, false, 'webTransform');
test('Can use webTransforms with subprocess.stdio[1], noop transform', testGeneratorOutputPipe, 1, false, false, true, 'webTransform');
test('Can use webTransforms with subprocess.stdout, noop transform', testGeneratorOutputPipe, 1, true, false, true, 'webTransform');
test('Can use webTransforms with subprocess.stdio[2], noop transform', testGeneratorOutputPipe, 2, false, false, true, 'webTransform');
test('Can use webTransforms with subprocess.stderr, noop transform', testGeneratorOutputPipe, 2, true, false, true, 'webTransform');
test('Can use webTransforms with subprocess.stdio[*] as output, noop transform', testGeneratorOutputPipe, 3, false, false, true, 'webTransform');
test('Can use webTransforms with subprocess.stdio[1], objectMode, noop transform', testGeneratorOutputPipe, 1, false, true, true, 'webTransform');
test('Can use webTransforms with subprocess.stdout, objectMode, noop transform', testGeneratorOutputPipe, 1, true, true, true, 'webTransform');
test('Can use webTransforms with subprocess.stdio[2], objectMode, noop transform', testGeneratorOutputPipe, 2, false, true, true, 'webTransform');
test('Can use webTransforms with subprocess.stderr, objectMode, noop transform', testGeneratorOutputPipe, 2, true, true, true, 'webTransform');
test('Can use webTransforms with subprocess.stdio[*] as output, objectMode, noop transform', testGeneratorOutputPipe, 3, false, true, true, 'webTransform');

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
const testGeneratorAll = async (t, reject, encoding, objectMode, stdoutOption, stderrOption, lines, execaMethod) => {
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

	const stdoutOutput = getStdoutStderrOutput({output: 'std\nout\n', stdioOption: stdoutOption, encoding, objectMode, lines});
	t.deepEqual(stdout, stdoutOutput);
	const stderrOutput = getStdoutStderrOutput({output: 'std\nerr\n', stdioOption: stderrOption, encoding, objectMode, lines});
	t.deepEqual(stderr, stderrOutput);
	const allOutput = getAllOutput({stdoutOutput, stderrOutput, encoding, objectMode, lines});
	if (Array.isArray(all) && Array.isArray(allOutput)) {
		t.deepEqual([...all].sort(), [...allOutput].sort());
	} else {
		t.deepEqual(all, allOutput);
	}
};

test('Can use generators with result.all = transform + transform', testGeneratorAll, true, 'utf8', false, false, false, false, execa);
test('Can use generators with error.all = transform + transform', testGeneratorAll, false, 'utf8', false, false, false, false, execa);
test('Can use generators with result.all = transform + transform, encoding "buffer"', testGeneratorAll, true, 'buffer', false, false, false, false, execa);
test('Can use generators with error.all = transform + transform, encoding "buffer"', testGeneratorAll, false, 'buffer', false, false, false, false, execa);
test('Can use generators with result.all = transform + transform, encoding "hex"', testGeneratorAll, true, 'hex', false, false, false, false, execa);
test('Can use generators with error.all = transform + transform, encoding "hex"', testGeneratorAll, false, 'hex', false, false, false, false, execa);
test('Can use generators with result.all = transform + pipe', testGeneratorAll, true, 'utf8', false, false, true, false, execa);
test('Can use generators with error.all = transform + pipe', testGeneratorAll, false, 'utf8', false, false, true, false, execa);
test('Can use generators with result.all = transform + pipe, encoding "buffer"', testGeneratorAll, true, 'buffer', false, false, true, false, execa);
test('Can use generators with error.all = transform + pipe, encoding "buffer"', testGeneratorAll, false, 'buffer', false, false, true, false, execa);
test('Can use generators with result.all = transform + pipe, encoding "hex"', testGeneratorAll, true, 'hex', false, false, true, false, execa);
test('Can use generators with error.all = transform + pipe, encoding "hex"', testGeneratorAll, false, 'hex', false, false, true, false, execa);
test('Can use generators with result.all = pipe + transform', testGeneratorAll, true, 'utf8', false, true, false, false, execa);
test('Can use generators with error.all = pipe + transform', testGeneratorAll, false, 'utf8', false, true, false, false, execa);
test('Can use generators with result.all = pipe + transform, encoding "buffer"', testGeneratorAll, true, 'buffer', false, true, false, false, execa);
test('Can use generators with error.all = pipe + transform, encoding "buffer"', testGeneratorAll, false, 'buffer', false, true, false, false, execa);
test('Can use generators with result.all = pipe + transform, encoding "hex"', testGeneratorAll, true, 'hex', false, true, false, false, execa);
test('Can use generators with error.all = pipe + transform, encoding "hex"', testGeneratorAll, false, 'hex', false, true, false, false, execa);
test('Can use generators with result.all = transform + transform, objectMode', testGeneratorAll, true, 'utf8', true, false, false, false, execa);
test('Can use generators with error.all = transform + transform, objectMode', testGeneratorAll, false, 'utf8', true, false, false, false, execa);
test('Can use generators with result.all = transform + transform, objectMode, encoding "buffer"', testGeneratorAll, true, 'buffer', true, false, false, false, execa);
test('Can use generators with error.all = transform + transform, objectMode, encoding "buffer"', testGeneratorAll, false, 'buffer', true, false, false, false, execa);
test('Can use generators with result.all = transform + transform, objectMode, encoding "hex"', testGeneratorAll, true, 'hex', true, false, false, false, execa);
test('Can use generators with error.all = transform + transform, objectMode, encoding "hex"', testGeneratorAll, false, 'hex', true, false, false, false, execa);
test('Can use generators with result.all = transform + pipe, objectMode', testGeneratorAll, true, 'utf8', true, false, true, false, execa);
test('Can use generators with error.all = transform + pipe, objectMode', testGeneratorAll, false, 'utf8', true, false, true, false, execa);
test('Can use generators with result.all = transform + pipe, objectMode, encoding "buffer"', testGeneratorAll, true, 'buffer', true, false, true, false, execa);
test('Can use generators with error.all = transform + pipe, objectMode, encoding "buffer"', testGeneratorAll, false, 'buffer', true, false, true, false, execa);
test('Can use generators with result.all = transform + pipe, objectMode, encoding "hex"', testGeneratorAll, true, 'hex', true, false, true, false, execa);
test('Can use generators with error.all = transform + pipe, objectMode, encoding "hex"', testGeneratorAll, false, 'hex', true, false, true, false, execa);
test('Can use generators with result.all = pipe + transform, objectMode', testGeneratorAll, true, 'utf8', true, true, false, false, execa);
test('Can use generators with error.all = pipe + transform, objectMode', testGeneratorAll, false, 'utf8', true, true, false, false, execa);
test('Can use generators with result.all = pipe + transform, objectMode, encoding "buffer"', testGeneratorAll, true, 'buffer', true, true, false, false, execa);
test('Can use generators with error.all = pipe + transform, objectMode, encoding "buffer"', testGeneratorAll, false, 'buffer', true, true, false, false, execa);
test('Can use generators with result.all = pipe + transform, objectMode, encoding "hex"', testGeneratorAll, true, 'hex', true, true, false, false, execa);
test('Can use generators with error.all = pipe + transform, objectMode, encoding "hex"', testGeneratorAll, false, 'hex', true, true, false, false, execa);
test('Can use generators with result.all = transform + transform, sync', testGeneratorAll, true, 'utf8', false, false, false, false, execaSync);
test('Can use generators with error.all = transform + transform, sync', testGeneratorAll, false, 'utf8', false, false, false, false, execaSync);
test('Can use generators with result.all = transform + transform, encoding "buffer", sync', testGeneratorAll, true, 'buffer', false, false, false, false, execaSync);
test('Can use generators with error.all = transform + transform, encoding "buffer", sync', testGeneratorAll, false, 'buffer', false, false, false, false, execaSync);
test('Can use generators with result.all = transform + transform, encoding "hex", sync', testGeneratorAll, true, 'hex', false, false, false, false, execaSync);
test('Can use generators with error.all = transform + transform, encoding "hex", sync', testGeneratorAll, false, 'hex', false, false, false, false, execaSync);
test('Can use generators with result.all = transform + pipe, sync', testGeneratorAll, true, 'utf8', false, false, true, false, execaSync);
test('Can use generators with error.all = transform + pipe, sync', testGeneratorAll, false, 'utf8', false, false, true, false, execaSync);
test('Can use generators with result.all = transform + pipe, encoding "buffer", sync', testGeneratorAll, true, 'buffer', false, false, true, false, execaSync);
test('Can use generators with error.all = transform + pipe, encoding "buffer", sync', testGeneratorAll, false, 'buffer', false, false, true, false, execaSync);
test('Can use generators with result.all = transform + pipe, encoding "hex", sync', testGeneratorAll, true, 'hex', false, false, true, false, execaSync);
test('Can use generators with error.all = transform + pipe, encoding "hex", sync', testGeneratorAll, false, 'hex', false, false, true, false, execaSync);
test('Can use generators with result.all = pipe + transform, sync', testGeneratorAll, true, 'utf8', false, true, false, false, execaSync);
test('Can use generators with error.all = pipe + transform, sync', testGeneratorAll, false, 'utf8', false, true, false, false, execaSync);
test('Can use generators with result.all = pipe + transform, encoding "buffer", sync', testGeneratorAll, true, 'buffer', false, true, false, false, execaSync);
test('Can use generators with error.all = pipe + transform, encoding "buffer", sync', testGeneratorAll, false, 'buffer', false, true, false, false, execaSync);
test('Can use generators with result.all = pipe + transform, encoding "hex", sync', testGeneratorAll, true, 'hex', false, true, false, false, execaSync);
test('Can use generators with error.all = pipe + transform, encoding "hex", sync', testGeneratorAll, false, 'hex', false, true, false, false, execaSync);
test('Can use generators with result.all = transform + transform, objectMode, sync', testGeneratorAll, true, 'utf8', true, false, false, false, execaSync);
test('Can use generators with error.all = transform + transform, objectMode, sync', testGeneratorAll, false, 'utf8', true, false, false, false, execaSync);
test('Can use generators with result.all = transform + transform, objectMode, encoding "buffer", sync', testGeneratorAll, true, 'buffer', true, false, false, false, execaSync);
test('Can use generators with error.all = transform + transform, objectMode, encoding "buffer", sync', testGeneratorAll, false, 'buffer', true, false, false, false, execaSync);
test('Can use generators with result.all = transform + transform, objectMode, encoding "hex", sync', testGeneratorAll, true, 'hex', true, false, false, false, execaSync);
test('Can use generators with error.all = transform + transform, objectMode, encoding "hex", sync', testGeneratorAll, false, 'hex', true, false, false, false, execaSync);
test('Can use generators with result.all = transform + pipe, objectMode, sync', testGeneratorAll, true, 'utf8', true, false, true, false, execaSync);
test('Can use generators with error.all = transform + pipe, objectMode, sync', testGeneratorAll, false, 'utf8', true, false, true, false, execaSync);
test('Can use generators with result.all = transform + pipe, objectMode, encoding "buffer", sync', testGeneratorAll, true, 'buffer', true, false, true, false, execaSync);
test('Can use generators with error.all = transform + pipe, objectMode, encoding "buffer", sync', testGeneratorAll, false, 'buffer', true, false, true, false, execaSync);
test('Can use generators with result.all = transform + pipe, objectMode, encoding "hex", sync', testGeneratorAll, true, 'hex', true, false, true, false, execaSync);
test('Can use generators with error.all = transform + pipe, objectMode, encoding "hex", sync', testGeneratorAll, false, 'hex', true, false, true, false, execaSync);
test('Can use generators with result.all = pipe + transform, objectMode, sync', testGeneratorAll, true, 'utf8', true, true, false, false, execaSync);
test('Can use generators with error.all = pipe + transform, objectMode, sync', testGeneratorAll, false, 'utf8', true, true, false, false, execaSync);
test('Can use generators with result.all = pipe + transform, objectMode, encoding "buffer", sync', testGeneratorAll, true, 'buffer', true, true, false, false, execaSync);
test('Can use generators with error.all = pipe + transform, objectMode, encoding "buffer", sync', testGeneratorAll, false, 'buffer', true, true, false, false, execaSync);
test('Can use generators with result.all = pipe + transform, objectMode, encoding "hex", sync', testGeneratorAll, true, 'hex', true, true, false, false, execaSync);
test('Can use generators with error.all = pipe + transform, objectMode, encoding "hex", sync', testGeneratorAll, false, 'hex', true, true, false, false, execaSync);
test('Can use generators with result.all = transform + transform, lines', testGeneratorAll, true, 'utf8', false, false, false, true, execa);
test('Can use generators with error.all = transform + transform, lines', testGeneratorAll, false, 'utf8', false, false, false, true, execa);
test('Can use generators with result.all = transform + transform, encoding "buffer", lines', testGeneratorAll, true, 'buffer', false, false, false, true, execa);
test('Can use generators with error.all = transform + transform, encoding "buffer", lines', testGeneratorAll, false, 'buffer', false, false, false, true, execa);
test('Can use generators with result.all = transform + transform, encoding "hex", lines', testGeneratorAll, true, 'hex', false, false, false, true, execa);
test('Can use generators with error.all = transform + transform, encoding "hex", lines', testGeneratorAll, false, 'hex', false, false, false, true, execa);
test('Can use generators with result.all = transform + pipe, lines', testGeneratorAll, true, 'utf8', false, false, true, true, execa);
test('Can use generators with error.all = transform + pipe, lines', testGeneratorAll, false, 'utf8', false, false, true, true, execa);
test('Can use generators with result.all = transform + pipe, encoding "buffer", lines', testGeneratorAll, true, 'buffer', false, false, true, true, execa);
test('Can use generators with error.all = transform + pipe, encoding "buffer", lines', testGeneratorAll, false, 'buffer', false, false, true, true, execa);
test('Can use generators with result.all = transform + pipe, encoding "hex", lines', testGeneratorAll, true, 'hex', false, false, true, true, execa);
test('Can use generators with error.all = transform + pipe, encoding "hex", lines', testGeneratorAll, false, 'hex', false, false, true, true, execa);
test('Can use generators with result.all = pipe + transform, lines', testGeneratorAll, true, 'utf8', false, true, false, true, execa);
test('Can use generators with error.all = pipe + transform, lines', testGeneratorAll, false, 'utf8', false, true, false, true, execa);
test('Can use generators with result.all = pipe + transform, encoding "buffer", lines', testGeneratorAll, true, 'buffer', false, true, false, true, execa);
test('Can use generators with error.all = pipe + transform, encoding "buffer", lines', testGeneratorAll, false, 'buffer', false, true, false, true, execa);
test('Can use generators with result.all = pipe + transform, encoding "hex", lines', testGeneratorAll, true, 'hex', false, true, false, true, execa);
test('Can use generators with error.all = pipe + transform, encoding "hex", lines', testGeneratorAll, false, 'hex', false, true, false, true, execa);
test('Can use generators with result.all = transform + transform, objectMode, lines', testGeneratorAll, true, 'utf8', true, false, false, true, execa);
test('Can use generators with error.all = transform + transform, objectMode, lines', testGeneratorAll, false, 'utf8', true, false, false, true, execa);
test('Can use generators with result.all = transform + transform, objectMode, encoding "buffer", lines', testGeneratorAll, true, 'buffer', true, false, false, true, execa);
test('Can use generators with error.all = transform + transform, objectMode, encoding "buffer", lines', testGeneratorAll, false, 'buffer', true, false, false, true, execa);
test('Can use generators with result.all = transform + transform, objectMode, encoding "hex", lines', testGeneratorAll, true, 'hex', true, false, false, true, execa);
test('Can use generators with error.all = transform + transform, objectMode, encoding "hex", lines', testGeneratorAll, false, 'hex', true, false, false, true, execa);
test('Can use generators with result.all = transform + pipe, objectMode, lines', testGeneratorAll, true, 'utf8', true, false, true, true, execa);
test('Can use generators with error.all = transform + pipe, objectMode, lines', testGeneratorAll, false, 'utf8', true, false, true, true, execa);
test('Can use generators with result.all = transform + pipe, objectMode, encoding "buffer", lines', testGeneratorAll, true, 'buffer', true, false, true, true, execa);
test('Can use generators with error.all = transform + pipe, objectMode, encoding "buffer", lines', testGeneratorAll, false, 'buffer', true, false, true, true, execa);
test('Can use generators with result.all = transform + pipe, objectMode, encoding "hex", lines', testGeneratorAll, true, 'hex', true, false, true, true, execa);
test('Can use generators with error.all = transform + pipe, objectMode, encoding "hex", lines', testGeneratorAll, false, 'hex', true, false, true, true, execa);
test('Can use generators with result.all = pipe + transform, objectMode, lines', testGeneratorAll, true, 'utf8', true, true, false, true, execa);
test('Can use generators with error.all = pipe + transform, objectMode, lines', testGeneratorAll, false, 'utf8', true, true, false, true, execa);
test('Can use generators with result.all = pipe + transform, objectMode, encoding "buffer", lines', testGeneratorAll, true, 'buffer', true, true, false, true, execa);
test('Can use generators with error.all = pipe + transform, objectMode, encoding "buffer", lines', testGeneratorAll, false, 'buffer', true, true, false, true, execa);
test('Can use generators with result.all = pipe + transform, objectMode, encoding "hex", lines', testGeneratorAll, true, 'hex', true, true, false, true, execa);
test('Can use generators with error.all = pipe + transform, objectMode, encoding "hex", lines', testGeneratorAll, false, 'hex', true, true, false, true, execa);
test('Can use generators with result.all = transform + transform, sync, lines', testGeneratorAll, true, 'utf8', false, false, false, true, execaSync);
test('Can use generators with error.all = transform + transform, sync, lines', testGeneratorAll, false, 'utf8', false, false, false, true, execaSync);
test('Can use generators with result.all = transform + transform, encoding "buffer", sync, lines', testGeneratorAll, true, 'buffer', false, false, false, true, execaSync);
test('Can use generators with error.all = transform + transform, encoding "buffer", sync, lines', testGeneratorAll, false, 'buffer', false, false, false, true, execaSync);
test('Can use generators with result.all = transform + transform, encoding "hex", sync, lines', testGeneratorAll, true, 'hex', false, false, false, true, execaSync);
test('Can use generators with error.all = transform + transform, encoding "hex", sync, lines', testGeneratorAll, false, 'hex', false, false, false, true, execaSync);
test('Can use generators with result.all = transform + pipe, sync, lines', testGeneratorAll, true, 'utf8', false, false, true, true, execaSync);
test('Can use generators with error.all = transform + pipe, sync, lines', testGeneratorAll, false, 'utf8', false, false, true, true, execaSync);
test('Can use generators with result.all = transform + pipe, encoding "buffer", sync, lines', testGeneratorAll, true, 'buffer', false, false, true, true, execaSync);
test('Can use generators with error.all = transform + pipe, encoding "buffer", sync, lines', testGeneratorAll, false, 'buffer', false, false, true, true, execaSync);
test('Can use generators with result.all = transform + pipe, encoding "hex", sync, lines', testGeneratorAll, true, 'hex', false, false, true, true, execaSync);
test('Can use generators with error.all = transform + pipe, encoding "hex", sync, lines', testGeneratorAll, false, 'hex', false, false, true, true, execaSync);
test('Can use generators with result.all = pipe + transform, sync, lines', testGeneratorAll, true, 'utf8', false, true, false, true, execaSync);
test('Can use generators with error.all = pipe + transform, sync, lines', testGeneratorAll, false, 'utf8', false, true, false, true, execaSync);
test('Can use generators with result.all = pipe + transform, encoding "buffer", sync, lines', testGeneratorAll, true, 'buffer', false, true, false, true, execaSync);
test('Can use generators with error.all = pipe + transform, encoding "buffer", sync, lines', testGeneratorAll, false, 'buffer', false, true, false, true, execaSync);
test('Can use generators with result.all = pipe + transform, encoding "hex", sync, lines', testGeneratorAll, true, 'hex', false, true, false, true, execaSync);
test('Can use generators with error.all = pipe + transform, encoding "hex", sync, lines', testGeneratorAll, false, 'hex', false, true, false, true, execaSync);
test('Can use generators with result.all = transform + transform, objectMode, sync, lines', testGeneratorAll, true, 'utf8', true, false, false, true, execaSync);
test('Can use generators with error.all = transform + transform, objectMode, sync, lines', testGeneratorAll, false, 'utf8', true, false, false, true, execaSync);
test('Can use generators with result.all = transform + transform, objectMode, encoding "buffer", sync, lines', testGeneratorAll, true, 'buffer', true, false, false, true, execaSync);
test('Can use generators with error.all = transform + transform, objectMode, encoding "buffer", sync, lines', testGeneratorAll, false, 'buffer', true, false, false, true, execaSync);
test('Can use generators with result.all = transform + transform, objectMode, encoding "hex", sync, lines', testGeneratorAll, true, 'hex', true, false, false, true, execaSync);
test('Can use generators with error.all = transform + transform, objectMode, encoding "hex", sync, lines', testGeneratorAll, false, 'hex', true, false, false, true, execaSync);
test('Can use generators with result.all = transform + pipe, objectMode, sync, lines', testGeneratorAll, true, 'utf8', true, false, true, true, execaSync);
test('Can use generators with error.all = transform + pipe, objectMode, sync, lines', testGeneratorAll, false, 'utf8', true, false, true, true, execaSync);
test('Can use generators with result.all = transform + pipe, objectMode, encoding "buffer", sync, lines', testGeneratorAll, true, 'buffer', true, false, true, true, execaSync);
test('Can use generators with error.all = transform + pipe, objectMode, encoding "buffer", sync, lines', testGeneratorAll, false, 'buffer', true, false, true, true, execaSync);
test('Can use generators with result.all = transform + pipe, objectMode, encoding "hex", sync, lines', testGeneratorAll, true, 'hex', true, false, true, true, execaSync);
test('Can use generators with error.all = transform + pipe, objectMode, encoding "hex", sync, lines', testGeneratorAll, false, 'hex', true, false, true, true, execaSync);
test('Can use generators with result.all = pipe + transform, objectMode, sync, lines', testGeneratorAll, true, 'utf8', true, true, false, true, execaSync);
test('Can use generators with error.all = pipe + transform, objectMode, sync, lines', testGeneratorAll, false, 'utf8', true, true, false, true, execaSync);
test('Can use generators with result.all = pipe + transform, objectMode, encoding "buffer", sync, lines', testGeneratorAll, true, 'buffer', true, true, false, true, execaSync);
test('Can use generators with error.all = pipe + transform, objectMode, encoding "buffer", sync, lines', testGeneratorAll, false, 'buffer', true, true, false, true, execaSync);
test('Can use generators with result.all = pipe + transform, objectMode, encoding "hex", sync, lines', testGeneratorAll, true, 'hex', true, true, false, true, execaSync);
test('Can use generators with error.all = pipe + transform, objectMode, encoding "hex", sync, lines', testGeneratorAll, false, 'hex', true, true, false, true, execaSync);

const testInputOption = async (t, type, execaMethod) => {
	const {stdout} = await execaMethod('stdin-fd.js', ['0'], {stdin: generatorsMap[type].uppercase(), input: foobarUint8Array});
	t.is(stdout, foobarUppercase);
};

test('Can use generators with input option', testInputOption, 'generator', execa);
test('Can use generators with input option, sync', testInputOption, 'generator', execaSync);
test('Can use duplexes with input option', testInputOption, 'duplex', execa);
test('Can use webTransforms with input option', testInputOption, 'webTransform', execa);

// eslint-disable-next-line max-params
const testInputFile = async (t, stdinOption, useInputFile, reversed, execaMethod) => {
	const filePath = tempfile();
	await writeFile(filePath, foobarString);
	const options = useInputFile
		? {inputFile: filePath, stdin: stdinOption}
		: {stdin: [{file: filePath}, stdinOption]};
	options.stdin = reversed ? options.stdin.reverse() : options.stdin;
	const {stdout} = await execaMethod('stdin-fd.js', ['0'], options);
	t.is(stdout, foobarUppercase);
	await rm(filePath);
};

test('Can use generators with a file as input', testInputFile, uppercaseGenerator(), false, false, execa);
test('Can use generators with a file as input, reversed', testInputFile, uppercaseGenerator(), false, true, execa);
test('Can use generators with inputFile option', testInputFile, uppercaseGenerator(), true, false, execa);
test('Can use generators with a file as input, sync', testInputFile, uppercaseGenerator(), false, false, execaSync);
test('Can use generators with a file as input, reversed, sync', testInputFile, uppercaseGenerator(), false, true, execaSync);
test('Can use generators with inputFile option, sync', testInputFile, uppercaseGenerator(), true, false, execaSync);
test('Can use duplexes with a file as input', testInputFile, uppercaseBufferDuplex(), false, false, execa);
test('Can use duplexes with a file as input, reversed', testInputFile, uppercaseBufferDuplex(), false, true, execa);
test('Can use duplexes with inputFile option', testInputFile, uppercaseBufferDuplex(), true, false, execa);
test('Can use webTransforms with a file as input', testInputFile, uppercaseBufferWebTransform(), false, false, execa);
test('Can use webTransforms with a file as input, reversed', testInputFile, uppercaseBufferWebTransform(), false, true, execa);
test('Can use webTransforms with inputFile option', testInputFile, uppercaseBufferWebTransform(), true, false, execa);

const testOutputFile = async (t, reversed, type, execaMethod) => {
	const filePath = tempfile();
	const stdoutOption = [generatorsMap[type].uppercaseBuffer(false, true), {file: filePath}];
	const reversedStdoutOption = reversed ? stdoutOption.reverse() : stdoutOption;
	const {stdout} = await execaMethod('noop-fd.js', ['1'], {stdout: reversedStdoutOption});
	t.is(stdout, foobarUppercase);
	t.is(await readFile(filePath, 'utf8'), foobarUppercase);
	await rm(filePath);
};

test('Can use generators with a file as output', testOutputFile, false, 'generator', execa);
test('Can use generators with a file as output, reversed', testOutputFile, true, 'generator', execa);
test('Can use generators with a file as output, sync', testOutputFile, false, 'generator', execaSync);
test('Can use generators with a file as output, reversed, sync', testOutputFile, true, 'generator', execaSync);
test('Can use duplexes with a file as output', testOutputFile, false, 'duplex', execa);
test('Can use duplexes with a file as output, reversed', testOutputFile, true, 'duplex', execa);
test('Can use webTransforms with a file as output', testOutputFile, false, 'webTransform', execa);
test('Can use webTransforms with a file as output, reversed', testOutputFile, true, 'webTransform', execa);

const testWritableDestination = async (t, type) => {
	const passThrough = new PassThrough();
	const [{stdout}, streamOutput] = await Promise.all([
		execa('noop-fd.js', ['1', foobarString], {stdout: [generatorsMap[type].uppercaseBuffer(false, true), passThrough]}),
		getStream(passThrough),
	]);
	t.is(stdout, foobarUppercase);
	t.is(streamOutput, foobarUppercase);
};

test('Can use generators to a Writable stream', testWritableDestination, 'generator');
test('Can use duplexes to a Writable stream', testWritableDestination, 'duplex');
test('Can use webTransforms to a Writable stream', testWritableDestination, 'webTransform');

const testReadableSource = async (t, type) => {
	const passThrough = new PassThrough();
	const subprocess = execa('stdin-fd.js', ['0'], {stdin: [passThrough, generatorsMap[type].uppercase()]});
	passThrough.end(foobarString);
	const {stdout} = await subprocess;
	t.is(stdout, foobarUppercase);
};

test('Can use generators from a Readable stream', testReadableSource, 'generator');
test('Can use duplexes from a Readable stream', testReadableSource, 'duplex');
test('Can use webTransforms from a Readable stream', testReadableSource, 'webTransform');

const testInherit = async (t, type) => {
	const {stdout} = await execa('nested-inherit.js', [type]);
	t.is(stdout, foobarUppercase);
};

test('Can use generators with "inherit"', testInherit, 'generator');
test('Can use duplexes with "inherit"', testInherit, 'duplex');
test('Can use webTransforms with "inherit"', testInherit, 'webTransform');

const testAppendInput = async (t, reversed, type, execaMethod) => {
	const stdin = [foobarUint8Array, generatorsMap[type].uppercase(), generatorsMap[type].append()];
	const reversedStdin = reversed ? stdin.reverse() : stdin;
	const {stdout} = await execaMethod('stdin-fd.js', ['0'], {stdin: reversedStdin});
	const reversedSuffix = reversed ? casedSuffix.toUpperCase() : casedSuffix;
	t.is(stdout, `${foobarUppercase}${reversedSuffix}`);
};

test('Can use multiple generators as input', testAppendInput, false, 'generator', execa);
test('Can use multiple generators as input, reversed', testAppendInput, true, 'generator', execa);
test('Can use multiple generators as input, sync', testAppendInput, false, 'generator', execaSync);
test('Can use multiple generators as input, reversed, sync', testAppendInput, true, 'generator', execaSync);
test('Can use multiple duplexes as input', testAppendInput, false, 'duplex', execa);
test('Can use multiple duplexes as input, reversed', testAppendInput, true, 'duplex', execa);
test('Can use multiple webTransforms as input', testAppendInput, false, 'webTransform', execa);
test('Can use multiple webTransforms as input, reversed', testAppendInput, true, 'webTransform', execa);

const testAppendOutput = async (t, reversed, type, execaMethod) => {
	const stdoutOption = [generatorsMap[type].uppercase(), generatorsMap[type].append()];
	const reversedStdoutOption = reversed ? stdoutOption.reverse() : stdoutOption;
	const {stdout} = await execaMethod('noop-fd.js', ['1', foobarString], {stdout: reversedStdoutOption});
	const reversedSuffix = reversed ? casedSuffix.toUpperCase() : casedSuffix;
	t.is(stdout, `${foobarUppercase}${reversedSuffix}`);
};

test('Can use multiple generators as output', testAppendOutput, false, 'generator', execa);
test('Can use multiple generators as output, reversed', testAppendOutput, true, 'generator', execa);
test('Can use multiple generators as output, sync', testAppendOutput, false, 'generator', execaSync);
test('Can use multiple generators as output, reversed, sync', testAppendOutput, true, 'generator', execaSync);
test('Can use multiple duplexes as output', testAppendOutput, false, 'duplex', execa);
test('Can use multiple duplexes as output, reversed', testAppendOutput, true, 'duplex', execa);
test('Can use multiple webTransforms as output', testAppendOutput, false, 'webTransform', execa);
test('Can use multiple webTransforms as output, reversed', testAppendOutput, true, 'webTransform', execa);

// eslint-disable-next-line max-params
const testTwoGenerators = async (t, producesTwo, execaMethod, firstGenerator, secondGenerator = firstGenerator) => {
	const {stdout} = await execaMethod('noop-fd.js', ['1', foobarString], {stdout: [firstGenerator, secondGenerator]});
	const expectedSuffix = producesTwo ? `${casedSuffix}${casedSuffix}` : casedSuffix;
	t.is(stdout, `${foobarString}${expectedSuffix}`);
};

test('Can use multiple identical generators', testTwoGenerators, true, execa, appendGenerator().transform);
test('Can use multiple identical generators, options object', testTwoGenerators, true, execa, appendGenerator());
test('Can use multiple identical generators, async', testTwoGenerators, true, execa, appendAsyncGenerator().transform);
test('Can use multiple identical generators, options object, async', testTwoGenerators, true, execa, appendAsyncGenerator());
test('Can use multiple identical generators, sync', testTwoGenerators, true, execaSync, appendGenerator().transform);
test('Can use multiple identical generators, options object, sync', testTwoGenerators, true, execaSync, appendGenerator());
test('Ignore duplicate identical duplexes', testTwoGenerators, false, execa, appendDuplex());
test('Ignore duplicate identical webTransforms', testTwoGenerators, false, execa, appendWebTransform());
test('Can use multiple generators with duplexes', testTwoGenerators, true, execa, appendGenerator(false, false, true), appendDuplex());
test('Can use multiple generators with webTransforms', testTwoGenerators, true, execa, appendGenerator(false, false, true), appendWebTransform());
test('Can use multiple duplexes with webTransforms', testTwoGenerators, true, execa, appendDuplex(), appendWebTransform());

const testGeneratorSyntax = async (t, type, usePlainObject, execaMethod) => {
	const transform = generatorsMap[type].uppercase();
	const {stdout} = await execaMethod('noop-fd.js', ['1', foobarString], {stdout: usePlainObject ? transform : transform.transform});
	t.is(stdout, foobarUppercase);
};

test('Can pass generators with an options plain object', testGeneratorSyntax, 'generator', false, execa);
test('Can pass generators without an options plain object', testGeneratorSyntax, 'generator', true, execa);
test('Can pass generators with an options plain object, sync', testGeneratorSyntax, 'generator', false, execaSync);
test('Can pass generators without an options plain object, sync', testGeneratorSyntax, 'generator', true, execaSync);
test('Can pass webTransforms with an options plain object', testGeneratorSyntax, 'webTransform', true, execa);
test('Can pass webTransforms without an options plain object', testGeneratorSyntax, 'webTransform', false, execa);
