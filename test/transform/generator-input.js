import {Buffer} from 'node:buffer';
import test from 'ava';
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
import {generatorsMap} from '../helpers/map.js';

setFixtureDir();

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
