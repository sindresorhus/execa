import {readFile, rm} from 'node:fs/promises';
import test from 'ava';
import tempfile from 'tempfile';
import {execa} from '../../index.js';
import {getStdio, fullStdio} from '../helpers/stdio.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {parentExecaAsync, parentExecaSync} from '../helpers/nested.js';

setFixtureDirectory();

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
