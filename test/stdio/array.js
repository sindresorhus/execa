import {readFile, writeFile, rm} from 'node:fs/promises';
import process from 'node:process';
import test from 'ava';
import tempfile from 'tempfile';
import {execa, execaSync} from '../../index.js';
import {fullStdio, getStdio, STANDARD_STREAMS} from '../helpers/stdio.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';

setFixtureDir();

const testEmptyArray = (t, index, optionName, execaMethod) => {
	t.throws(() => {
		execaMethod('empty.js', getStdio(index, []));
	}, {message: `The \`${optionName}\` option must not be an empty array.`});
};

test('Cannot pass an empty array to stdin', testEmptyArray, 0, 'stdin', execa);
test('Cannot pass an empty array to stdout', testEmptyArray, 1, 'stdout', execa);
test('Cannot pass an empty array to stderr', testEmptyArray, 2, 'stderr', execa);
test('Cannot pass an empty array to stdio[*]', testEmptyArray, 3, 'stdio[3]', execa);
test('Cannot pass an empty array to stdin - sync', testEmptyArray, 0, 'stdin', execaSync);
test('Cannot pass an empty array to stdout - sync', testEmptyArray, 1, 'stdout', execaSync);
test('Cannot pass an empty array to stderr - sync', testEmptyArray, 2, 'stderr', execaSync);
test('Cannot pass an empty array to stdio[*] - sync', testEmptyArray, 3, 'stdio[3]', execaSync);

const testNoPipeOption = async (t, stdioOption, index) => {
	const childProcess = execa('empty.js', getStdio(index, stdioOption));
	t.is(childProcess.stdio[index], null);
	await childProcess;
};

test('stdin can be "ignore"', testNoPipeOption, 'ignore', 0);
test('stdin can be ["ignore"]', testNoPipeOption, ['ignore'], 0);
test('stdin can be ["ignore", "ignore"]', testNoPipeOption, ['ignore', 'ignore'], 0);
test('stdin can be "ipc"', testNoPipeOption, 'ipc', 0);
test('stdin can be ["ipc"]', testNoPipeOption, ['ipc'], 0);
test('stdin can be "inherit"', testNoPipeOption, 'inherit', 0);
test('stdin can be ["inherit"]', testNoPipeOption, ['inherit'], 0);
test('stdin can be 0', testNoPipeOption, 0, 0);
test('stdin can be [0]', testNoPipeOption, [0], 0);
test('stdout can be "ignore"', testNoPipeOption, 'ignore', 1);
test('stdout can be ["ignore"]', testNoPipeOption, ['ignore'], 1);
test('stdout can be ["ignore", "ignore"]', testNoPipeOption, ['ignore', 'ignore'], 1);
test('stdout can be "ipc"', testNoPipeOption, 'ipc', 1);
test('stdout can be ["ipc"]', testNoPipeOption, ['ipc'], 1);
test('stdout can be "inherit"', testNoPipeOption, 'inherit', 1);
test('stdout can be ["inherit"]', testNoPipeOption, ['inherit'], 1);
test('stdout can be 1', testNoPipeOption, 1, 1);
test('stdout can be [1]', testNoPipeOption, [1], 1);
test('stderr can be "ignore"', testNoPipeOption, 'ignore', 2);
test('stderr can be ["ignore"]', testNoPipeOption, ['ignore'], 2);
test('stderr can be ["ignore", "ignore"]', testNoPipeOption, ['ignore', 'ignore'], 2);
test('stderr can be "ipc"', testNoPipeOption, 'ipc', 2);
test('stderr can be ["ipc"]', testNoPipeOption, ['ipc'], 2);
test('stderr can be "inherit"', testNoPipeOption, 'inherit', 2);
test('stderr can be ["inherit"]', testNoPipeOption, ['inherit'], 2);
test('stderr can be 2', testNoPipeOption, 2, 2);
test('stderr can be [2]', testNoPipeOption, [2], 2);
test('stdio[*] can be "ignore"', testNoPipeOption, 'ignore', 3);
test('stdio[*] can be ["ignore"]', testNoPipeOption, ['ignore'], 3);
test('stdio[*] can be ["ignore", "ignore"]', testNoPipeOption, ['ignore', 'ignore'], 3);
test('stdio[*] can be "ipc"', testNoPipeOption, 'ipc', 3);
test('stdio[*] can be ["ipc"]', testNoPipeOption, ['ipc'], 3);
test('stdio[*] can be "inherit"', testNoPipeOption, 'inherit', 3);
test('stdio[*] can be ["inherit"]', testNoPipeOption, ['inherit'], 3);
test('stdio[*] can be 3', testNoPipeOption, 3, 3);
test('stdio[*] can be [3]', testNoPipeOption, [3], 3);

