import {readFile, writeFile, rm} from 'node:fs/promises';
import process from 'node:process';
import test from 'ava';
import tempfile from 'tempfile';
import {execa, execaSync} from '../../index.js';
import {getStdinOption, getStdoutOption, getStderrOption, getStdioOption} from '../helpers/stdio.js';
import {stringGenerator} from '../helpers/generator.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';

setFixtureDir();

const testEmptyArray = (t, getOptions, optionName, execaMethod) => {
	t.throws(() => {
		execaMethod('noop.js', getOptions([]));
	}, {message: `The \`${optionName}\` option must not be an empty array.`});
};

test('Cannot pass an empty array to stdin', testEmptyArray, getStdinOption, 'stdin', execa);
test('Cannot pass an empty array to stdout', testEmptyArray, getStdoutOption, 'stdout', execa);
test('Cannot pass an empty array to stderr', testEmptyArray, getStderrOption, 'stderr', execa);
test('Cannot pass an empty array to stdio[*]', testEmptyArray, getStdioOption, 'stdio[3]', execa);
test('Cannot pass an empty array to stdin - sync', testEmptyArray, getStdinOption, 'stdin', execaSync);
test('Cannot pass an empty array to stdout - sync', testEmptyArray, getStdoutOption, 'stdout', execaSync);
test('Cannot pass an empty array to stderr - sync', testEmptyArray, getStderrOption, 'stderr', execaSync);
test('Cannot pass an empty array to stdio[*] - sync', testEmptyArray, getStdioOption, 'stdio[3]', execaSync);

const testNoPipeOption = async (t, stdioOption, streamName) => {
	const childProcess = execa('empty.js', {[streamName]: stdioOption});
	t.is(childProcess[streamName], null);
	await childProcess;
};

test('stdin can be "ignore"', testNoPipeOption, 'ignore', 'stdin');
test('stdin can be ["ignore"]', testNoPipeOption, ['ignore'], 'stdin');
test('stdin can be ["ignore", "ignore"]', testNoPipeOption, ['ignore', 'ignore'], 'stdin');
test('stdin can be "ipc"', testNoPipeOption, 'ipc', 'stdin');
test('stdin can be ["ipc"]', testNoPipeOption, ['ipc'], 'stdin');
test('stdin can be "inherit"', testNoPipeOption, 'inherit', 'stdin');
test('stdin can be ["inherit"]', testNoPipeOption, ['inherit'], 'stdin');
test('stdin can be 0', testNoPipeOption, 0, 'stdin');
test('stdin can be [0]', testNoPipeOption, [0], 'stdin');
test('stdout can be "ignore"', testNoPipeOption, 'ignore', 'stdout');
test('stdout can be ["ignore"]', testNoPipeOption, ['ignore'], 'stdout');
test('stdout can be ["ignore", "ignore"]', testNoPipeOption, ['ignore', 'ignore'], 'stdout');
test('stdout can be "ipc"', testNoPipeOption, 'ipc', 'stdout');
test('stdout can be ["ipc"]', testNoPipeOption, ['ipc'], 'stdout');
test('stdout can be "inherit"', testNoPipeOption, 'inherit', 'stdout');
test('stdout can be ["inherit"]', testNoPipeOption, ['inherit'], 'stdout');
test('stdout can be 1', testNoPipeOption, 1, 'stdout');
test('stdout can be [1]', testNoPipeOption, [1], 'stdout');
test('stderr can be "ignore"', testNoPipeOption, 'ignore', 'stderr');
test('stderr can be ["ignore"]', testNoPipeOption, ['ignore'], 'stderr');
test('stderr can be ["ignore", "ignore"]', testNoPipeOption, ['ignore', 'ignore'], 'stderr');
test('stderr can be "ipc"', testNoPipeOption, 'ipc', 'stderr');
test('stderr can be ["ipc"]', testNoPipeOption, ['ipc'], 'stderr');
test('stderr can be "inherit"', testNoPipeOption, 'inherit', 'stderr');
test('stderr can be ["inherit"]', testNoPipeOption, ['inherit'], 'stderr');
test('stderr can be 2', testNoPipeOption, 2, 'stderr');
test('stderr can be [2]', testNoPipeOption, [2], 'stderr');

