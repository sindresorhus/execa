import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createReadStream, createWriteStream} from 'node:fs';
import {
	mkdir,
	readFile,
	writeFile,
	rm,
} from 'node:fs/promises';
import path from 'node:path';
import {Readable, Writable} from 'node:stream';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import tempfile from 'tempfile';
import {assertThrows} from '../helpers/assert.js';
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
import {nestedSubprocess} from '../helpers/nested.js';
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

test('Can use multiple "pipe" on same input file descriptor', async () => {
	const subprocess = execa('stdin.js', {stdin: ['pipe', 'pipe']});
	subprocess.stdin.end(foobarString);
	const {stdout} = await subprocess;
	assert.equal(stdout, foobarString);
});

const testTwoPipeOutput = async execaMethod => {
	const {stdout} = await execaMethod('noop.js', [foobarString], {stdout: ['pipe', 'pipe']});
	assert.equal(stdout, foobarString);
};

test('Can use multiple "pipe" on same output file descriptor', () => testTwoPipeOutput(execa));
test('Can use multiple "pipe" on same output file descriptor, sync', () => testTwoPipeOutput(execaSync));

test('Can repeat same stream on same input file descriptor', async () => {
	const stream = Readable.from([foobarString]);
	const {stdout} = await execa('stdin.js', {stdin: ['pipe', stream, stream]});
	assert.equal(stdout, foobarString);
});

test('Can repeat same stream on same output file descriptor', async () => {
	let stdout = '';
	const stream = new Writable({
		write(chunk, encoding, done) {
			stdout += chunk.toString();
			done();
		},
	});
	await execa('noop-fd.js', ['1', foobarString], {stdout: ['pipe', stream, stream]});
	assert.equal(stdout, foobarString);
});

const testTwoGenerators = async (producesTwo, execaMethod, firstGenerator, secondGenerator = firstGenerator) => {
	const {stdout} = await execaMethod('noop-fd.js', ['1', foobarString], {stdout: [firstGenerator, secondGenerator]});
	const expectedSuffix = producesTwo ? `${casedSuffix}${casedSuffix}` : casedSuffix;
	assert.equal(stdout, `${foobarString}${expectedSuffix}`);
};

test('Can use multiple identical generators', () => testTwoGenerators(true, execa, appendGenerator().transform));
test('Can use multiple identical generators, options object', () => testTwoGenerators(true, execa, appendGenerator()));
test('Can use multiple identical generators, async', () => testTwoGenerators(true, execa, appendAsyncGenerator().transform));
test('Can use multiple identical generators, options object, async', () => testTwoGenerators(true, execa, appendAsyncGenerator()));
test('Can use multiple identical generators, sync', () => testTwoGenerators(true, execaSync, appendGenerator().transform));
test('Can use multiple identical generators, options object, sync', () => testTwoGenerators(true, execaSync, appendGenerator()));
test('Ignore duplicate identical duplexes', () => testTwoGenerators(false, execa, appendDuplex()));
test('Ignore duplicate identical webTransforms', () => testTwoGenerators(false, execa, appendWebTransform()));
test('Can use multiple generators with duplexes', () => testTwoGenerators(true, execa, appendGenerator(false, false, true), appendDuplex()));
test('Can use multiple generators with webTransforms', () => testTwoGenerators(true, execa, appendGenerator(false, false, true), appendWebTransform()));
test('Can use multiple duplexes with webTransforms', () => testTwoGenerators(true, execa, appendDuplex(), appendWebTransform()));

const testMultiplePipeOutput = async execaMethod => {
	const {stdout, stderr} = await execaMethod('noop-both.js', [foobarString], fullStdio);
	assert.equal(stdout, foobarString);
	assert.equal(stderr, foobarString);
};

test('Can use multiple "pipe" on different output file descriptors', () => testMultiplePipeOutput(execa));
test('Can use multiple "pipe" on different output file descriptors, sync', () => testMultiplePipeOutput(execaSync));

test('Can re-use same generator on different input file descriptors', async () => {
	const {stdout} = await execa('stdin-fd-both.js', ['3'], getDifferentInputs([foobarUint8Array, uppercaseGenerator(false, false, true)]));
	assert.equal(stdout, `${foobarUppercase}${foobarUppercase}`);
});

test('Can re-use same generator on different output file descriptors', async () => {
	const {stdout, stderr} = await execa('noop-both.js', [foobarString], getDifferentOutputs(uppercaseGenerator(false, false, true)));
	assert.equal(stdout, foobarUppercase);
	assert.equal(stderr, foobarUppercase);
});

test('Can re-use same non-native Readable stream on different input file descriptors', async () => {
	const filePath = tempfile();
	await writeFile(filePath, foobarString);
	const stream = createReadStream(filePath);
	await once(stream, 'open');
	const {stdout} = await execa('stdin-fd-both.js', ['3'], getDifferentInputs([new Uint8Array(0), stream]));
	assert.equal(stdout, `${foobarString}${foobarString}`);
	await rm(filePath);
});