const testInvalidArrayValue = (t, invalidStdio, index, execaMethod) => {
	t.throws(() => {
		execaMethod('empty.js', getStdio(index, ['pipe', invalidStdio]));
	}, {message: /must not include/});
};

test('Cannot pass "ignore" and another value to stdin', testInvalidArrayValue, 'ignore', 0, execa);
test('Cannot pass "ignore" and another value to stdout', testInvalidArrayValue, 'ignore', 1, execa);
test('Cannot pass "ignore" and another value to stderr', testInvalidArrayValue, 'ignore', 2, execa);
test('Cannot pass "ignore" and another value to stdio[*]', testInvalidArrayValue, 'ignore', 3, execa);
test('Cannot pass "ignore" and another value to stdin - sync', testInvalidArrayValue, 'ignore', 0, execaSync);
test('Cannot pass "ignore" and another value to stdout - sync', testInvalidArrayValue, 'ignore', 1, execaSync);
test('Cannot pass "ignore" and another value to stderr - sync', testInvalidArrayValue, 'ignore', 2, execaSync);
test('Cannot pass "ignore" and another value to stdio[*] - sync', testInvalidArrayValue, 'ignore', 3, execaSync);
test('Cannot pass "ipc" and another value to stdin', testInvalidArrayValue, 'ipc', 0, execa);
test('Cannot pass "ipc" and another value to stdout', testInvalidArrayValue, 'ipc', 1, execa);
test('Cannot pass "ipc" and another value to stderr', testInvalidArrayValue, 'ipc', 2, execa);
test('Cannot pass "ipc" and another value to stdio[*]', testInvalidArrayValue, 'ipc', 3, execa);
test('Cannot pass "ipc" and another value to stdin - sync', testInvalidArrayValue, 'ipc', 0, execaSync);
test('Cannot pass "ipc" and another value to stdout - sync', testInvalidArrayValue, 'ipc', 1, execaSync);
test('Cannot pass "ipc" and another value to stderr - sync', testInvalidArrayValue, 'ipc', 2, execaSync);
test('Cannot pass "ipc" and another value to stdio[*] - sync', testInvalidArrayValue, 'ipc', 3, execaSync);

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
	await execaMethod('noop-fd.js', ['3', 'foobar'], getStdio(3, [{file: filePathOne}, {file: filePathTwo}]));
	t.deepEqual(
		await Promise.all([readFile(filePathOne, 'utf8'), readFile(filePathTwo, 'utf8')]),
		['foobar', 'foobar'],
	);
	await Promise.all([rm(filePathOne), rm(filePathTwo)]);
};

test('stdio[*] default direction is output', testAmbiguousDirection, execa);
test('stdio[*] default direction is output - sync', testAmbiguousDirection, execaSync);

const testAmbiguousMultiple = async (t, index) => {
	const filePath = tempfile();
	await writeFile(filePath, 'foobar');
	const {stdout} = await execa('stdin-fd.js', [`${index}`], getStdio(index, [{file: filePath}, ['foo', 'bar']]));
	t.is(stdout, 'foobarfoobar');
	await rm(filePath);
};

test('stdin ambiguous direction is influenced by other values', testAmbiguousMultiple, 0);
test('stdio[*] ambiguous direction is influenced by other values', testAmbiguousMultiple, 3);

const testRedirect = async (t, stdioOption, index, isInput) => {
	const {fixtureName, ...options} = isInput
		? {fixtureName: 'stdin-fd.js', input: 'foobar'}
		: {fixtureName: 'noop-fd.js'};
	const {stdio} = await execa('nested-stdio.js', [JSON.stringify(stdioOption), `${index}`, fixtureName, 'foobar'], options);
	const resultIndex = isStderrDescriptor(stdioOption) ? 2 : 1;
	t.is(stdio[resultIndex], 'foobar');
};

