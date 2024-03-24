import {readFile, writeFile, rm} from 'node:fs/promises';
import {relative, dirname, basename} from 'node:path';
import process from 'node:process';
import {pathToFileURL} from 'node:url';
import test from 'ava';
import tempfile from 'tempfile';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {identity, getStdio} from '../helpers/stdio.js';
import {runExeca, runExecaSync, runScript, runScriptSync} from '../helpers/run.js';
import {foobarString, foobarUint8Array} from '../helpers/input.js';

setFixtureDir();

const nonFileUrl = new URL('https://example.com');

const getAbsolutePath = file => ({file});
const getRelativePath = filePath => ({file: relative('.', filePath)});

const getStdioInput = (fdNumberOrName, file) => {
	if (fdNumberOrName === 'string') {
		return {input: foobarString};
	}

	if (fdNumberOrName === 'binary') {
		return {input: foobarUint8Array};
	}

	return getStdioInputFile(fdNumberOrName, file);
};

const getStdioInputFile = (fdNumberOrName, file) => getStdio(fdNumberOrName, typeof fdNumberOrName === 'string' ? file : {file});

const testStdinFile = async (t, mapFilePath, fdNumber, execaMethod) => {
	const filePath = tempfile();
	await writeFile(filePath, foobarString);
	const {stdout} = await execaMethod('stdin.js', getStdio(fdNumber, mapFilePath(filePath)));
	t.is(stdout, foobarString);
	await rm(filePath);
};

test('inputFile can be a file URL', testStdinFile, pathToFileURL, 'inputFile', execa);
test('stdin can be a file URL', testStdinFile, pathToFileURL, 0, execa);
test('inputFile can be an absolute file path', testStdinFile, identity, 'inputFile', execa);
test('stdin can be an absolute file path', testStdinFile, getAbsolutePath, 0, execa);
test('inputFile can be a relative file path', testStdinFile, identity, 'inputFile', execa);
test('stdin can be a relative file path', testStdinFile, getRelativePath, 0, execa);
test('inputFile can be a file URL - sync', testStdinFile, pathToFileURL, 'inputFile', execaSync);
test('stdin can be a file URL - sync', testStdinFile, pathToFileURL, 0, execaSync);
test('inputFile can be an absolute file path - sync', testStdinFile, identity, 'inputFile', execaSync);
test('stdin can be an absolute file path - sync', testStdinFile, getAbsolutePath, 0, execaSync);
test('inputFile can be a relative file path - sync', testStdinFile, identity, 'inputFile', execaSync);
test('stdin can be a relative file path - sync', testStdinFile, getRelativePath, 0, execaSync);

const testOutputFile = async (t, mapFile, fdNumber, execaMethod) => {
	const filePath = tempfile();
	await execaMethod('noop-fd.js', [`${fdNumber}`, foobarString], getStdio(fdNumber, mapFile(filePath)));
	t.is(await readFile(filePath, 'utf8'), foobarString);
	await rm(filePath);
};

test('stdout can be a file URL', testOutputFile, pathToFileURL, 1, execa);
test('stderr can be a file URL', testOutputFile, pathToFileURL, 2, execa);
test('stdio[*] can be a file URL', testOutputFile, pathToFileURL, 3, execa);
test('stdout can be an absolute file path', testOutputFile, getAbsolutePath, 1, execa);
test('stderr can be an absolute file path', testOutputFile, getAbsolutePath, 2, execa);
test('stdio[*] can be an absolute file path', testOutputFile, getAbsolutePath, 3, execa);
test('stdout can be a relative file path', testOutputFile, getRelativePath, 1, execa);
test('stderr can be a relative file path', testOutputFile, getRelativePath, 2, execa);
test('stdio[*] can be a relative file path', testOutputFile, getRelativePath, 3, execa);
test('stdout can be a file URL - sync', testOutputFile, pathToFileURL, 1, execaSync);
test('stderr can be a file URL - sync', testOutputFile, pathToFileURL, 2, execaSync);
test('stdio[*] can be a file URL - sync', testOutputFile, pathToFileURL, 3, execaSync);
test('stdout can be an absolute file path - sync', testOutputFile, getAbsolutePath, 1, execaSync);
test('stderr can be an absolute file path - sync', testOutputFile, getAbsolutePath, 2, execaSync);
test('stdio[*] can be an absolute file path - sync', testOutputFile, getAbsolutePath, 3, execaSync);
test('stdout can be a relative file path - sync', testOutputFile, getRelativePath, 1, execaSync);
test('stderr can be a relative file path - sync', testOutputFile, getRelativePath, 2, execaSync);
test('stdio[*] can be a relative file path - sync', testOutputFile, getRelativePath, 3, execaSync);

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

const testInputFileValidUrl = async (t, fdNumber, execaMethod) => {
	const filePath = tempfile();
	await writeFile(filePath, foobarString);
	const currentCwd = process.cwd();
	process.chdir(dirname(filePath));

	try {
		const {stdout} = await execaMethod('stdin.js', getStdioInputFile(fdNumber, basename(filePath)));
		t.is(stdout, foobarString);
	} finally {
		process.chdir(currentCwd);
		await rm(filePath);
	}
};

