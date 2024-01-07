import {readFile, writeFile, rm} from 'node:fs/promises';
import {relative, dirname, basename} from 'node:path';
import process from 'node:process';
import {pathToFileURL} from 'node:url';
import test from 'ava';
import tempfile from 'tempfile';
import {execa, execaSync, $} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdinOption, getStdoutOption, getStderrOption, getStdioOption, getInputFileOption, getScriptSync, identity} from '../helpers/stdio.js';

setFixtureDir();

const textEncoder = new TextEncoder();
const binaryFoobar = textEncoder.encode('foobar');
const nonFileUrl = new URL('https://example.com');

const getAbsolutePath = file => ({file});
const getRelativePath = filePath => ({file: relative('.', filePath)});
const getStdinFilePath = file => ({stdin: {file}});

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
test('stdin can be an absolute file path', testStdinFile, getAbsolutePath, getStdinOption, execa);
test('inputFile can be a relative file path', testStdinFile, identity, getInputFileOption, execa);
test('stdin can be a relative file path', testStdinFile, getRelativePath, getStdinOption, execa);
test('inputFile can be a file URL - sync', testStdinFile, pathToFileURL, getInputFileOption, execaSync);
test('stdin can be a file URL - sync', testStdinFile, pathToFileURL, getStdinOption, execaSync);
test('inputFile can be an absolute file path - sync', testStdinFile, identity, getInputFileOption, execaSync);
test('stdin can be an absolute file path - sync', testStdinFile, getAbsolutePath, getStdinOption, execaSync);
test('inputFile can be a relative file path - sync', testStdinFile, identity, getInputFileOption, execaSync);
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
test('stdio[*] can be a file URL', testOutputFile, pathToFileURL, 'noop-fd3.js', getStdioOption, execa);
test('stdout can be an absolute file path', testOutputFile, getAbsolutePath, 'noop.js', getStdoutOption, execa);
test('stderr can be an absolute file path', testOutputFile, getAbsolutePath, 'noop-err.js', getStderrOption, execa);
test('stdio[*] can be an absolute file path', testOutputFile, getAbsolutePath, 'noop-fd3.js', getStdioOption, execa);
test('stdout can be a relative file path', testOutputFile, getRelativePath, 'noop.js', getStdoutOption, execa);
test('stderr can be a relative file path', testOutputFile, getRelativePath, 'noop-err.js', getStderrOption, execa);
test('stdio[*] can be a relative file path', testOutputFile, getRelativePath, 'noop-fd3.js', getStdioOption, execa);
test('stdout can be a file URL - sync', testOutputFile, pathToFileURL, 'noop.js', getStdoutOption, execaSync);
test('stderr can be a file URL - sync', testOutputFile, pathToFileURL, 'noop-err.js', getStderrOption, execaSync);
test('stdio[*] can be a file URL - sync', testOutputFile, pathToFileURL, 'noop-fd3.js', getStdioOption, execaSync);
test('stdout can be an absolute file path - sync', testOutputFile, getAbsolutePath, 'noop.js', getStdoutOption, execaSync);
test('stderr can be an absolute file path - sync', testOutputFile, getAbsolutePath, 'noop-err.js', getStderrOption, execaSync);
test('stdio[*] can be an absolute file path - sync', testOutputFile, getAbsolutePath, 'noop-fd3.js', getStdioOption, execaSync);
test('stdout can be a relative file path - sync', testOutputFile, getRelativePath, 'noop.js', getStdoutOption, execaSync);
test('stderr can be a relative file path - sync', testOutputFile, getRelativePath, 'noop-err.js', getStderrOption, execaSync);
test('stdio[*] can be a relative file path - sync', testOutputFile, getRelativePath, 'noop-fd3.js', getStdioOption, execaSync);

const testStdioNonFileUrl = (t, getOptions, execaMethod) => {
	t.throws(() => {
		execaMethod('noop.js', getOptions(nonFileUrl));
	}, {message: /pathToFileURL/});
};

test('inputFile cannot be a non-file URL', testStdioNonFileUrl, getInputFileOption, execa);
test('stdin cannot be a non-file URL', testStdioNonFileUrl, getStdinOption, execa);
test('stdout cannot be a non-file URL', testStdioNonFileUrl, getStdoutOption, execa);
test('stderr cannot be a non-file URL', testStdioNonFileUrl, getStderrOption, execa);
test('stdio[*] cannot be a non-file URL', testStdioNonFileUrl, getStdioOption, execa);
test('inputFile cannot be a non-file URL - sync', testStdioNonFileUrl, getInputFileOption, execaSync);
test('stdin cannot be a non-file URL - sync', testStdioNonFileUrl, getStdinOption, execaSync);
test('stdout cannot be a non-file URL - sync', testStdioNonFileUrl, getStdoutOption, execaSync);
test('stderr cannot be a non-file URL - sync', testStdioNonFileUrl, getStderrOption, execaSync);
test('stdio[*] cannot be a non-file URL - sync', testStdioNonFileUrl, getStdioOption, execaSync);

const testInvalidInputFile = (t, execaMethod) => {
	t.throws(() => {
		execaMethod('noop.js', getInputFileOption(false));
	}, {message: /a file path string or a file URL/});
};

test('inputFile must be a file URL or string', testInvalidInputFile, execa);
test('inputFile must be a file URL or string - sync', testInvalidInputFile, execaSync);

const testInputFileValidUrl = async (t, getOptions, execaMethod) => {
	const filePath = tempfile();
	await writeFile(filePath, 'foobar');
	const currentCwd = process.cwd();
	process.chdir(dirname(filePath));

	try {
		const {stdout} = await execaMethod('stdin.js', getOptions(basename(filePath)));
		t.is(stdout, 'foobar');
	} finally {
		process.chdir(currentCwd);
		await rm(filePath);
	}
};

