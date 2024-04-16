import {readFile, writeFile, rm} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import test from 'ava';
import tempfile from 'tempfile';
import {execa, execaSync} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {getStdio} from '../helpers/stdio.js';
import {foobarString, foobarUppercase} from '../helpers/input.js';
import {uppercaseGenerator} from '../helpers/generator.js';
import {getAbsolutePath} from '../helpers/file-path.js';

setFixtureDir();

const testInputFileTransform = async (t, fdNumber, mapFile, execaMethod) => {
	const filePath = tempfile();
	await writeFile(filePath, foobarString);
	const {stdout} = await execaMethod('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, [
		new Uint8Array(),
		mapFile(filePath),
		uppercaseGenerator(),
	]));
	t.is(stdout, foobarUppercase);
	await rm(filePath);
};

test('stdin can use generators together with input file paths', testInputFileTransform, 0, getAbsolutePath, execa);
test('stdin can use generators together with input file URLs', testInputFileTransform, 0, pathToFileURL, execa);
test('stdio[*] can use generators together with input file paths', testInputFileTransform, 3, getAbsolutePath, execa);
test('stdio[*] can use generators together with input file URLs', testInputFileTransform, 3, pathToFileURL, execa);
test('stdin can use generators together with input file paths, sync', testInputFileTransform, 0, getAbsolutePath, execaSync);
test('stdin can use generators together with input file URLs, sync', testInputFileTransform, 0, pathToFileURL, execaSync);

const testOutputFileTransform = async (t, fdNumber, mapFile, execaMethod) => {
	const filePath = tempfile();
	await execaMethod('noop-fd.js', [`${fdNumber}`, foobarString], getStdio(fdNumber, [
		uppercaseGenerator(),
		mapFile(filePath),
	]));
	t.is(await readFile(filePath, 'utf8'), `${foobarUppercase}\n`);
	await rm(filePath);
};

test('stdout can use generators together with output file paths', testOutputFileTransform, 1, getAbsolutePath, execa);
test('stdout can use generators together with output file URLs', testOutputFileTransform, 1, pathToFileURL, execa);
test('stderr can use generators together with output file paths', testOutputFileTransform, 2, getAbsolutePath, execa);
test('stderr can use generators together with output file URLs', testOutputFileTransform, 2, pathToFileURL, execa);
test('stdio[*] can use generators together with output file paths', testOutputFileTransform, 3, getAbsolutePath, execa);
test('stdio[*] can use generators together with output file URLs', testOutputFileTransform, 3, pathToFileURL, execa);
test('stdout can use generators together with output file paths, sync', testOutputFileTransform, 1, getAbsolutePath, execaSync);
test('stdout can use generators together with output file URLs, sync', testOutputFileTransform, 1, pathToFileURL, execaSync);
test('stderr can use generators together with output file paths, sync', testOutputFileTransform, 2, getAbsolutePath, execaSync);
test('stderr can use generators together with output file URLs, sync', testOutputFileTransform, 2, pathToFileURL, execaSync);
test('stdio[*] can use generators together with output file paths, sync', testOutputFileTransform, 3, getAbsolutePath, execaSync);
test('stdio[*] can use generators together with output file URLs, sync', testOutputFileTransform, 3, pathToFileURL, execaSync);

const testOutputFileLines = async (t, fdNumber, mapFile, execaMethod) => {
	const filePath = tempfile();
	const {stdio} = await execaMethod('noop-fd.js', [`${fdNumber}`, foobarString], {
		...getStdio(fdNumber, mapFile(filePath)),
		lines: true,
	});
	t.deepEqual(stdio[fdNumber], [foobarString]);
	t.is(await readFile(filePath, 'utf8'), foobarString);
	await rm(filePath);
};

test('stdout can use "lines: true" together with output file paths', testOutputFileLines, 1, getAbsolutePath, execa);
test('stdout can use "lines: true" together with output file URLs', testOutputFileLines, 1, pathToFileURL, execa);
test('stderr can use "lines: true" together with output file paths', testOutputFileLines, 2, getAbsolutePath, execa);
test('stderr can use "lines: true" together with output file URLs', testOutputFileLines, 2, pathToFileURL, execa);
test('stdio[*] can use "lines: true" together with output file paths', testOutputFileLines, 3, getAbsolutePath, execa);
test('stdio[*] can use "lines: true" together with output file URLs', testOutputFileLines, 3, pathToFileURL, execa);
test('stdout can use "lines: true" together with output file paths, sync', testOutputFileLines, 1, getAbsolutePath, execaSync);
test('stdout can use "lines: true" together with output file URLs, sync', testOutputFileLines, 1, pathToFileURL, execaSync);
test('stderr can use "lines: true" together with output file paths, sync', testOutputFileLines, 2, getAbsolutePath, execaSync);
test('stderr can use "lines: true" together with output file URLs, sync', testOutputFileLines, 2, pathToFileURL, execaSync);
test('stdio[*] can use "lines: true" together with output file paths, sync', testOutputFileLines, 3, getAbsolutePath, execaSync);
test('stdio[*] can use "lines: true" together with output file URLs, sync', testOutputFileLines, 3, pathToFileURL, execaSync);

const testOutputFileNoBuffer = async (t, buffer, execaMethod) => {
	const filePath = tempfile();
	const {stdout} = await execaMethod('noop-fd.js', ['1', foobarString], {
		stdout: getAbsolutePath(filePath),
		buffer,
	});
	t.is(stdout, undefined);
	t.is(await readFile(filePath, 'utf8'), foobarString);
	await rm(filePath);
};

test('stdout can use "buffer: false" together with output file paths', testOutputFileNoBuffer, false, execa);
test('stdout can use "buffer: false" together with output file paths, fd-specific', testOutputFileNoBuffer, {stdout: false}, execa);
test('stdout can use "buffer: false" together with output file paths, sync', testOutputFileNoBuffer, false, execaSync);
test('stdout can use "buffer: false" together with output file paths, fd-specific, sync', testOutputFileNoBuffer, {stdout: false}, execaSync);