const testMultipleStreamOutput = async getStreamOption => {
	const filePath = tempfile();
	const stream = createWriteStream(filePath);
	await once(stream, 'open');
	await execa('noop-both.js', [foobarString], getDifferentOutputs(getStreamOption(stream)));
	assert.equal(await readFile(filePath, 'utf8'), `${foobarString}\n${foobarString}\n`);
	await rm(filePath);
};

test('Can re-use same native Writable stream on different output file descriptors', () => testMultipleStreamOutput(getNativeStream));
test('Can re-use same non-native Writable stream on different output file descriptors', () => testMultipleStreamOutput(getNonNativeStream));
test('Can re-use same web Writable stream on different output file descriptors', () => testMultipleStreamOutput(getWebWritableStream));

const testMultipleInheritOutput = async isSync => {
	const {stdout} = await nestedSubprocess('noop-both.js', [foobarString], {...getDifferentOutputs(1), isSync});
	assert.equal(stdout, `${foobarString}\n${foobarString}`);
};

test('Can re-use same parent file descriptor on different output file descriptors', () => testMultipleInheritOutput(false));
test('Can re-use same parent file descriptor on different output file descriptors, sync', () => testMultipleInheritOutput(true));

const testMultipleFileInput = async mapFile => {
	const filePath = tempfile();
	await writeFile(filePath, foobarString);
	const {stdout} = await execa('stdin-fd-both.js', ['3'], getDifferentInputs([new Uint8Array(0), mapFile(filePath)]));
	assert.equal(stdout, `${foobarString}${foobarString}`);
	await rm(filePath);
};

test('Can re-use same file path on different input file descriptors', () => testMultipleFileInput(getAbsolutePath));
test('Can re-use same file URL on different input file descriptors', () => testMultipleFileInput(pathToFileURL));

const testMultipleFileOutput = async (mapFile, execaMethod) => {
	const filePath = tempfile();
	await execaMethod('noop-both.js', [foobarString], getDifferentOutputs(mapFile(filePath)));
	assert.equal(await readFile(filePath, 'utf8'), `${foobarString}\n${foobarString}\n`);
	await rm(filePath);
};

test('Can re-use same file path on different output file descriptors', () => testMultipleFileOutput(getAbsolutePath, execa));
test('Can re-use same file path on different output file descriptors, sync', () => testMultipleFileOutput(getAbsolutePath, execaSync));
test('Can re-use same file URL on different output file descriptors', () => testMultipleFileOutput(pathToFileURL, execa));
test('Can re-use same file URL on different output file descriptors, sync', () => testMultipleFileOutput(pathToFileURL, execaSync));

// When file descriptors target the same file with different `append` values, the first one decides
const testDifferentAppend = async (execaMethod, stdoutAppend, stderrAppend, expectedPrefix) => {
	const filePath = tempfile();
	await writeFile(filePath, 'base\n');
	await execaMethod('noop-both.js', [foobarString], {
		stdout: {file: filePath, append: stdoutAppend},
		stderr: {file: filePath, append: stderrAppend},
	});
	assert.equal(await readFile(filePath, 'utf8'), `${expectedPrefix}${foobarString}\n${foobarString}\n`);
	await rm(filePath);
};

test('The first file descriptor decides `append` on the same output file path', () => testDifferentAppend(execa, undefined, true, ''));
test('The first file descriptor decides `append` on the same output file path, reversed', () => testDifferentAppend(execa, true, undefined, 'base\n'));
test('The first file descriptor decides `append` on the same output file path, sync', () => testDifferentAppend(execaSync, undefined, true, ''));
test('The first file descriptor decides `append` on the same output file path, reversed, sync', () => testDifferentAppend(execaSync, true, undefined, 'base\n'));

// Two items of a single file descriptor are written once, and the first one decides too
const sameFdName = '`stdout` and `stdout`';

const testDifferentAppendSameFd = async (execaMethod, appendOne, appendTwo, expectedPrefix) => {
	const filePath = tempfile();
	await writeFile(filePath, 'base\n');
	await execaMethod('noop.js', [foobarString], {stdout: [{file: filePath, append: appendOne}, {file: filePath, append: appendTwo}]});
	assert.equal(await readFile(filePath, 'utf8'), `${expectedPrefix}${foobarString}\n`);
	await rm(filePath);
};