test.serial('inputFile does not need to start with . when being a relative file path', testInputFileValidUrl, getInputFileOption, execa);
test.serial('stdin does not need to start with . when being a relative file path', testInputFileValidUrl, getStdinFilePath, execa);
test.serial('inputFile does not need to start with . when being a relative file path - sync', testInputFileValidUrl, getInputFileOption, execaSync);
test.serial('stdin does not need to start with . when being a relative file path - sync', testInputFileValidUrl, getStdinFilePath, execaSync);

const testFilePathObject = (t, getOptions, execaMethod) => {
	t.throws(() => {
		execaMethod('noop.js', getOptions('foobar'));
	}, {message: /must be used/});
};

test('stdin must be an object when it is a file path string', testFilePathObject, getStdinOption, execa);
test('stdout must be an object when it is a file path string', testFilePathObject, getStdoutOption, execa);
test('stderr must be an object when it is a file path string', testFilePathObject, getStderrOption, execa);
test('stdio[*] must be an object when it is a file path string', testFilePathObject, getStdioOption, execa);
test('stdin be an object when it is a file path string - sync', testFilePathObject, getStdinOption, execaSync);
test('stdout be an object when it is a file path string - sync', testFilePathObject, getStdoutOption, execaSync);
test('stderr be an object when it is a file path string - sync', testFilePathObject, getStderrOption, execaSync);
test('stdio[*] must be an object when it is a file path string - sync', testFilePathObject, getStdioOption, execaSync);

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
test('stdio[*] file URL errors should be handled', testFileError, pathToFileURL, getStdioOption);
test('inputFile file path errors should be handled', testFileError, identity, getInputFileOption);
test('stdin file path errors should be handled', testFileError, getAbsolutePath, getStdinOption);
test('stdout file path errors should be handled', testFileError, getAbsolutePath, getStdoutOption);
test('stderr file path errors should be handled', testFileError, getAbsolutePath, getStderrOption);
test('stdio[*] file path errors should be handled', testFileError, getAbsolutePath, getStdioOption);

const testFileErrorSync = (t, mapFile, getOptions) => {
	t.throws(() => {
		execaSync('noop.js', getOptions(mapFile('./unknown/file')));
	}, {code: 'ENOENT'});
};

test('inputFile file URL errors should be handled - sync', testFileErrorSync, pathToFileURL, getInputFileOption);
test('stdin file URL errors should be handled - sync', testFileErrorSync, pathToFileURL, getStdinOption);
test('stdout file URL errors should be handled - sync', testFileErrorSync, pathToFileURL, getStdoutOption);
test('stderr file URL errors should be handled - sync', testFileErrorSync, pathToFileURL, getStderrOption);
test('stdio[*] file URL errors should be handled - sync', testFileErrorSync, pathToFileURL, getStdioOption);
test('inputFile file path errors should be handled - sync', testFileErrorSync, identity, getInputFileOption);
test('stdin file path errors should be handled - sync', testFileErrorSync, getAbsolutePath, getStdinOption);
test('stdout file path errors should be handled - sync', testFileErrorSync, getAbsolutePath, getStdoutOption);
test('stderr file path errors should be handled - sync', testFileErrorSync, getAbsolutePath, getStderrOption);
test('stdio[*] file path errors should be handled - sync', testFileErrorSync, getAbsolutePath, getStdioOption);

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

const testMultipleInputs = async (t, allGetOptions, execaMethod) => {
	const filePath = tempfile();
	await writeFile(filePath, 'foobar');
	const options = Object.assign({}, ...allGetOptions.map(getOptions => getOptions(filePath)));
	const {stdout} = await execaMethod('stdin.js', options);
	t.is(stdout, 'foobar'.repeat(allGetOptions.length));
	await rm(filePath);
};

const getStringInput = () => ({input: 'foobar'});
const getBinaryInput = () => ({input: binaryFoobar});

test('input String and inputFile can be both set', testMultipleInputs, [getInputFileOption, getStringInput], execa);
test('input String and stdin can be both set', testMultipleInputs, [getStdinFilePath, getStringInput], execa);
test('input Uint8Array and inputFile can be both set', testMultipleInputs, [getInputFileOption, getBinaryInput], execa);
test('input Uint8Array and stdin can be both set', testMultipleInputs, [getStdinFilePath, getBinaryInput], execa);
test('stdin and inputFile can be both set', testMultipleInputs, [getStdinFilePath, getInputFileOption], execa);
test('input String, stdin and inputFile can be all set', testMultipleInputs, [getInputFileOption, getStdinFilePath, getStringInput], execa);
test('input Uint8Array, stdin and inputFile can be all set', testMultipleInputs, [getInputFileOption, getStdinFilePath, getBinaryInput], execa);
test('input String and inputFile can be both set - sync', testMultipleInputs, [getInputFileOption, getStringInput], execaSync);
test('input String and stdin can be both set - sync', testMultipleInputs, [getStdinFilePath, getStringInput], execaSync);
test('input Uint8Array and inputFile can be both set - sync', testMultipleInputs, [getInputFileOption, getBinaryInput], execaSync);
test('input Uint8Array and stdin can be both set - sync', testMultipleInputs, [getStdinFilePath, getBinaryInput], execaSync);
test('stdin and inputFile can be both set - sync', testMultipleInputs, [getStdinFilePath, getInputFileOption], execaSync);
test('input String, stdin and inputFile can be all set - sync', testMultipleInputs, [getInputFileOption, getStdinFilePath, getStringInput], execaSync);
test('input Uint8Array, stdin and inputFile can be all set - sync', testMultipleInputs, [getInputFileOption, getStdinFilePath, getBinaryInput], execaSync);
