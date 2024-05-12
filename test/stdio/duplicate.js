import {once} from 'node:events';
import {createReadStream, createWriteStream} from 'node:fs';
import {readFile, writeFile, rm} from 'node:fs/promises';
import {Readable, Writable} from 'node:stream';
import {pathToFileURL} from 'node:url';
import test from 'ava';
import tempfile from 'tempfile';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {
	uppercaseGenerator,
	appendGenerator,
	appendAsyncGenerator,
	casedSuffix,
} from '../helpers/generator.js';
import {appendDuplex} from '../helpers/duplex.js';
import {appendWebTransform} from '../helpers/web-transform.js';
import {foobarString, foobarUint8Array, foobarUppercase} from '../helpers/input.js';
import {fullStdio} from '../helpers/stdio.js';
import {nestedExecaAsync, nestedExecaSync} from '../helpers/nested.js';
import {getAbsolutePath} from '../helpers/file-path.js';
import {noopDuplex} from '../helpers/stream.js';

setFixtureDirectory();

const getNativeStream = stream => stream;
const getNonNativeStream = stream => ['pipe', stream];
const getWebWritableStream = stream => Writable.toWeb(stream);

const getDummyDuplex = () => ({transform: noopDuplex()});
const getDummyWebTransformStream = () => new TransformStream();

const getDummyPath = async () => {
	const filePath = tempfile();
	await writeFile(filePath, '');
	return filePath;
};

const getDummyFilePath = async () => ({file: await getDummyPath()});
const getDummyFileURL = async () => pathToFileURL((await getDummyPath()));
const duplexName = 'a Duplex stream';
const webTransformName = 'a web TransformStream';
const filePathName = 'a file path string';
const fileURLName = 'a file URL';

const getDifferentInputs = stdioOption => ({stdio: [stdioOption, 'pipe', 'pipe', stdioOption]});
const getDifferentOutputs = stdioOption => ({stdout: stdioOption, stderr: stdioOption});
const getDifferentInputsOutputs = stdioOption => ({stdin: stdioOption, stdout: stdioOption});
const differentInputsName = '`stdin` and `stdio[3]`';
const differentOutputsName = '`stdout` and `stderr`';
const differentInputsOutputsName = '`stdin` and `stdout`';

test('Can use multiple "pipe" on same input file descriptor', async t => {
	const subprocess = execa('stdin.js', {stdin: ['pipe', 'pipe']});
	subprocess.stdin.end(foobarString);
	const {stdout} = await subprocess;
	t.is(stdout, foobarString);
});

const testTwoPipeOutput = async (t, execaMethod) => {
	const {stdout} = await execaMethod('noop.js', [foobarString], {stdout: ['pipe', 'pipe']});
	t.is(stdout, foobarString);
};

test('Can use multiple "pipe" on same output file descriptor', testTwoPipeOutput, execa);
test('Can use multiple "pipe" on same output file descriptor, sync', testTwoPipeOutput, execaSync);

test('Can repeat same stream on same input file descriptor', async t => {
	const stream = Readable.from([foobarString]);
	const {stdout} = await execa('stdin.js', {stdin: ['pipe', stream, stream]});
	t.is(stdout, foobarString);
});

test('Can repeat same stream on same output file descriptor', async t => {
	let stdout = '';
	const stream = new Writable({
		write(chunk, encoding, done) {
			stdout += chunk.toString();
			done();
		},
	});
	await execa('noop-fd.js', ['1', foobarString], {stdout: ['pipe', stream, stream]});
	t.is(stdout, foobarString);
});

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

const testMultiplePipeOutput = async (t, execaMethod) => {
	const {stdout, stderr} = await execaMethod('noop-both.js', [foobarString], fullStdio);
	t.is(stdout, foobarString);
	t.is(stderr, foobarString);
};

test('Can use multiple "pipe" on different output file descriptors', testMultiplePipeOutput, execa);
test('Can use multiple "pipe" on different output file descriptors, sync', testMultiplePipeOutput, execaSync);

test('Can re-use same generator on different input file descriptors', async t => {
	const {stdout} = await execa('stdin-fd-both.js', ['3'], getDifferentInputs([foobarUint8Array, uppercaseGenerator(false, false, true)]));
	t.is(stdout, `${foobarUppercase}${foobarUppercase}`);
});

test('Can re-use same generator on different output file descriptors', async t => {
	const {stdout, stderr} = await execa('noop-both.js', [foobarString], getDifferentOutputs(uppercaseGenerator(false, false, true)));
	t.is(stdout, foobarUppercase);
	t.is(stderr, foobarUppercase);
});

test('Can re-use same non-native Readable stream on different input file descriptors', async t => {
	const filePath = tempfile();
	await writeFile(filePath, foobarString);
	const stream = createReadStream(filePath);
	await once(stream, 'open');
	const {stdout} = await execa('stdin-fd-both.js', ['3'], getDifferentInputs([new Uint8Array(0), stream]));
	t.is(stdout, `${foobarString}${foobarString}`);
	await rm(filePath);
});

const testMultipleStreamOutput = async (t, getStreamOption) => {
	const filePath = tempfile();
	const stream = createWriteStream(filePath);
	await once(stream, 'open');
	await execa('noop-both.js', [foobarString], getDifferentOutputs(getStreamOption(stream)));
	t.is(await readFile(filePath, 'utf8'), `${foobarString}\n${foobarString}\n`);
	await rm(filePath);
};

