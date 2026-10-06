import assert from 'node:assert/strict';
import {promisify} from 'node:util';
import {gunzip} from 'node:zlib';
import test from 'node:test';
import {assertRejects} from '../helpers/assert.js';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {
	foobarString,
	foobarUtf16Uint8Array,
	foobarUint8Array,
	foobarObject,
	foobarObjectString,
} from '../helpers/input.js';
import {outputObjectGenerator} from '../helpers/generator.js';
import {serializeWebTransform, outputObjectWebTransform, noopWebTransform} from '../helpers/web-transform.js';

setFixtureDirectory();

test('Can use CompressionStream()', async () => {
	const {stdout} = await execa('noop-fd.js', ['1', foobarString], {stdout: new CompressionStream('gzip'), encoding: 'buffer'});
	const decompressedStdout = await promisify(gunzip)(stdout);
	assert.equal(decompressedStdout.toString(), foobarString);
});

test('Can use TextDecoderStream()', async () => {
	const {stdout} = await execa('stdin.js', {
		input: foobarUtf16Uint8Array,
		stdout: new TextDecoderStream('utf-16le'),
		encoding: 'buffer',
	});
	assert.deepEqual(stdout, foobarUint8Array);
});

// A `TransformStream` has no `objectMode` of its own, so the `objectMode` option applies to its output, while its input uses the previous transform's
const testWebTransformObjectModeFalse = async (getTransforms, expectedOutput) => {
	const {stdout} = await execa('noop.js', [foobarString], {stdout: getTransforms()});
	assert.deepEqual(stdout, expectedOutput);
};

test('TransformStream with "objectMode: false" can follow an objectMode transform', () => testWebTransformObjectModeFalse(() => [outputObjectGenerator(), serializeWebTransform(false)], foobarObjectString));
test('TransformStream with "objectMode: false" can follow an objectMode TransformStream', () => testWebTransformObjectModeFalse(() => [outputObjectWebTransform(), serializeWebTransform(false)], foobarObjectString));
test('TransformStream with "objectMode: false" splits lines after an objectMode transform', () => testWebTransformObjectModeFalse(() => [outputObjectGenerator(), {
	transform: new TransformStream({
		transform(object, controller) {
			controller.enqueue(`${JSON.stringify(object)}\n${JSON.stringify(object)}\n`);
		},
	}),
	objectMode: false,
}], `${foobarObjectString}\n${foobarObjectString}`));
test('TransformStream with "objectMode: true" can follow a TransformStream with "objectMode: false"', () => testWebTransformObjectModeFalse(() => [noopWebTransform(false), outputObjectWebTransform()], [foobarObject]));

test('Destroying subprocess.stdin fails the subprocess when it is a TransformStream', async () => {
	const subprocess = execa('stdin.js', {stdin: new TransformStream()});
	subprocess.stdin.destroy();
	const {cause} = await assertRejects(subprocess);
	assert.equal(cause.code, 'ABORT_ERR');
});