const isStderrDescriptor = stdioOption => stdioOption === 2
	|| stdioOption === 'stderr'
	|| (Array.isArray(stdioOption) && isStderrDescriptor(stdioOption[0]));

test.serial('stdio[*] can be 0', testRedirect, 0, 3, true);
test.serial('stdio[*] can be [0]', testRedirect, [0], 3, true);
test.serial('stdio[*] can be [0, "pipe"]', testRedirect, [0, 'pipe'], 3, true);
test.serial('stdio[*] can be process.stdin', testRedirect, 'stdin', 3, true);
test.serial('stdio[*] can be [process.stdin]', testRedirect, ['stdin'], 3, true);
test.serial('stdio[*] can be [process.stdin, "pipe"]', testRedirect, ['stdin', 'pipe'], 3, true);
test('stdout can be 2', testRedirect, 2, 1, false);
test('stdout can be [2]', testRedirect, [2], 1, false);
test('stdout can be [2, "pipe"]', testRedirect, [2, 'pipe'], 1, false);
test('stdout can be process.stderr', testRedirect, 'stderr', 1, false);
test('stdout can be [process.stderr]', testRedirect, ['stderr'], 1, false);
test('stdout can be [process.stderr, "pipe"]', testRedirect, ['stderr', 'pipe'], 1, false);
test('stderr can be 1', testRedirect, 1, 2, false);
test('stderr can be [1]', testRedirect, [1], 2, false);
test('stderr can be [1, "pipe"]', testRedirect, [1, 'pipe'], 2, false);
test('stderr can be process.stdout', testRedirect, 'stdout', 2, false);
test('stderr can be [process.stdout]', testRedirect, ['stdout'], 2, false);
test('stderr can be [process.stdout, "pipe"]', testRedirect, ['stdout', 'pipe'], 2, false);
test('stdio[*] can be 1', testRedirect, 1, 3, false);
test('stdio[*] can be [1]', testRedirect, [1], 3, false);
test('stdio[*] can be [1, "pipe"]', testRedirect, [1, 'pipe'], 3, false);
test('stdio[*] can be 2', testRedirect, 2, 3, false);
test('stdio[*] can be [2]', testRedirect, [2], 3, false);
test('stdio[*] can be [2, "pipe"]', testRedirect, [2, 'pipe'], 3, false);
test('stdio[*] can be process.stdout', testRedirect, 'stdout', 3, false);
test('stdio[*] can be [process.stdout]', testRedirect, ['stdout'], 3, false);
test('stdio[*] can be [process.stdout, "pipe"]', testRedirect, ['stdout', 'pipe'], 3, false);
test('stdio[*] can be process.stderr', testRedirect, 'stderr', 3, false);
test('stdio[*] can be [process.stderr]', testRedirect, ['stderr'], 3, false);
test('stdio[*] can be [process.stderr, "pipe"]', testRedirect, ['stderr', 'pipe'], 3, false);

const testInheritStdin = async (t, stdin) => {
	const {stdout} = await execa('nested-multiple-stdin.js', [JSON.stringify(stdin)], {input: 'foobar'});
	t.is(stdout, 'foobarfoobar');
};

test('stdin can be ["inherit", "pipe"]', testInheritStdin, ['inherit', 'pipe']);
test('stdin can be [0, "pipe"]', testInheritStdin, [0, 'pipe']);

const testInheritStdout = async (t, stdout) => {
	const result = await execa('nested-multiple-stdout.js', [JSON.stringify(stdout)]);
	t.is(result.stdout, 'foobar');
	t.is(result.stderr, 'nested foobar');
};

test('stdout can be ["inherit", "pipe"]', testInheritStdout, ['inherit', 'pipe']);
test('stdout can be [1, "pipe"]', testInheritStdout, [1, 'pipe']);

const testInheritStderr = async (t, stderr) => {
	const result = await execa('nested-multiple-stderr.js', [JSON.stringify(stderr)]);
	t.is(result.stdout, 'nested foobar');
	t.is(result.stderr, 'foobar');
};

