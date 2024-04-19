import {readFile, writeFile, rm} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import test from 'ava';
import {pathExists} from 'path-exists';
import tempfile from 'tempfile';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {identity, getStdio} from '../helpers/stdio.js';
import {foobarString, foobarUppercase} from '../helpers/input.js';
import {
	outputObjectGenerator,
	uppercaseGenerator,
	serializeGenerator,
	throwingGenerator,
} from '../helpers/generator.js';
import {getAbsolutePath} from '../helpers/file-path.js';

setFixtureDirectory();

const nonFileUrl = new URL('https://example.com');

const testStdioNonFileUrl = (t, fdNumber, execaMethod) => {
	t.throws(() => {
		execaMethod('empty.js', getStdio(fdNumber, nonFileUrl));
	}, {message: /pathToFileURL/});
};

test('inputFile cannot be a non-file URL', testStdioNonFileUrl, 'inputFile', execa);
test('stdin cannot be a non-file URL', testStdioNonFileUrl, 0, execa);
test('stdout cannot be a non-file URL', testStdioNonFileUrl, 1, execa);
test('stderr cannot be a non-file URL', testStdioNonFileUrl, 2, execa);
test('stdio[*] cannot be a non-file URL', testStdioNonFileUrl, 3, execa);
test('inputFile cannot be a non-file URL - sync', testStdioNonFileUrl, 'inputFile', execaSync);
test('stdin cannot be a non-file URL - sync', testStdioNonFileUrl, 0, execaSync);
test('stdout cannot be a non-file URL - sync', testStdioNonFileUrl, 1, execaSync);
test('stderr cannot be a non-file URL - sync', testStdioNonFileUrl, 2, execaSync);
test('stdio[*] cannot be a non-file URL - sync', testStdioNonFileUrl, 3, execaSync);

const testInvalidInputFile = (t, execaMethod) => {
	t.throws(() => {
		execaMethod('empty.js', getStdio('inputFile', false));
	}, {message: /a file path string or a file URL/});
};

test('inputFile must be a file URL or string', testInvalidInputFile, execa);
test('inputFile must be a file URL or string - sync', testInvalidInputFile, execaSync);

const testFilePathObject = (t, fdNumber, execaMethod) => {
	t.throws(() => {
		execaMethod('empty.js', getStdio(fdNumber, foobarString));
	}, {message: /must be used/});
};

test('stdin must be an object when it is a file path string', testFilePathObject, 0, execa);
test('stdout must be an object when it is a file path string', testFilePathObject, 1, execa);
test('stderr must be an object when it is a file path string', testFilePathObject, 2, execa);
test('stdio[*] must be an object when it is a file path string', testFilePathObject, 3, execa);
test('stdin be an object when it is a file path string - sync', testFilePathObject, 0, execaSync);
test('stdout be an object when it is a file path string - sync', testFilePathObject, 1, execaSync);
test('stderr be an object when it is a file path string - sync', testFilePathObject, 2, execaSync);
test('stdio[*] must be an object when it is a file path string - sync', testFilePathObject, 3, execaSync);

const testFileError = async (t, fixtureName, mapFile, fdNumber) => {
	await t.throwsAsync(
		execa(fixtureName, [`${fdNumber}`], getStdio(fdNumber, mapFile('./unknown/file'))),
		{code: 'ENOENT'},
	);
};

test.serial('inputFile file URL errors should be handled', testFileError, 'stdin-fd.js', pathToFileURL, 'inputFile');
test.serial('stdin file URL errors should be handled', testFileError, 'stdin-fd.js', pathToFileURL, 0);
test.serial('stdout file URL errors should be handled', testFileError, 'noop-fd.js', pathToFileURL, 1);
test.serial('stderr file URL errors should be handled', testFileError, 'noop-fd.js', pathToFileURL, 2);
test.serial('stdio[*] file URL errors should be handled', testFileError, 'noop-fd.js', pathToFileURL, 3);
test.serial('inputFile file path errors should be handled', testFileError, 'stdin-fd.js', identity, 'inputFile');
test.serial('stdin file path errors should be handled', testFileError, 'stdin-fd.js', getAbsolutePath, 0);
test.serial('stdout file path errors should be handled', testFileError, 'noop-fd.js', getAbsolutePath, 1);
test.serial('stderr file path errors should be handled', testFileError, 'noop-fd.js', getAbsolutePath, 2);
test.serial('stdio[*] file path errors should be handled', testFileError, 'noop-fd.js', getAbsolutePath, 3);

const testFileErrorSync = (t, mapFile, fdNumber) => {
	t.throws(() => {
		execaSync('empty.js', getStdio(fdNumber, mapFile('./unknown/file')));
	}, {code: 'ENOENT'});
};

