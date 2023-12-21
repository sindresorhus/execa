import {readFile, writeFile, rm} from 'node:fs/promises';
import {relative, dirname, basename} from 'node:path';
import process from 'node:process';
import {pathToFileURL} from 'node:url';
import test from 'ava';
import tempfile from 'tempfile';
import {execa, execaSync, $} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdinOption, getStdoutOption, getStderrOption, getInputFileOption, getScriptSync, identity} from '../helpers/stdio.js';

setFixtureDir();

const nonFileUrl = new URL('https://example.com');

const getRelativePath = filePath => relative('.', filePath);

const testStdinFile = async (t, mapFilePath, getOptions, execaMethod) => {
	const filePath = tempfile();
	await writeFile(filePath, 'foobar');
	const {stdout} = await execaMethod('stdin.js', getOptions(mapFilePath(filePath)));
	t.is(stdout, 'foobar');
	await rm(filePath);
};

test('inputFile can be a file URL', testStdinFile, pathToFileURL, getInputFileOption, execa);
test('stdin can be a file URL', testStdinFile, pathToFileURL, getStdinOption, execa);
test('inputFile can be an absolute file path', testStdinFile, identity, getInputFileOption, execa);
test('stdin can be an absolute file path', testStdinFile, identity, getStdinOption, execa);
test('inputFile can be a relative file path', testStdinFile, getRelativePath, getInputFileOption, execa);
test('stdin can be a relative file path', testStdinFile, getRelativePath, getStdinOption, execa);
test('inputFile can be a file URL - sync', testStdinFile, pathToFileURL, getInputFileOption, execaSync);
test('stdin can be a file URL - sync', testStdinFile, pathToFileURL, getStdinOption, execaSync);
test('inputFile can be an absolute file path - sync', testStdinFile, identity, getInputFileOption, execaSync);
test('stdin can be an absolute file path - sync', testStdinFile, identity, getStdinOption, execaSync);
test('inputFile can be a relative file path - sync', testStdinFile, getRelativePath, getInputFileOption, execaSync);
test('stdin can be a relative file path - sync', testStdinFile, getRelativePath, getStdinOption, execaSync);

// eslint-disable-next-line max-params
const testOutputFile = async (t, mapFile, fixtureName, getOptions, execaMethod) => {
	const filePath = tempfile();
	await execaMethod(fixtureName, ['foobar'], getOptions(mapFile(filePath)));
	t.is(await readFile(filePath, 'utf8'), 'foobar\n');
	await rm(filePath);
};

test('stdout can be a file URL', testOutputFile, pathToFileURL, 'noop.js', getStdoutOption, execa);
test('stderr can be a file URL', testOutputFile, pathToFileURL, 'noop-err.js', getStderrOption, execa);
test('stdout can be an absolute file path', testOutputFile, identity, 'noop.js', getStdoutOption, execa);
test('stderr can be an absolute file path', testOutputFile, identity, 'noop-err.js', getStderrOption, execa);
test('stdout can be a relative file path', testOutputFile, getRelativePath, 'noop.js', getStdoutOption, execa);
test('stderr can be a relative file path', testOutputFile, getRelativePath, 'noop-err.js', getStderrOption, execa);
test('stdout can be a file URL - sync', testOutputFile, pathToFileURL, 'noop.js', getStdoutOption, execaSync);
test('stderr can be a file URL - sync', testOutputFile, pathToFileURL, 'noop-err.js', getStderrOption, execaSync);
test('stdout can be an absolute file path - sync', testOutputFile, identity, 'noop.js', getStdoutOption, execaSync);
test('stderr can be an absolute file path - sync', testOutputFile, identity, 'noop-err.js', getStderrOption, execaSync);
test('stdout can be a relative file path - sync', testOutputFile, getRelativePath, 'noop.js', getStdoutOption, execaSync);
test('stderr can be a relative file path - sync', testOutputFile, getRelativePath, 'noop-err.js', getStderrOption, execaSync);

const testStdioNonFileUrl = (t, getOptions, execaMethod) => {
	t.throws(() => {
		execaMethod('noop.js', getOptions(nonFileUrl));
	}, {message: /pathToFileURL/});
};

test('inputFile cannot be a non-file URL', testStdioNonFileUrl, getInputFileOption, execa);
test('stdin cannot be a non-file URL', testStdioNonFileUrl, getStdinOption, execa);
test('stdout cannot be a non-file URL', testStdioNonFileUrl, getStdoutOption, execa);
test('stderr cannot be a non-file URL', testStdioNonFileUrl, getStderrOption, execa);
test('inputFile cannot be a non-file URL - sync', testStdioNonFileUrl, getInputFileOption, execaSync);
test('stdin cannot be a non-file URL - sync', testStdioNonFileUrl, getStdinOption, execaSync);
test('stdout cannot be a non-file URL - sync', testStdioNonFileUrl, getStdoutOption, execaSync);
test('stderr cannot be a non-file URL - sync', testStdioNonFileUrl, getStderrOption, execaSync);

