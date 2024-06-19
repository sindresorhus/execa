import test from 'ava';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString, foobarUppercase} from '../helpers/input.js';
import {nestedSubprocess} from '../helpers/nested.js';
import {
	getOutputLine,
	testTimestamp,
	stdoutNoneOption,
	stdoutFullOption,
	stderrFullOption,
} from '../helpers/verbose.js';

setFixtureDirectory();

const testPrintOutputNoBuffer = async (t, verbose, buffer, isSync) => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {verbose, buffer, isSync});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
};

test('Prints stdout, buffer: false', testPrintOutputNoBuffer, 'full', false, false);
test('Prints stdout, buffer: false, fd-specific buffer', testPrintOutputNoBuffer, 'full', {stdout: false}, false);
test('Prints stdout, buffer: false, fd-specific verbose', testPrintOutputNoBuffer, stdoutFullOption, false, false);
test('Prints stdout, buffer: false, sync', testPrintOutputNoBuffer, 'full', false, true);
test('Prints stdout, buffer: false, fd-specific buffer, sync', testPrintOutputNoBuffer, 'full', {stdout: false}, true);
test('Prints stdout, buffer: false, fd-specific verbose, sync', testPrintOutputNoBuffer, stdoutFullOption, false, true);

const testPrintOutputNoBufferFalse = async (t, verbose, buffer, isSync) => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {verbose, buffer, isSync});
	t.is(getOutputLine(stderr), undefined);
};

test('Does not print stdout, buffer: false, fd-specific none', testPrintOutputNoBufferFalse, stdoutNoneOption, false, false);
test('Does not print stdout, buffer: false, different fd', testPrintOutputNoBufferFalse, stderrFullOption, false, false);
test('Does not print stdout, buffer: false, different fd, fd-specific buffer', testPrintOutputNoBufferFalse, stderrFullOption, {stdout: false}, false);
test('Does not print stdout, buffer: false, fd-specific none, sync', testPrintOutputNoBufferFalse, stdoutNoneOption, false, true);
test('Does not print stdout, buffer: false, different fd, sync', testPrintOutputNoBufferFalse, stderrFullOption, false, true);
test('Does not print stdout, buffer: false, different fd, fd-specific buffer, sync', testPrintOutputNoBufferFalse, stderrFullOption, {stdout: false}, true);

const testPrintOutputNoBufferTransform = async (t, buffer, isSync) => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {
		optionsFixture: 'generator-uppercase.js',
		verbose: 'full',
		buffer,
		isSync,
	});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarUppercase}`);
};

test('Prints stdout, buffer: false, transform', testPrintOutputNoBufferTransform, false, false);
test('Prints stdout, buffer: false, transform, fd-specific buffer', testPrintOutputNoBufferTransform, {stdout: false}, false);
test('Prints stdout, buffer: false, transform, sync', testPrintOutputNoBufferTransform, false, true);
test('Prints stdout, buffer: false, transform, fd-specific buffer, sync', testPrintOutputNoBufferTransform, {stdout: false}, true);