test('inputFile file URL errors should be handled - sync', testFileErrorSync, pathToFileURL, 'inputFile');
test('stdin file URL errors should be handled - sync', testFileErrorSync, pathToFileURL, 0);
test('stdout file URL errors should be handled - sync', testFileErrorSync, pathToFileURL, 1);
test('stderr file URL errors should be handled - sync', testFileErrorSync, pathToFileURL, 2);
test('stdio[*] file URL errors should be handled - sync', testFileErrorSync, pathToFileURL, 3);
test('inputFile file path errors should be handled - sync', testFileErrorSync, identity, 'inputFile');
test('stdin file path errors should be handled - sync', testFileErrorSync, getAbsolutePath, 0);
test('stdout file path errors should be handled - sync', testFileErrorSync, getAbsolutePath, 1);
test('stderr file path errors should be handled - sync', testFileErrorSync, getAbsolutePath, 2);
test('stdio[*] file path errors should be handled - sync', testFileErrorSync, getAbsolutePath, 3);

const testInputFileObject = async (t, fdNumber, mapFile, execaMethod) => {
	const filePath = tempfile();
	await writeFile(filePath, foobarString);
	t.throws(() => {
		execaMethod('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, [
			new Uint8Array(),
			mapFile(filePath),
			serializeGenerator(true),
		]));
	}, {message: /cannot use both files and transforms in objectMode/});
	await rm(filePath);
};

test('stdin cannot use objectMode together with input file paths', testInputFileObject, 0, getAbsolutePath, execa);
test('stdin cannot use objectMode together with input file URLs', testInputFileObject, 0, pathToFileURL, execa);
test('stdio[*] cannot use objectMode together with input file paths', testInputFileObject, 3, getAbsolutePath, execa);
test('stdio[*] cannot use objectMode together with input file URLs', testInputFileObject, 3, pathToFileURL, execa);
test('stdin cannot use objectMode together with input file paths, sync', testInputFileObject, 0, getAbsolutePath, execaSync);
test('stdin cannot use objectMode together with input file URLs, sync', testInputFileObject, 0, pathToFileURL, execaSync);

const testOutputFileObject = async (t, fdNumber, mapFile, execaMethod) => {
	const filePath = tempfile();
	t.throws(() => {
		execaMethod('noop-fd.js', [`${fdNumber}`, foobarString], getStdio(fdNumber, [
			outputObjectGenerator(),
			mapFile(filePath),
		]));
	}, {message: /cannot use both files and transforms in objectMode/});
	t.false(await pathExists(filePath));
};

test('stdout cannot use objectMode together with output file paths', testOutputFileObject, 1, getAbsolutePath, execa);
test('stdout cannot use objectMode together with output file URLs', testOutputFileObject, 1, pathToFileURL, execa);
test('stderr cannot use objectMode together with output file paths', testOutputFileObject, 2, getAbsolutePath, execa);
test('stderr cannot use objectMode together with output file URLs', testOutputFileObject, 2, pathToFileURL, execa);
test('stdio[*] cannot use objectMode together with output file paths', testOutputFileObject, 3, getAbsolutePath, execa);
test('stdio[*] cannot use objectMode together with output file URLs', testOutputFileObject, 3, pathToFileURL, execa);
test('stdout cannot use objectMode together with output file paths, sync', testOutputFileObject, 1, getAbsolutePath, execaSync);
test('stdout cannot use objectMode together with output file URLs, sync', testOutputFileObject, 1, pathToFileURL, execaSync);
test('stderr cannot use objectMode together with output file paths, sync', testOutputFileObject, 2, getAbsolutePath, execaSync);
test('stderr cannot use objectMode together with output file URLs, sync', testOutputFileObject, 2, pathToFileURL, execaSync);
test('stdio[*] cannot use objectMode together with output file paths, sync', testOutputFileObject, 3, getAbsolutePath, execaSync);
test('stdio[*] cannot use objectMode together with output file URLs, sync', testOutputFileObject, 3, pathToFileURL, execaSync);

test('Generator error stops writing to output file', async t => {
	const filePath = tempfile();
	const cause = new Error(foobarString);
	const error = await t.throwsAsync(execa('noop.js', {
		stdout: [throwingGenerator(cause)(), getAbsolutePath(filePath)],
	}));
	t.is(error.cause, cause);
	t.is(await readFile(filePath, 'utf8'), '');
});

test('Generator error does not create output file, sync', async t => {
	const filePath = tempfile();
	const cause = new Error(foobarString);
	const error = t.throws(() => {
		execaSync('noop.js', {
			stdout: [throwingGenerator(cause)(), getAbsolutePath(filePath)],
		});
	});
	t.is(error.cause, cause);
	t.false(await pathExists(filePath));
});

test('Output file error still returns transformed output, sync', async t => {
	const filePath = tempfile();
	const {stdout} = t.throws(() => {
		execaSync('noop-fd.js', ['1', foobarString], {
			stdout: [uppercaseGenerator(), getAbsolutePath('./unknown/file')],
		});
	}, {code: 'ENOENT'});
	t.false(await pathExists(filePath));
	t.is(stdout, foobarUppercase);
});
