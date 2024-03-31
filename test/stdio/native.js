import {readFile, rm} from 'node:fs/promises';
import {platform} from 'node:process';
import test from 'ava';
import tempfile from 'tempfile';
import {execa, execaSync} from '../../index.js';
import {getStdio, fullStdio} from '../helpers/stdio.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {foobarString} from '../helpers/input.js';
import {parentExecaAsync, parentExecaSync} from '../helpers/nested.js';

setFixtureDir();

const isLinux = platform === 'linux';
const isWindows = platform === 'win32';

// eslint-disable-next-line max-params
const testRedirect = async (t, stdioOption, fdNumber, isInput, isSync) => {
	const {fixtureName, ...options} = isInput
		? {fixtureName: 'stdin-fd.js', input: foobarString}
		: {fixtureName: 'noop-fd.js'};
	const {stdio} = await execa('nested-stdio.js', [JSON.stringify(stdioOption), `${fdNumber}`, `${isSync}`, fixtureName, foobarString], options);
	const resultFdNumber = isStderrDescriptor(stdioOption) ? 2 : 1;
	t.is(stdio[resultFdNumber], foobarString);
};

const isStderrDescriptor = stdioOption => stdioOption === 2
	|| stdioOption === 'stderr'
	|| (Array.isArray(stdioOption) && isStderrDescriptor(stdioOption[0]));

test.serial('stdio[*] can be 0', testRedirect, 0, 3, true, false);
test.serial('stdio[*] can be [0]', testRedirect, [0], 3, true, false);
test.serial('stdio[*] can be [0, "pipe"]', testRedirect, [0, 'pipe'], 3, true, false);
test.serial('stdio[*] can be process.stdin', testRedirect, 'stdin', 3, true, false);
test.serial('stdio[*] can be [process.stdin]', testRedirect, ['stdin'], 3, true, false);
test.serial('stdio[*] can be [process.stdin, "pipe"]', testRedirect, ['stdin', 'pipe'], 3, true, false);
test('stdout can be 2', testRedirect, 2, 1, false, false);
test('stdout can be [2]', testRedirect, [2], 1, false, false);
test('stdout can be [2, "pipe"]', testRedirect, [2, 'pipe'], 1, false, false);
test('stdout can be process.stderr', testRedirect, 'stderr', 1, false, false);
test('stdout can be [process.stderr]', testRedirect, ['stderr'], 1, false, false);
test('stdout can be [process.stderr, "pipe"]', testRedirect, ['stderr', 'pipe'], 1, false, false);
test('stderr can be 1', testRedirect, 1, 2, false, false);
test('stderr can be [1]', testRedirect, [1], 2, false, false);
test('stderr can be [1, "pipe"]', testRedirect, [1, 'pipe'], 2, false, false);
test('stderr can be process.stdout', testRedirect, 'stdout', 2, false, false);
test('stderr can be [process.stdout]', testRedirect, ['stdout'], 2, false, false);
test('stderr can be [process.stdout, "pipe"]', testRedirect, ['stdout', 'pipe'], 2, false, false);
test('stdio[*] can be 1', testRedirect, 1, 3, false, false);
test('stdio[*] can be [1]', testRedirect, [1], 3, false, false);
test('stdio[*] can be [1, "pipe"]', testRedirect, [1, 'pipe'], 3, false, false);
test('stdio[*] can be 2', testRedirect, 2, 3, false, false);
test('stdio[*] can be [2]', testRedirect, [2], 3, false, false);
test('stdio[*] can be [2, "pipe"]', testRedirect, [2, 'pipe'], 3, false, false);
test('stdio[*] can be process.stdout', testRedirect, 'stdout', 3, false, false);
test('stdio[*] can be [process.stdout]', testRedirect, ['stdout'], 3, false, false);
test('stdio[*] can be [process.stdout, "pipe"]', testRedirect, ['stdout', 'pipe'], 3, false, false);
test('stdio[*] can be process.stderr', testRedirect, 'stderr', 3, false, false);
test('stdio[*] can be [process.stderr]', testRedirect, ['stderr'], 3, false, false);
test('stdio[*] can be [process.stderr, "pipe"]', testRedirect, ['stderr', 'pipe'], 3, false, false);
test('stdout can be 2, sync', testRedirect, 2, 1, false, true);
test('stdout can be [2], sync', testRedirect, [2], 1, false, true);
test('stdout can be [2, "pipe"], sync', testRedirect, [2, 'pipe'], 1, false, true);
test('stdout can be process.stderr, sync', testRedirect, 'stderr', 1, false, true);
test('stdout can be [process.stderr], sync', testRedirect, ['stderr'], 1, false, true);
test('stdout can be [process.stderr, "pipe"], sync', testRedirect, ['stderr', 'pipe'], 1, false, true);
test('stderr can be 1, sync', testRedirect, 1, 2, false, true);
test('stderr can be [1], sync', testRedirect, [1], 2, false, true);
test('stderr can be [1, "pipe"], sync', testRedirect, [1, 'pipe'], 2, false, true);
test('stderr can be process.stdout, sync', testRedirect, 'stdout', 2, false, true);
test('stderr can be [process.stdout], sync', testRedirect, ['stdout'], 2, false, true);
test('stderr can be [process.stdout, "pipe"], sync', testRedirect, ['stdout', 'pipe'], 2, false, true);
test('stdio[*] can be 1, sync', testRedirect, 1, 3, false, true);
test('stdio[*] can be [1], sync', testRedirect, [1], 3, false, true);
test('stdio[*] can be [1, "pipe"], sync', testRedirect, [1, 'pipe'], 3, false, true);
test('stdio[*] can be 2, sync', testRedirect, 2, 3, false, true);
test('stdio[*] can be [2], sync', testRedirect, [2], 3, false, true);
test('stdio[*] can be [2, "pipe"], sync', testRedirect, [2, 'pipe'], 3, false, true);
test('stdio[*] can be process.stdout, sync', testRedirect, 'stdout', 3, false, true);
test('stdio[*] can be [process.stdout], sync', testRedirect, ['stdout'], 3, false, true);
test('stdio[*] can be [process.stdout, "pipe"], sync', testRedirect, ['stdout', 'pipe'], 3, false, true);
test('stdio[*] can be process.stderr, sync', testRedirect, 'stderr', 3, false, true);
test('stdio[*] can be [process.stderr], sync', testRedirect, ['stderr'], 3, false, true);
test('stdio[*] can be [process.stderr, "pipe"], sync', testRedirect, ['stderr', 'pipe'], 3, false, true);