test('The first item decides `append` on the same output file path in the same file descriptor', () => testDifferentAppendSameFd(execa, undefined, true, ''));
test('The first item decides `append` on the same output file path in the same file descriptor, reversed', () => testDifferentAppendSameFd(execa, true, undefined, 'base\n'));
test('The first item decides `append` on the same output file path in the same file descriptor, sync', () => testDifferentAppendSameFd(execaSync, undefined, true, ''));
test('The first item decides `append` on the same output file path in the same file descriptor, reversed, sync', () => testDifferentAppendSameFd(execaSync, true, undefined, 'base\n'));

const testSameAppend = async execaMethod => {
	const filePath = tempfile();
	await writeFile(filePath, 'base\n');
	await execaMethod('noop-both.js', [foobarString], {stdout: {file: filePath, append: true}, stderr: {file: filePath, append: true}});
	assert.equal(await readFile(filePath, 'utf8'), `base\n${foobarString}\n${foobarString}\n`);
	await rm(filePath);
};

test('Can use the same `append: true` value on the same output file path', () => testSameAppend(execa));
test('Can use the same `append: true` value on the same output file path, sync', () => testSameAppend(execaSync));

const testFalsyAppend = async execaMethod => {
	const filePath = tempfile();
	await execaMethod('noop-both.js', [foobarString], {stdout: {file: filePath}, stderr: {file: filePath, append: false}});
	assert.equal(await readFile(filePath, 'utf8'), `${foobarString}\n${foobarString}\n`);
	await rm(filePath);
};

test('Falsy `append` values are the same on the same output file path', () => testFalsyAppend(execa));
test('Falsy `append` values are the same on the same output file path, sync', () => testFalsyAppend(execaSync));

const testMultipleFileInputOutput = async (mapFile, execaMethod) => {
	const inputFilePath = tempfile();
	const outputFilePath = tempfile();
	await writeFile(inputFilePath, foobarString);
	await execaMethod('stdin.js', {stdin: mapFile(inputFilePath), stdout: mapFile(outputFilePath)});
	assert.equal(await readFile(outputFilePath, 'utf8'), foobarString);
	await Promise.all([rm(inputFilePath), rm(outputFilePath)]);
};

test('Can use different file paths on different input/output file descriptors', () => testMultipleFileInputOutput(getAbsolutePath, execa));
test('Can use different file paths on different input/output file descriptors, sync', () => testMultipleFileInputOutput(getAbsolutePath, execaSync));
test('Can use different file URL on different input/output file descriptors', () => testMultipleFileInputOutput(pathToFileURL, execa));
test('Can use different file URL on different input/output file descriptors, sync', () => testMultipleFileInputOutput(pathToFileURL, execaSync));

// eslint-disable-next-line max-params
const testMultipleInvalid = async (getDummyStream, typeName, getStdio, fdName, execaMethod) => {
	const stdioOption = await getDummyStream();
	assertThrows(() => {
		execaMethod('empty.js', getStdio(stdioOption));
	}, {message: `The ${fdName} options must not target ${typeName} that is the same.`});
	if (stdioOption.transform !== undefined) {
		assert.equal(stdioOption.transform.destroyed, true);
	}
};

test('Cannot use same Duplex on different input file descriptors', () => testMultipleInvalid(getDummyDuplex, duplexName, getDifferentInputs, differentInputsName, execa));
test('Cannot use same Duplex on different output file descriptors', () => testMultipleInvalid(getDummyDuplex, duplexName, getDifferentOutputs, differentOutputsName, execa));
test('Cannot use same Duplex on both input and output file descriptors', () => testMultipleInvalid(getDummyDuplex, duplexName, getDifferentInputsOutputs, differentInputsOutputsName, execa));
test('Cannot use same TransformStream on different input file descriptors', () => testMultipleInvalid(getDummyWebTransformStream, webTransformName, getDifferentInputs, differentInputsName, execa));
test('Cannot use same TransformStream on different output file descriptors', () => testMultipleInvalid(getDummyWebTransformStream, webTransformName, getDifferentOutputs, differentOutputsName, execa));
test('Cannot use same TransformStream on both input and output file descriptors', () => testMultipleInvalid(getDummyWebTransformStream, webTransformName, getDifferentInputsOutputs, differentInputsOutputsName, execa));
test('Cannot use same file path on both input and output file descriptors', () => testMultipleInvalid(getDummyFilePath, filePathName, getDifferentInputsOutputs, differentInputsOutputsName, execa));
test('Cannot use same file URL on both input and output file descriptors', () => testMultipleInvalid(getDummyFileURL, fileURLName, getDifferentInputsOutputs, differentInputsOutputsName, execa));
test('Cannot use same file path on both input and output file descriptors, sync', () => testMultipleInvalid(getDummyFilePath, filePathName, getDifferentInputsOutputs, differentInputsOutputsName, execaSync));
test('Cannot use same file URL on both input and output file descriptors, sync', () => testMultipleInvalid(getDummyFileURL, fileURLName, getDifferentInputsOutputs, differentInputsOutputsName, execaSync));