test('stderr can be ["inherit", "pipe"]', testInheritStderr, ['inherit', 'pipe']);
test('stderr can be [2, "pipe"]', testInheritStderr, [2, 'pipe']);

const testOverflowStream = async (t, index, stdioOption) => {
	const {stdout} = await execa('nested.js', [JSON.stringify(getStdio(index, stdioOption)), 'empty.js'], fullStdio);
	t.is(stdout, '');
};

if (process.platform === 'linux') {
	test('stdin can use 4+', testOverflowStream, 0, 4);
	test('stdin can use [4+]', testOverflowStream, 0, [4]);
	test('stdout can use 4+', testOverflowStream, 1, 4);
	test('stdout can use [4+]', testOverflowStream, 1, [4]);
	test('stderr can use 4+', testOverflowStream, 2, 4);
	test('stderr can use [4+]', testOverflowStream, 2, [4]);
	test('stdio[*] can use 4+', testOverflowStream, 3, 4);
	test('stdio[*] can use [4+]', testOverflowStream, 3, [4]);
}

test('stdio[*] can use "inherit"', testOverflowStream, 3, 'inherit');
test('stdio[*] can use ["inherit"]', testOverflowStream, 3, ['inherit']);

const testOverflowStreamArray = (t, index, stdioOption) => {
	t.throws(() => {
		execa('empty.js', getStdio(index, stdioOption));
	}, {message: /no such standard stream/});
};

test('stdin cannot use 4+ and another value', testOverflowStreamArray, 0, [4, 'pipe']);
test('stdout cannot use 4+ and another value', testOverflowStreamArray, 1, [4, 'pipe']);
test('stderr cannot use 4+ and another value', testOverflowStreamArray, 2, [4, 'pipe']);
test('stdio[*] cannot use 4+ and another value', testOverflowStreamArray, 3, [4, 'pipe']);
test('stdio[*] cannot use "inherit" and another value', testOverflowStreamArray, 3, ['inherit', 'pipe']);

const testOverlapped = async (t, index) => {
	const {stdout} = await execa('noop.js', ['foobar'], getStdio(index, ['overlapped', 'pipe']));
	t.is(stdout, 'foobar');
};

test('stdin can be ["overlapped", "pipe"]', testOverlapped, 0);
test('stdout can be ["overlapped", "pipe"]', testOverlapped, 1);
test('stderr can be ["overlapped", "pipe"]', testOverlapped, 2);
test('stdio[*] can be ["overlapped", "pipe"]', testOverlapped, 3);

const testDestroyStandard = async (t, index) => {
	const childProcess = execa('forever.js', {...getStdio(index, [STANDARD_STREAMS[index], 'pipe']), timeout: 1});
	await t.throwsAsync(childProcess, {message: /timed out/});
	t.false(STANDARD_STREAMS[index].destroyed);
};

test('Does not destroy process.stdin on child process errors', testDestroyStandard, 0);
test('Does not destroy process.stdout on child process errors', testDestroyStandard, 1);
test('Does not destroy process.stderr on child process errors', testDestroyStandard, 2);

const testDestroyStandardSpawn = async (t, index) => {
	await t.throwsAsync(execa('forever.js', {...getStdio(index, [STANDARD_STREAMS[index], 'pipe']), uid: -1}));
	t.false(STANDARD_STREAMS[index].destroyed);
};

test('Does not destroy process.stdin on spawn process errors', testDestroyStandardSpawn, 0);
test('Does not destroy process.stdout on spawn process errors', testDestroyStandardSpawn, 1);
test('Does not destroy process.stderr on spawn process errors', testDestroyStandardSpawn, 2);

const testDestroyStandardStream = async (t, index) => {
	const childProcess = execa('forever.js', getStdio(index, [STANDARD_STREAMS[index], 'pipe']));
	const error = new Error('test');
	childProcess.stdio[index].destroy(error);
	const thrownError = await t.throwsAsync(childProcess);
	t.is(thrownError, error);
	t.false(STANDARD_STREAMS[index].destroyed);
};

test('Does not destroy process.stdin on stream process errors', testDestroyStandardStream, 0);
test('Does not destroy process.stdout on stream process errors', testDestroyStandardStream, 1);
test('Does not destroy process.stderr on stream process errors', testDestroyStandardStream, 2);