const testInheritStdin = async (t, stdioOption, isSync) => {
	const {stdout} = await execa('nested-multiple-stdin.js', [JSON.stringify(stdioOption), `${isSync}`], {input: foobarString});
	t.is(stdout, `${foobarString}${foobarString}`);
};

test('stdin can be ["inherit", "pipe"]', testInheritStdin, ['inherit', 'pipe'], false);
test('stdin can be [0, "pipe"]', testInheritStdin, [0, 'pipe'], false);
test('stdin can be [process.stdin, "pipe"]', testInheritStdin, ['stdin', 'pipe'], false);
test.serial('stdin can be ["inherit", "pipe"], sync', testInheritStdin, ['inherit', 'pipe'], true);
test.serial('stdin can be [0, "pipe"], sync', testInheritStdin, [0, 'pipe'], true);
test.serial('stdin can be [process.stdin, "pipe"], sync', testInheritStdin, ['stdin', 'pipe'], true);

// eslint-disable-next-line max-params
const testInheritStdioOutput = async (t, fdNumber, outerFdNumber, stdioOption, isSync, encoding) => {
	const {stdio} = await execa('nested-multiple-stdio-output.js', [JSON.stringify(stdioOption), `${fdNumber}`, `${outerFdNumber}`, `${isSync}`, encoding], fullStdio);
	t.is(stdio[fdNumber], foobarString);
	t.is(stdio[outerFdNumber], `nested ${foobarString}`);
};