// Piping a Duplex or a web TransformStream into itself would feed it its own output forever.
// Each item uses a distinct wrapper object, around the same stream, so that `filterDuplicates()` does not merge them.
const testSameStreamSameFd = (getStream, typeName) => {
	const stream = getStream();
	assertThrows(() => {
		execa('empty.js', {stdout: [{transform: stream}, {transform: stream}]});
	}, {message: `The ${sameFdName} options must not target ${typeName} that is the same.`});
};

test('Cannot use same Duplex twice on the same output file descriptor', () => testSameStreamSameFd(noopDuplex, duplexName));
test('Cannot use same TransformStream twice on the same output file descriptor', () => testSameStreamSameFd(() => new TransformStream(), webTransformName));

// The streams created for the earlier items must be destroyed when a later one is rejected, otherwise they are leaked
test('Earlier streams are destroyed when a later item of the same file descriptor is rejected', () => {
	const stream = noopDuplex();
	assertThrows(() => {
		execa('empty.js', {stdout: [{transform: stream}, {transform: stream}]});
	}, {message: `The ${sameFdName} options must not target ${duplexName} that is the same.`});
	assert.equal(stream.destroyed, true);
});

// `{file: './output.txt'}` and a `file:` URL are two ways to target the same file
const testFilePathAndUrl = async execaMethod => {
	const filePath = tempfile();
	await execaMethod('noop-both.js', [foobarString], {stdout: {file: filePath}, stderr: pathToFileURL(filePath)});
	assert.equal(await readFile(filePath, 'utf8'), `${foobarString}\n${foobarString}\n`);
	await rm(filePath);
};

const testFileUrlAndPath = async execaMethod => {
	const filePath = tempfile();
	await execaMethod('noop-both.js', [foobarString], {stdout: pathToFileURL(filePath), stderr: {file: filePath}});
	assert.equal(await readFile(filePath, 'utf8'), `${foobarString}\n${foobarString}\n`);
	await rm(filePath);
};

test('Can use a file path and a file URL on different output file descriptors', () => testFilePathAndUrl(execa));
test('Can use a file URL and a file path on different output file descriptors', () => testFileUrlAndPath(execa));
test('Can use a file path and a file URL on different output file descriptors, sync', () => testFilePathAndUrl(execaSync));
test('Can use a file URL and a file path on different output file descriptors, sync', () => testFileUrlAndPath(execaSync));

// A single file descriptor can target the same file twice. Its output is a single stream, so it must only be written once.
const testSameFileSameFd = async execaMethod => {
	const filePath = tempfile();
	await execaMethod('noop.js', [foobarString], {stdout: [{file: filePath}, {file: filePath}]});
	assert.equal(await readFile(filePath, 'utf8'), `${foobarString}\n`);
	await rm(filePath);
};

test('Can use the same file path twice on the same output file descriptor', () => testSameFileSameFd(execa));
test('Can use the same file path twice on the same output file descriptor, sync', () => testSameFileSameFd(execaSync));

// A file path is resolved before being compared, so equivalent spellings of the same file are detected
const testFilePathNormalized = async execaMethod => {
	const directory = tempfile();
	await mkdir(directory);
	await mkdir(path.join(directory, 'subdirectory'));
	const filePath = path.join(directory, 'output.txt');
	// `path.join()` would normalize this away, but a raw string keeps the `..` segment
	const equivalentFilePath = `${directory}/subdirectory/../output.txt`;

	await execaMethod('noop-both.js', [foobarString], {stdout: {file: filePath}, stderr: {file: equivalentFilePath}});
	assert.equal(await readFile(filePath, 'utf8'), `${foobarString}\n${foobarString}\n`);
	await rm(directory, {recursive: true});
};

test('Can use equivalent file paths on different output file descriptors', () => testFilePathNormalized(execa));
test('Can use equivalent file paths on different output file descriptors, sync', () => testFilePathNormalized(execaSync));

const testFilePathAndUrlNormalized = async execaMethod => {
	const directory = tempfile();
	await mkdir(directory);
	await mkdir(path.join(directory, 'subdirectory'));
	const filePath = path.join(directory, 'output.txt');
	// `path.join()` would normalize this away, but a raw string keeps the `..` segment
	const equivalentFilePath = `${directory}/subdirectory/../output.txt`;

	await execaMethod('noop-both.js', [foobarString], {stdout: {file: filePath}, stderr: pathToFileURL(equivalentFilePath)});
	assert.equal(await readFile(filePath, 'utf8'), `${foobarString}\n${foobarString}\n`);
	await rm(directory, {recursive: true});
};

test('Can use an equivalent file URL on different output file descriptors', () => testFilePathAndUrlNormalized(execa));
test('Can use an equivalent file URL on a different output file descriptor, sync', () => testFilePathAndUrlNormalized(execaSync));