test.serial('inputFile does not need to start with . when being a relative file path', testInputFileValidUrl, 'inputFile', execa);
test.serial('stdin does not need to start with . when being a relative file path', testInputFileValidUrl, 0, execa);
test.serial('inputFile does not need to start with . when being a relative file path - sync', testInputFileValidUrl, 'inputFile', execaSync);
test.serial('stdin does not need to start with . when being a relative file path - sync', testInputFileValidUrl, 0, execaSync);

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

const testMultipleInputs = async (t, indices, execaMethod) => {
	const filePath = tempfile();
	await writeFile(filePath, foobarString);
	const options = Object.assign({}, ...indices.map(fdNumber => getStdioInput(fdNumber, filePath)));
	const {stdout} = await execaMethod('stdin.js', options);
	t.is(stdout, foobarString.repeat(indices.length));
	await rm(filePath);
};

test('inputFile can be set', testMultipleInputs, ['inputFile'], runExeca);
test('inputFile can be set - sync', testMultipleInputs, ['inputFile'], runExecaSync);
test('inputFile can be set with $', testMultipleInputs, ['inputFile'], runScript);
test('inputFile can be set with $.sync', testMultipleInputs, ['inputFile'], runScriptSync);
test('input String and inputFile can be both set', testMultipleInputs, ['inputFile', 'string'], execa);
test('input String and stdin can be both set', testMultipleInputs, [0, 'string'], execa);
test('input Uint8Array and inputFile can be both set', testMultipleInputs, ['inputFile', 'binary'], execa);
test('input Uint8Array and stdin can be both set', testMultipleInputs, [0, 'binary'], execa);
test('stdin and inputFile can be both set', testMultipleInputs, [0, 'inputFile'], execa);
test('input String, stdin and inputFile can be all set', testMultipleInputs, ['inputFile', 0, 'string'], execa);
test('input Uint8Array, stdin and inputFile can be all set', testMultipleInputs, ['inputFile', 0, 'binary'], execa);
test('input String and inputFile can be both set - sync', testMultipleInputs, ['inputFile', 'string'], execaSync);
test('input String and stdin can be both set - sync', testMultipleInputs, [0, 'string'], execaSync);
test('input Uint8Array and inputFile can be both set - sync', testMultipleInputs, ['inputFile', 'binary'], execaSync);
test('input Uint8Array and stdin can be both set - sync', testMultipleInputs, [0, 'binary'], execaSync);
test('stdin and inputFile can be both set - sync', testMultipleInputs, [0, 'inputFile'], execaSync);
test('input String, stdin and inputFile can be all set - sync', testMultipleInputs, ['inputFile', 0, 'string'], execaSync);
test('input Uint8Array, stdin and inputFile can be all set - sync', testMultipleInputs, ['inputFile', 0, 'binary'], execaSync);

const testMultipleOutputs = async (t, mapFile, fdNumber, execaMethod) => {
	const filePath = tempfile();
	const filePathTwo = tempfile();
	await execaMethod('noop-fd.js', [`${fdNumber}`, foobarString], getStdio(fdNumber, [mapFile(filePath), mapFile(filePathTwo)]));
	t.is(await readFile(filePath, 'utf8'), foobarString);
	t.is(await readFile(filePathTwo, 'utf8'), foobarString);
	await Promise.all([rm(filePath), rm(filePathTwo)]);
};

test('stdout can be two file URLs', testMultipleOutputs, pathToFileURL, 1, execa);
test('stdout can be two file paths', testMultipleOutputs, getAbsolutePath, 1, execa);
test('stdout can be two file URLs - sync', testMultipleOutputs, pathToFileURL, 1, execaSync);
test('stdout can be two file paths - sync', testMultipleOutputs, getAbsolutePath, 1, execaSync);
test('stderr can be two file URLs', testMultipleOutputs, pathToFileURL, 2, execa);
test('stderr can be two file paths', testMultipleOutputs, getAbsolutePath, 2, execa);
test('stderr can be two file URLs - sync', testMultipleOutputs, pathToFileURL, 2, execaSync);
test('stderr can be two file paths - sync', testMultipleOutputs, getAbsolutePath, 2, execaSync);
test('stdio[*] can be two file URLs', testMultipleOutputs, pathToFileURL, 3, execa);
test('stdio[*] can be two file paths', testMultipleOutputs, getAbsolutePath, 3, execa);
test('stdio[*] can be two file URLs - sync', testMultipleOutputs, pathToFileURL, 3, execaSync);
test('stdio[*] can be two file paths - sync', testMultipleOutputs, getAbsolutePath, 3, execaSync);

const testInputFileHanging = async (t, mapFilePath) => {
	const filePath = tempfile();
	await writeFile(filePath, foobarString);
	await t.throwsAsync(execa('stdin.js', {stdin: mapFilePath(filePath), timeout: 1}), {message: /timed out/});
	await rm(filePath);
};

test('Passing an input file path when subprocess exits does not make promise hang', testInputFileHanging, getAbsolutePath);
test('Passing an input file URL when subprocess exits does not make promise hang', testInputFileHanging, pathToFileURL);