const testNoPipeStdioOption = async (t, stdioOption) => {
	const childProcess = execa('empty.js', {stdio: ['pipe', 'pipe', 'pipe', stdioOption]});
	t.is(childProcess.stdio[3], null);
	await childProcess;
};

test('stdio[*] can be "ignore"', testNoPipeStdioOption, 'ignore');
test('stdio[*] can be ["ignore"]', testNoPipeStdioOption, ['ignore']);
test('stdio[*] can be ["ignore", "ignore"]', testNoPipeStdioOption, ['ignore', 'ignore']);
test('stdio[*] can be "ipc"', testNoPipeStdioOption, 'ipc');
test('stdio[*] can be ["ipc"]', testNoPipeStdioOption, ['ipc']);
test('stdio[*] can be "inherit"', testNoPipeStdioOption, 'inherit');
test('stdio[*] can be ["inherit"]', testNoPipeStdioOption, ['inherit']);
test('stdio[*] can be 3', testNoPipeStdioOption, 3);
test('stdio[*] can be [3]', testNoPipeStdioOption, [3]);

const testInvalidArrayValue = (t, invalidStdio, getOptions, execaMethod) => {
	t.throws(() => {
		execaMethod('noop.js', getOptions(['pipe', invalidStdio]));
	}, {message: /must not include/});
};

test('Cannot pass "ignore" and another value to stdin', testInvalidArrayValue, 'ignore', getStdinOption, execa);
test('Cannot pass "ignore" and another value to stdout', testInvalidArrayValue, 'ignore', getStdoutOption, execa);
test('Cannot pass "ignore" and another value to stderr', testInvalidArrayValue, 'ignore', getStderrOption, execa);
test('Cannot pass "ignore" and another value to stdio[*]', testInvalidArrayValue, 'ignore', getStdioOption, execa);
test('Cannot pass "ignore" and another value to stdin - sync', testInvalidArrayValue, 'ignore', getStdinOption, execaSync);
test('Cannot pass "ignore" and another value to stdout - sync', testInvalidArrayValue, 'ignore', getStdoutOption, execaSync);
test('Cannot pass "ignore" and another value to stderr - sync', testInvalidArrayValue, 'ignore', getStderrOption, execaSync);
test('Cannot pass "ignore" and another value to stdio[*] - sync', testInvalidArrayValue, 'ignore', getStdioOption, execaSync);
test('Cannot pass "ipc" and another value to stdin', testInvalidArrayValue, 'ipc', getStdinOption, execa);
test('Cannot pass "ipc" and another value to stdout', testInvalidArrayValue, 'ipc', getStdoutOption, execa);
test('Cannot pass "ipc" and another value to stderr', testInvalidArrayValue, 'ipc', getStderrOption, execa);
test('Cannot pass "ipc" and another value to stdio[*]', testInvalidArrayValue, 'ipc', getStdioOption, execa);
test('Cannot pass "ipc" and another value to stdin - sync', testInvalidArrayValue, 'ipc', getStdinOption, execaSync);
test('Cannot pass "ipc" and another value to stdout - sync', testInvalidArrayValue, 'ipc', getStdoutOption, execaSync);
test('Cannot pass "ipc" and another value to stderr - sync', testInvalidArrayValue, 'ipc', getStderrOption, execaSync);
test('Cannot pass "ipc" and another value to stdio[*] - sync', testInvalidArrayValue, 'ipc', getStdioOption, execaSync);