const testInputFileValidUrl = async (t, execaMethod) => {
	const filePath = tempfile();
	await writeFile(filePath, 'foobar');
	const currentCwd = process.cwd();
	process.chdir(dirname(filePath));

	try {
		const {stdout} = await execaMethod('stdin.js', {inputFile: basename(filePath)});
		t.is(stdout, 'foobar');
	} finally {
		process.chdir(currentCwd);
		await rm(filePath);
	}
};

test.serial('inputFile does not need to start with . when being a relative file path', testInputFileValidUrl, execa);
test.serial('inputFile does not need to start with . when being a relative file path - sync', testInputFileValidUrl, execaSync);

const testStdioValidUrl = (t, getOptions, execaMethod) => {
	t.throws(() => {
		execaMethod('noop.js', getOptions('foobar'));
	}, {message: /absolute file path/});
};

test('stdin must start with . when being a relative file path', testStdioValidUrl, getStdinOption, execa);
test('stdout must start with . when being a relative file path', testStdioValidUrl, getStdoutOption, execa);
test('stderr must start with . when being a relative file path', testStdioValidUrl, getStderrOption, execa);
test('stdin must start with . when being a relative file path - sync', testStdioValidUrl, getStdinOption, execaSync);
test('stdout must start with . when being a relative file path - sync', testStdioValidUrl, getStdoutOption, execaSync);
test('stderr must start with . when being a relative file path - sync', testStdioValidUrl, getStderrOption, execaSync);

const testFileError = async (t, mapFile, getOptions) => {
	await t.throwsAsync(
		execa('noop.js', getOptions(mapFile('./unknown/file'))),
		{code: 'ENOENT'},
	);
};

test('inputFile file URL errors should be handled', testFileError, pathToFileURL, getInputFileOption);
test('stdin file URL errors should be handled', testFileError, pathToFileURL, getStdinOption);
test('stdout file URL errors should be handled', testFileError, pathToFileURL, getStdoutOption);
test('stderr file URL errors should be handled', testFileError, pathToFileURL, getStderrOption);
test('inputFile file path errors should be handled', testFileError, identity, getInputFileOption);
test('stdin file path errors should be handled', testFileError, identity, getStdinOption);
test('stdout file path errors should be handled', testFileError, identity, getStdoutOption);
test('stderr file path errors should be handled', testFileError, identity, getStderrOption);

const testFileErrorSync = (t, mapFile, getOptions) => {
	t.throws(() => {
		execaSync('noop.js', getOptions(mapFile('./unknown/file')));
	}, {code: 'ENOENT'});
};

test('inputFile file URL errors should be handled - sync', testFileErrorSync, pathToFileURL, getInputFileOption);
test('stdin file URL errors should be handled - sync', testFileErrorSync, pathToFileURL, getStdinOption);
test('stdout file URL errors should be handled - sync', testFileErrorSync, pathToFileURL, getStdoutOption);
test('stderr file URL errors should be handled - sync', testFileErrorSync, pathToFileURL, getStderrOption);
test('inputFile file path errors should be handled - sync', testFileErrorSync, identity, getInputFileOption);
test('stdin file path errors should be handled - sync', testFileErrorSync, identity, getStdinOption);
test('stdout file path errors should be handled - sync', testFileErrorSync, identity, getStdoutOption);
test('stderr file path errors should be handled - sync', testFileErrorSync, identity, getStderrOption);

const testInputFile = async (t, execaMethod) => {
	const inputFile = tempfile();
	await writeFile(inputFile, 'foobar');
	const {stdout} = await execaMethod('stdin.js', {inputFile});
	t.is(stdout, 'foobar');
	await rm(inputFile);
};

test('inputFile can be set', testInputFile, execa);
test('inputFile can be set - sync', testInputFile, execa);

const testInputFileScript = async (t, getExecaMethod) => {
	const inputFile = tempfile();
	await writeFile(inputFile, 'foobar');
	const {stdout} = await getExecaMethod($({inputFile}))`stdin.js`;
	t.is(stdout, 'foobar');
	await rm(inputFile);
};

test('inputFile can be set with $', testInputFileScript, identity);
test('inputFile can be set with $.sync', testInputFileScript, getScriptSync);

test('inputFile option cannot be set when stdin is set', t => {
	t.throws(() => {
		execa('stdin.js', {inputFile: '', stdin: 'ignore'});
	}, {message: /`inputFile` and `stdin` options/});
});