test('stdout can be ["inherit", "pipe"]', testInheritStdioOutput, 1, 2, ['inherit', 'pipe'], false, 'utf8');
test('stdout can be [1, "pipe"]', testInheritStdioOutput, 1, 2, [1, 'pipe'], false, 'utf8');
test('stdout can be [process.stdout, "pipe"]', testInheritStdioOutput, 1, 2, ['stdout', 'pipe'], false, 'utf8');
test('stderr can be ["inherit", "pipe"]', testInheritStdioOutput, 2, 1, ['inherit', 'pipe'], false, 'utf8');
test('stderr can be [2, "pipe"]', testInheritStdioOutput, 2, 1, [2, 'pipe'], false, 'utf8');
test('stderr can be [process.stderr, "pipe"]', testInheritStdioOutput, 2, 1, ['stderr', 'pipe'], false, 'utf8');
test('stdout can be ["inherit", "pipe"], encoding "buffer"', testInheritStdioOutput, 1, 2, ['inherit', 'pipe'], false, 'buffer');
test('stdout can be [1, "pipe"], encoding "buffer"', testInheritStdioOutput, 1, 2, [1, 'pipe'], false, 'buffer');
test('stdout can be [process.stdout, "pipe"], encoding "buffer"', testInheritStdioOutput, 1, 2, ['stdout', 'pipe'], false, 'buffer');
test('stderr can be ["inherit", "pipe"], encoding "buffer"', testInheritStdioOutput, 2, 1, ['inherit', 'pipe'], false, 'buffer');
test('stderr can be [2, "pipe"], encoding "buffer"', testInheritStdioOutput, 2, 1, [2, 'pipe'], false, 'buffer');
test('stderr can be [process.stderr, "pipe"], encoding "buffer"', testInheritStdioOutput, 2, 1, ['stderr', 'pipe'], false, 'buffer');
test('stdout can be ["inherit", "pipe"], sync', testInheritStdioOutput, 1, 2, ['inherit', 'pipe'], true, 'utf8');
test('stdout can be [1, "pipe"], sync', testInheritStdioOutput, 1, 2, [1, 'pipe'], true, 'utf8');
test('stdout can be [process.stdout, "pipe"], sync', testInheritStdioOutput, 1, 2, ['stdout', 'pipe'], true, 'utf8');
test('stderr can be ["inherit", "pipe"], sync', testInheritStdioOutput, 2, 1, ['inherit', 'pipe'], true, 'utf8');
test('stderr can be [2, "pipe"], sync', testInheritStdioOutput, 2, 1, [2, 'pipe'], true, 'utf8');
test('stderr can be [process.stderr, "pipe"], sync', testInheritStdioOutput, 2, 1, ['stderr', 'pipe'], true, 'utf8');
test('stdio[*] output can be ["inherit", "pipe"], sync', testInheritStdioOutput, 3, 1, ['inherit', 'pipe'], true, 'utf8');
test('stdio[*] output can be [3, "pipe"], sync', testInheritStdioOutput, 3, 1, [3, 'pipe'], true, 'utf8');
test('stdout can be ["inherit", "pipe"], encoding "buffer", sync', testInheritStdioOutput, 1, 2, ['inherit', 'pipe'], true, 'buffer');
test('stdout can be [1, "pipe"], encoding "buffer", sync', testInheritStdioOutput, 1, 2, [1, 'pipe'], true, 'buffer');
test('stdout can be [process.stdout, "pipe"], encoding "buffer", sync', testInheritStdioOutput, 1, 2, ['stdout', 'pipe'], true, 'buffer');
test('stderr can be ["inherit", "pipe"], encoding "buffer", sync', testInheritStdioOutput, 2, 1, ['inherit', 'pipe'], true, 'buffer');
test('stderr can be [2, "pipe"], encoding "buffer", sync', testInheritStdioOutput, 2, 1, [2, 'pipe'], true, 'buffer');
test('stderr can be [process.stderr, "pipe"], encoding "buffer", sync', testInheritStdioOutput, 2, 1, ['stderr', 'pipe'], true, 'buffer');
test('stdio[*] output can be ["inherit", "pipe"], encoding "buffer", sync', testInheritStdioOutput, 3, 1, ['inherit', 'pipe'], true, 'buffer');
test('stdio[*] output can be [3, "pipe"], encoding "buffer", sync', testInheritStdioOutput, 3, 1, [3, 'pipe'], true, 'buffer');

const testFd3InheritOutput = async (t, stdioOption, execaMethod) => {
	const {stdio} = await execaMethod('noop-fd.js', ['3', foobarString], getStdio(3, stdioOption), fullStdio);
	t.is(stdio[3], foobarString);
};

test('stdio[*] output can use "inherit"', testFd3InheritOutput, 'inherit', parentExecaAsync);
test('stdio[*] output can use ["inherit"]', testFd3InheritOutput, ['inherit'], parentExecaAsync);
test('stdio[*] output can use "inherit", sync', testFd3InheritOutput, 'inherit', parentExecaSync);
test('stdio[*] output can use ["inherit"], sync', testFd3InheritOutput, ['inherit'], parentExecaSync);

const testInheritNoBuffer = async (t, stdioOption, execaMethod) => {
	const filePath = tempfile();
	await execaMethod('nested-write.js', [filePath, foobarString], {stdin: stdioOption, buffer: false}, {input: foobarString});
	t.is(await readFile(filePath, 'utf8'), `${foobarString} ${foobarString}`);
	await rm(filePath);
};

test('stdin can be ["inherit", "pipe"], buffer: false', testInheritNoBuffer, ['inherit', 'pipe'], parentExecaAsync);
test('stdin can be [0, "pipe"], buffer: false', testInheritNoBuffer, [0, 'pipe'], parentExecaAsync);
test.serial('stdin can be ["inherit", "pipe"], buffer: false, sync', testInheritNoBuffer, ['inherit', 'pipe'], parentExecaSync);
test.serial('stdin can be [0, "pipe"], buffer: false, sync', testInheritNoBuffer, [0, 'pipe'], parentExecaSync);

