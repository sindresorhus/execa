import {platform} from 'node:process';
import test from 'ava';
import {execa} from '../../index.js';
import {getStdio, fullStdio} from '../helpers/stdio.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';

setFixtureDir();

const testRedirect = async (t, stdioOption, fdNumber, isInput) => {
	const {fixtureName, ...options} = isInput
		? {fixtureName: 'stdin-fd.js', input: 'foobar'}
		: {fixtureName: 'noop-fd.js'};
	const {stdio} = await execa('nested-stdio.js', [JSON.stringify(stdioOption), `${fdNumber}`, fixtureName, 'foobar'], options);
	const resultFdNumber = isStderrDescriptor(stdioOption) ? 2 : 1;
	t.is(stdio[resultFdNumber], 'foobar');
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

const testOverflowStream = async (t, fdNumber, stdioOption) => {
	const {stdout} = await execa('nested.js', [JSON.stringify(getStdio(fdNumber, stdioOption)), 'empty.js'], fullStdio);
	t.is(stdout, '');
};

if (platform === 'linux') {
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

const testOverflowStreamArray = (t, fdNumber, stdioOption) => {
	t.throws(() => {
		execa('empty.js', getStdio(fdNumber, stdioOption));
	}, {message: /no such standard stream/});
};

test('stdin cannot use 4+ and another value', testOverflowStreamArray, 0, [4, 'pipe']);
test('stdout cannot use 4+ and another value', testOverflowStreamArray, 1, [4, 'pipe']);
test('stderr cannot use 4+ and another value', testOverflowStreamArray, 2, [4, 'pipe']);
test('stdio[*] cannot use 4+ and another value', testOverflowStreamArray, 3, [4, 'pipe']);
test('stdio[*] cannot use "inherit" and another value', testOverflowStreamArray, 3, ['inherit', 'pipe']);
