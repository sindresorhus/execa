import {readFile, writeFile, rm} from 'node:fs/promises';
import process from 'node:process';
import test from 'ava';
import tempfile from 'tempfile';
import {execa, execaSync} from '../../index.js';
import {getStdio} from '../helpers/stdio.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';

setFixtureDirectory();

const testInputOutput = (t, stdioOption, execaMethod) => {
	t.throws(() => {
		execaMethod('empty.js', getStdio(3, [new ReadableStream(), stdioOption]));
	}, {message: /readable and writable/});
};

test('Cannot pass both readable and writable values to stdio[*] - WritableStream', testInputOutput, new WritableStream(), execa);
test('Cannot pass both readable and writable values to stdio[*] - 1', testInputOutput, 1, execa);
test('Cannot pass both readable and writable values to stdio[*] - 2', testInputOutput, 2, execa);
test('Cannot pass both readable and writable values to stdio[*] - process.stdout', testInputOutput, process.stdout, execa);
test('Cannot pass both readable and writable values to stdio[*] - process.stderr', testInputOutput, process.stderr, execa);
test('Cannot pass both readable and writable values to stdio[*] - WritableStream - sync', testInputOutput, new WritableStream(), execaSync);
test('Cannot pass both readable and writable values to stdio[*] - 1 - sync', testInputOutput, 1, execaSync);
test('Cannot pass both readable and writable values to stdio[*] - 2 - sync', testInputOutput, 2, execaSync);
test('Cannot pass both readable and writable values to stdio[*] - process.stdout - sync', testInputOutput, process.stdout, execaSync);
test('Cannot pass both readable and writable values to stdio[*] - process.stderr - sync', testInputOutput, process.stderr, execaSync);

const testAmbiguousDirection = async (t, execaMethod) => {
	const [filePathOne, filePathTwo] = [tempfile(), tempfile()];
	await execaMethod('noop-fd.js', ['3', foobarString], getStdio(3, [{file: filePathOne}, {file: filePathTwo}]));
	t.deepEqual(
		await Promise.all([readFile(filePathOne, 'utf8'), readFile(filePathTwo, 'utf8')]),
		[foobarString, foobarString],
	);
	await Promise.all([rm(filePathOne), rm(filePathTwo)]);
};

test('stdio[*] default direction is output', testAmbiguousDirection, execa);
test('stdio[*] default direction is output - sync', testAmbiguousDirection, execaSync);

const testAmbiguousMultiple = async (t, fdNumber) => {
	const filePath = tempfile();
	await writeFile(filePath, foobarString);
	const {stdout} = await execa('stdin-fd.js', [`${fdNumber}`], getStdio(fdNumber, [{file: filePath}, ['foo', 'bar']]));
	t.is(stdout, `${foobarString}${foobarString}`);
	await rm(filePath);
};

test('stdin ambiguous direction is influenced by other values', testAmbiguousMultiple, 0);
test('stdio[*] ambiguous direction is influenced by other values', testAmbiguousMultiple, 3);
