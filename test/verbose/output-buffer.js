import test from 'ava';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarUppercase} from '../helpers/input.js';
import {parentExeca, parentExecaAsync, parentExecaSync} from '../helpers/nested.js';
import {
	getOutputLine,
	testTimestamp,
	stdoutNoneOption,
	stdoutFullOption,
	stderrFullOption,
} from '../helpers/verbose.js';

setFixtureDirectory();

const testPrintOutputNoBuffer = async (t, verbose, buffer, execaMethod) => {
	const {stderr} = await execaMethod('noop.js', [foobarString], {verbose, buffer});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
};

test('Prints stdout, buffer: false', testPrintOutputNoBuffer, 'full', false, parentExecaAsync);
test('Prints stdout, buffer: false, fd-specific buffer', testPrintOutputNoBuffer, 'full', {stdout: false}, parentExecaAsync);
test('Prints stdout, buffer: false, fd-specific verbose', testPrintOutputNoBuffer, stdoutFullOption, false, parentExecaAsync);
test('Prints stdout, buffer: false, sync', testPrintOutputNoBuffer, 'full', false, parentExecaSync);
test('Prints stdout, buffer: false, fd-specific buffer, sync', testPrintOutputNoBuffer, 'full', {stdout: false}, parentExecaSync);
test('Prints stdout, buffer: false, fd-specific verbose, sync', testPrintOutputNoBuffer, stdoutFullOption, false, parentExecaSync);

const testPrintOutputNoBufferFalse = async (t, verbose, buffer, execaMethod) => {
	const {stderr} = await execaMethod('noop.js', [foobarString], {verbose, buffer});
	t.is(getOutputLine(stderr), undefined);
};

test('Does not print stdout, buffer: false, fd-specific none', testPrintOutputNoBufferFalse, stdoutNoneOption, false, parentExecaAsync);
test('Does not print stdout, buffer: false, different fd', testPrintOutputNoBufferFalse, stderrFullOption, false, parentExecaAsync);
test('Does not print stdout, buffer: false, different fd, fd-specific buffer', testPrintOutputNoBufferFalse, stderrFullOption, {stdout: false}, parentExecaAsync);
test('Does not print stdout, buffer: false, fd-specific none, sync', testPrintOutputNoBufferFalse, stdoutNoneOption, false, parentExecaSync);
test('Does not print stdout, buffer: false, different fd, sync', testPrintOutputNoBufferFalse, stderrFullOption, false, parentExecaSync);
test('Does not print stdout, buffer: false, different fd, fd-specific buffer, sync', testPrintOutputNoBufferFalse, stderrFullOption, {stdout: false}, parentExecaSync);

const testPrintOutputNoBufferTransform = async (t, buffer, isSync) => {
	const {stderr} = await parentExeca('nested-transform.js', 'noop.js', [foobarString], {
		verbose: 'full',
		buffer,
		type: 'generator',
		isSync,
	});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarUppercase}`);
};

test('Prints stdout, buffer: false, transform', testPrintOutputNoBufferTransform, false, false);
test('Prints stdout, buffer: false, transform, fd-specific buffer', testPrintOutputNoBufferTransform, {stdout: false}, false);
test('Prints stdout, buffer: false, transform, sync', testPrintOutputNoBufferTransform, false, true);
test('Prints stdout, buffer: false, transform, fd-specific buffer, sync', testPrintOutputNoBufferTransform, {stdout: false}, true);