const testInputOutput = (t, stdioOption, execaMethod) => {
	t.throws(() => {
		execaMethod('noop.js', getStdioOption([new ReadableStream(), stdioOption]));
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
	await execaMethod('noop-fd3.js', ['foobar'], getStdioOption([{file: filePathOne}, {file: filePathTwo}]));
	t.deepEqual(await Promise.all([readFile(filePathOne, 'utf8'), readFile(filePathTwo, 'utf8')]), ['foobar\n', 'foobar\n']);
	await Promise.all([rm(filePathOne), rm(filePathTwo)]);
};

test('stdio[*] default direction is output', testAmbiguousDirection, execa);
test('stdio[*] default direction is output - sync', testAmbiguousDirection, execaSync);

const testAmbiguousMultiple = async (t, fixtureName, getOptions) => {
	const filePath = tempfile();
	await writeFile(filePath, 'foobar');
	const {stdout} = await execa(fixtureName, getOptions([{file: filePath}, stringGenerator()]));
	t.is(stdout, 'foobarfoobar');
	await rm(filePath);
};

test('stdin ambiguous direction is influenced by other values', testAmbiguousMultiple, 'stdin.js', getStdinOption);
test('stdio[*] ambiguous direction is influenced by other values', testAmbiguousMultiple, 'stdin-fd3.js', getStdioOption);

const testRedirectInput = async (t, stdioOption, index, fixtureName) => {
	const {stdout} = await execa('nested-stdio.js', [JSON.stringify(stdioOption), String(index), fixtureName], {input: 'foobar'});
	t.is(stdout, 'foobar');
};

test.serial('stdio[*] can be 0', testRedirectInput, 0, 3, 'stdin-fd3.js');
test.serial('stdio[*] can be [0]', testRedirectInput, [0], 3, 'stdin-fd3.js');
test.serial('stdio[*] can be [0, "pipe"]', testRedirectInput, [0, 'pipe'], 3, 'stdin-fd3.js');
test.serial('stdio[*] can be process.stdin', testRedirectInput, 'stdin', 3, 'stdin-fd3.js');
test.serial('stdio[*] can be [process.stdin]', testRedirectInput, ['stdin'], 3, 'stdin-fd3.js');
test.serial('stdio[*] can be [process.stdin, "pipe"]', testRedirectInput, ['stdin', 'pipe'], 3, 'stdin-fd3.js');

const OUTPUT_DESCRIPTOR_FIXTURES = ['noop.js', 'noop-err.js', 'noop-fd3.js'];

const isStdoutDescriptor = stdioOption => stdioOption === 1
	|| stdioOption === 'stdout'
	|| (Array.isArray(stdioOption) && isStdoutDescriptor(stdioOption[0]));

const testRedirectOutput = async (t, stdioOption, index) => {
	const fixtureName = OUTPUT_DESCRIPTOR_FIXTURES[index - 1];
	const result = await execa('nested-stdio.js', [JSON.stringify(stdioOption), String(index), fixtureName, 'foobar']);
	const streamName = isStdoutDescriptor(stdioOption) ? 'stdout' : 'stderr';
	t.is(result[streamName], 'foobar');
};

test('stdout can be 2', testRedirectOutput, 2, 1);
test('stdout can be [2]', testRedirectOutput, [2], 1);
test('stdout can be [2, "pipe"]', testRedirectOutput, [2, 'pipe'], 1);
test('stdout can be process.stderr', testRedirectOutput, 'stderr', 1);
test('stdout can be [process.stderr]', testRedirectOutput, ['stderr'], 1);
test('stdout can be [process.stderr, "pipe"]', testRedirectOutput, ['stderr', 'pipe'], 1);
test('stderr can be 1', testRedirectOutput, 1, 2);
test('stderr can be [1]', testRedirectOutput, [1], 2);
test('stderr can be [1, "pipe"]', testRedirectOutput, [1, 'pipe'], 2);
test('stderr can be process.stdout', testRedirectOutput, 'stdout', 2);
test('stderr can be [process.stdout]', testRedirectOutput, ['stdout'], 2);
test('stderr can be [process.stdout, "pipe"]', testRedirectOutput, ['stdout', 'pipe'], 2);
test('stdio[*] can be 1', testRedirectOutput, 1, 3);
test('stdio[*] can be [1]', testRedirectOutput, [1], 3);
test('stdio[*] can be [1, "pipe"]', testRedirectOutput, [1, 'pipe'], 3);
test('stdio[*] can be 2', testRedirectOutput, 2, 3);
test('stdio[*] can be [2]', testRedirectOutput, [2], 3);
test('stdio[*] can be [2, "pipe"]', testRedirectOutput, [2, 'pipe'], 3);
test('stdio[*] can be process.stdout', testRedirectOutput, 'stdout', 3);
test('stdio[*] can be [process.stdout]', testRedirectOutput, ['stdout'], 3);
test('stdio[*] can be [process.stdout, "pipe"]', testRedirectOutput, ['stdout', 'pipe'], 3);
test('stdio[*] can be process.stderr', testRedirectOutput, 'stderr', 3);
test('stdio[*] can be [process.stderr]', testRedirectOutput, ['stderr'], 3);
test('stdio[*] can be [process.stderr, "pipe"]', testRedirectOutput, ['stderr', 'pipe'], 3);

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

const testOverflowStream = async (t, stdio) => {
	const {stdout} = await execa('nested.js', [JSON.stringify({stdio}), 'empty.js'], {stdio: ['pipe', 'pipe', 'pipe', 'pipe']});
	t.is(stdout, '');
};

if (process.platform === 'linux') {
	test('stdin can use 4+', testOverflowStream, [4, 'pipe', 'pipe', 'pipe']);
	test('stdin can use [4+]', testOverflowStream, [[4], 'pipe', 'pipe', 'pipe']);
	test('stdout can use 4+', testOverflowStream, ['pipe', 4, 'pipe', 'pipe']);
	test('stdout can use [4+]', testOverflowStream, ['pipe', [4], 'pipe', 'pipe']);
	test('stderr can use 4+', testOverflowStream, ['pipe', 'pipe', 4, 'pipe']);
	test('stderr can use [4+]', testOverflowStream, ['pipe', 'pipe', [4], 'pipe']);
	test('stdio[*] can use 4+', testOverflowStream, ['pipe', 'pipe', 'pipe', 4]);
	test('stdio[*] can use [4+]', testOverflowStream, ['pipe', 'pipe', 'pipe', [4]]);
}

test('stdio[*] can use "inherit"', testOverflowStream, ['pipe', 'pipe', 'pipe', 'inherit']);
test('stdio[*] can use ["inherit"]', testOverflowStream, ['pipe', 'pipe', 'pipe', ['inherit']]);

const testOverflowStreamArray = (t, stdio) => {
	t.throws(() => {
		execa('noop.js', {stdio});
	}, {message: /no such standard stream/});
};

test('stdin cannot use 4+ and another value', testOverflowStreamArray, [[4, 'pipe'], 'pipe', 'pipe', 'pipe']);
test('stdout cannot use 4+ and another value', testOverflowStreamArray, ['pipe', [4, 'pipe'], 'pipe', 'pipe']);
test('stderr cannot use 4+ and another value', testOverflowStreamArray, ['pipe', 'pipe', [4, 'pipe'], 'pipe']);
test('stdio[*] cannot use 4+ and another value', testOverflowStreamArray, ['pipe', 'pipe', 'pipe', [4, 'pipe']]);
test('stdio[*] cannot use "inherit" and another value', testOverflowStreamArray, ['pipe', 'pipe', 'pipe', ['inherit', 'pipe']]);

const testOverlapped = async (t, getOptions) => {
	const {stdout} = await execa('noop.js', ['foobar'], getOptions(['overlapped', 'pipe']));
	t.is(stdout, 'foobar');
};

test('stdin can be ["overlapped", "pipe"]', testOverlapped, getStdinOption);
test('stdout can be ["overlapped", "pipe"]', testOverlapped, getStdoutOption);
test('stderr can be ["overlapped", "pipe"]', testOverlapped, getStderrOption);
test('stdio[*] can be ["overlapped", "pipe"]', testOverlapped, getStdioOption);

const testDestroyStandard = async (t, optionName) => {
	await t.throwsAsync(
		execa('forever.js', {timeout: 1, [optionName]: [process[optionName], 'pipe']}),
		{message: /timed out/},
	);
	t.false(process[optionName].destroyed);
};

test('Does not destroy process.stdin on errors', testDestroyStandard, 'stdin');
test('Does not destroy process.stdout on errors', testDestroyStandard, 'stdout');
test('Does not destroy process.stderr on errors', testDestroyStandard, 'stderr');