if (isLinux) {
	const testOverflowStream = async (t, fdNumber, stdioOption, execaMethod) => {
		const {stdout} = await execaMethod('empty.js', getStdio(fdNumber, stdioOption), fullStdio);
		t.is(stdout, '');
	};

	test('stdin can use 4+', testOverflowStream, 0, 4, parentExecaAsync);
	test('stdin can use [4+]', testOverflowStream, 0, [4], parentExecaAsync);
	test('stdout can use 4+', testOverflowStream, 1, 4, parentExecaAsync);
	test('stdout can use [4+]', testOverflowStream, 1, [4], parentExecaAsync);
	test('stderr can use 4+', testOverflowStream, 2, 4, parentExecaAsync);
	test('stderr can use [4+]', testOverflowStream, 2, [4], parentExecaAsync);
	test('stdio[*] can use 4+', testOverflowStream, 3, 4, parentExecaAsync);
	test('stdio[*] can use [4+]', testOverflowStream, 3, [4], parentExecaAsync);
	test('stdin can use 4+, sync', testOverflowStream, 0, 4, parentExecaSync);
	test('stdin can use [4+], sync', testOverflowStream, 0, [4], parentExecaSync);
	test('stdout can use 4+, sync', testOverflowStream, 1, 4, parentExecaSync);
	test('stdout can use [4+], sync', testOverflowStream, 1, [4], parentExecaSync);
	test('stderr can use 4+, sync', testOverflowStream, 2, 4, parentExecaSync);
	test('stderr can use [4+], sync', testOverflowStream, 2, [4], parentExecaSync);
	test('stdio[*] can use 4+, sync', testOverflowStream, 3, 4, parentExecaSync);
	test('stdio[*] can use [4+], sync', testOverflowStream, 3, [4], parentExecaSync);
}

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

const getInvalidFdCode = () => {
	if (isLinux) {
		return 'EINVAL';
	}

	return isWindows ? 'EBADF' : 'ENXIO';
};

const testOverflowStreamArraySync = (t, fdNumber) => {
	t.throws(() => {
		execaSync('noop-fd.js', [fdNumber, foobarString], getStdio(fdNumber, [4, 'pipe']));
	}, {code: getInvalidFdCode()});
};

test('stdout cannot use 4+ and another value, sync', testOverflowStreamArraySync, 1);
test('stderr cannot use 4+ and another value, sync', testOverflowStreamArraySync, 2);
test('stdio[*] cannot use 4+ and another value, sync', testOverflowStreamArraySync, 3);

test('stdin can use ["inherit", "pipe"] in a TTY', async t => {
	const stdioOption = [['inherit', 'pipe'], 'inherit', 'pipe'];
	const {stdout} = await execa('nested-sync-tty.js', [JSON.stringify({stdio: stdioOption}), 'false', 'stdin-fd.js', '0'], {input: foobarString});
	t.is(stdout, foobarString);
});

const testNoTtyInput = async (t, fdNumber, optionName) => {
	const stdioOption = ['pipe', 'inherit', 'pipe'];
	stdioOption[fdNumber] = [[''], 'inherit', 'pipe'];
	const {message} = await t.throwsAsync(execa('nested-sync-tty.js', [JSON.stringify({stdio: stdioOption}), 'true', 'stdin-fd.js', `${fdNumber}`], fullStdio));
	t.true(message.includes(`The \`${optionName}: 'inherit'\` option is invalid: it cannot be a TTY`));
};

test('stdin cannot use ["inherit", "pipe"] in a TTY, sync', testNoTtyInput, 0, 'stdin');
test('stdio[*] input cannot use ["inherit", "pipe"] in a TTY, sync', testNoTtyInput, 3, 'stdio[3]');

const testTtyOutput = async (t, fdNumber, isSync) => {
	const {stdio} = await execa('nested-sync-tty.js', [JSON.stringify(getStdio(fdNumber, ['inherit', 'pipe'])), `${isSync}`, 'noop-fd.js', `${fdNumber}`, foobarString], fullStdio);
	t.is(stdio[fdNumber], foobarString);
};

test('stdout can use ["inherit", "pipe"] in a TTY', testTtyOutput, 1, false);
test('stderr can use ["inherit", "pipe"] in a TTY', testTtyOutput, 2, false);
test('stdout can use ["inherit", "pipe"] in a TTY, sync', testTtyOutput, 1, true);
test('stderr can use ["inherit", "pipe"] in a TTY, sync', testTtyOutput, 2, true);
test('stdio[*] output can use ["inherit", "pipe"] in a TTY, sync', testTtyOutput, 3, true);