test('Can re-use same native Writable stream on different output file descriptors', testMultipleStreamOutput, getNativeStream);
test('Can re-use same non-native Writable stream on different output file descriptors', testMultipleStreamOutput, getNonNativeStream);
test('Can re-use same web Writable stream on different output file descriptors', testMultipleStreamOutput, getWebWritableStream);

const testMultipleInheritOutput = async (t, execaMethod) => {
	const {stdout} = await execaMethod('noop-both.js', [foobarString], getDifferentOutputs(1)).parent;
	t.is(stdout, `${foobarString}\n${foobarString}`);
};

test('Can re-use same parent file descriptor on different output file descriptors', testMultipleInheritOutput, nestedExecaAsync);
test('Can re-use same parent file descriptor on different output file descriptors, sync', testMultipleInheritOutput, nestedExecaSync);

const testMultipleFileInput = async (t, mapFile) => {
	const filePath = tempfile();
	await writeFile(filePath, foobarString);
	const {stdout} = await execa('stdin-fd-both.js', ['3'], getDifferentInputs([new Uint8Array(0), mapFile(filePath)]));
	t.is(stdout, `${foobarString}${foobarString}`);
	await rm(filePath);
};

test('Can re-use same file path on different input file descriptors', testMultipleFileInput, getAbsolutePath);
test('Can re-use same file URL on different input file descriptors', testMultipleFileInput, pathToFileURL);

const testMultipleFileOutput = async (t, mapFile, execaMethod) => {
	const filePath = tempfile();
	await execaMethod('noop-both.js', [foobarString], getDifferentOutputs(mapFile(filePath)));
	t.is(await readFile(filePath, 'utf8'), `${foobarString}\n${foobarString}\n`);
	await rm(filePath);
};

test('Can re-use same file path on different output file descriptors', testMultipleFileOutput, getAbsolutePath, execa);
test('Can re-use same file path on different output file descriptors, sync', testMultipleFileOutput, getAbsolutePath, execaSync);
test('Can re-use same file URL on different output file descriptors', testMultipleFileOutput, pathToFileURL, execa);
test('Can re-use same file URL on different output file descriptors, sync', testMultipleFileOutput, pathToFileURL, execaSync);

const testMultipleFileInputOutput = async (t, mapFile, execaMethod) => {
	const inputFilePath = tempfile();
	const outputFilePath = tempfile();
	await writeFile(inputFilePath, foobarString);
	await execaMethod('stdin.js', {stdin: mapFile(inputFilePath), stdout: mapFile(outputFilePath)});
	t.is(await readFile(outputFilePath, 'utf8'), foobarString);
	await Promise.all([rm(inputFilePath), rm(outputFilePath)]);
};

test('Can use different file paths on different input/output file descriptors', testMultipleFileInputOutput, getAbsolutePath, execa);
test('Can use different file paths on different input/output file descriptors, sync', testMultipleFileInputOutput, getAbsolutePath, execaSync);
test('Can use different file URL on different input/output file descriptors', testMultipleFileInputOutput, pathToFileURL, execa);
test('Can use different file URL on different input/output file descriptors, sync', testMultipleFileInputOutput, pathToFileURL, execaSync);

// eslint-disable-next-line max-params
const testMultipleInvalid = async (t, getDummyStream, typeName, getStdio, fdName, execaMethod) => {
	const stdioOption = await getDummyStream();
	t.throws(() => {
		execaMethod('empty.js', getStdio(stdioOption));
	}, {message: `The ${fdName} options must not target ${typeName} that is the same.`});
	if (stdioOption.transform !== undefined) {
		t.true(stdioOption.transform.destroyed);
	}
};

test('Cannot use same Duplex on different input file descriptors', testMultipleInvalid, getDummyDuplex, duplexName, getDifferentInputs, differentInputsName, execa);
test('Cannot use same Duplex on different output file descriptors', testMultipleInvalid, getDummyDuplex, duplexName, getDifferentOutputs, differentOutputsName, execa);
test('Cannot use same Duplex on both input and output file descriptors', testMultipleInvalid, getDummyDuplex, duplexName, getDifferentInputsOutputs, differentInputsOutputsName, execa);
test('Cannot use same TransformStream on different input file descriptors', testMultipleInvalid, getDummyWebTransformStream, webTransformName, getDifferentInputs, differentInputsName, execa);
test('Cannot use same TransformStream on different output file descriptors', testMultipleInvalid, getDummyWebTransformStream, webTransformName, getDifferentOutputs, differentOutputsName, execa);
test('Cannot use same TransformStream on both input and output file descriptors', testMultipleInvalid, getDummyWebTransformStream, webTransformName, getDifferentInputsOutputs, differentInputsOutputsName, execa);
test('Cannot use same file path on both input and output file descriptors', testMultipleInvalid, getDummyFilePath, filePathName, getDifferentInputsOutputs, differentInputsOutputsName, execa);
test('Cannot use same file URL on both input and output file descriptors', testMultipleInvalid, getDummyFileURL, fileURLName, getDifferentInputsOutputs, differentInputsOutputsName, execa);
test('Cannot use same file path on both input and output file descriptors, sync', testMultipleInvalid, getDummyFilePath, filePathName, getDifferentInputsOutputs, differentInputsOutputsName, execaSync);
test('Cannot use same file URL on both input and output file descriptors, sync', testMultipleInvalid, getDummyFileURL, fileURLName, getDifferentInputsOutputs, differentInputsOutputsName, execaSync);
