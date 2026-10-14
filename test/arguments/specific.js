import assert from 'node:assert/strict';
import test from 'node:test';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';

setFixtureDirectory();

const testPriorityOrder = async (buffer, bufferStdout, bufferStderr, execaMethod) => {
	const {stdout, stderr} = await execaMethod('noop-both.js', {buffer});
	assert.equal(stdout, bufferStdout ? foobarString : undefined);
	assert.equal(stderr, bufferStderr ? foobarString : undefined);
};

test('buffer: {stdout, fd1}', () => testPriorityOrder({stdout: true, fd1: false}, true, true, execa));
test('buffer: {stdout, all}', () => testPriorityOrder({stdout: true, all: false}, true, false, execa));
test('buffer: {fd1, all}', () => testPriorityOrder({fd1: true, all: false}, true, false, execa));
test('buffer: {stderr, fd2}', () => testPriorityOrder({stderr: true, fd2: false}, true, true, execa));
test('buffer: {stderr, all}', () => testPriorityOrder({stderr: true, all: false}, false, true, execa));
test('buffer: {fd2, all}', () => testPriorityOrder({fd2: true, all: false}, false, true, execa));
test('buffer: {fd1, stdout}', () => testPriorityOrder({fd1: false, stdout: true}, true, true, execa));
test('buffer: {all, stdout}', () => testPriorityOrder({all: false, stdout: true}, true, false, execa));
test('buffer: {all, fd1}', () => testPriorityOrder({all: false, fd1: true}, true, false, execa));
test('buffer: {fd2, stderr}', () => testPriorityOrder({fd2: false, stderr: true}, true, true, execa));
test('buffer: {all, stderr}', () => testPriorityOrder({all: false, stderr: true}, false, true, execa));
test('buffer: {all, fd2}', () => testPriorityOrder({all: false, fd2: true}, false, true, execa));
test('buffer: {stdout, fd1}, sync', () => testPriorityOrder({stdout: true, fd1: false}, true, true, execaSync));
test('buffer: {stdout, all}, sync', () => testPriorityOrder({stdout: true, all: false}, true, false, execaSync));
test('buffer: {fd1, all}, sync', () => testPriorityOrder({fd1: true, all: false}, true, false, execaSync));
test('buffer: {stderr, fd2}, sync', () => testPriorityOrder({stderr: true, fd2: false}, true, true, execaSync));
test('buffer: {stderr, all}, sync', () => testPriorityOrder({stderr: true, all: false}, false, true, execaSync));
test('buffer: {fd2, all}, sync', () => testPriorityOrder({fd2: true, all: false}, false, true, execaSync));
test('buffer: {fd1, stdout}, sync', () => testPriorityOrder({fd1: false, stdout: true}, true, true, execaSync));
test('buffer: {all, stdout}, sync', () => testPriorityOrder({all: false, stdout: true}, true, false, execaSync));
test('buffer: {all, fd1}, sync', () => testPriorityOrder({all: false, fd1: true}, true, false, execaSync));
test('buffer: {fd2, stderr}, sync', () => testPriorityOrder({fd2: false, stderr: true}, true, true, execaSync));
test('buffer: {all, stderr}, sync', () => testPriorityOrder({all: false, stderr: true}, false, true, execaSync));
test('buffer: {all, fd2}, sync', () => testPriorityOrder({all: false, fd2: true}, false, true, execaSync));

const testFdKeyPresence = async (fdName, propertyName, execaMethod) => {
	const absentLines = await execaMethod('noop-both.js', {lines: {all: true}});
	assert.deepEqual(absentLines[propertyName], [foobarString]);
	const presentLines = await execaMethod('noop-both.js', {lines: {all: true, [fdName]: false}});
	assert.equal(presentLines[propertyName], foobarString);
	const undefinedLines = await execaMethod('noop-both.js', {lines: {all: true, [fdName]: undefined}});
	assert.equal(undefinedLines[propertyName], foobarString);
	const absentBuffer = await execaMethod('noop-both.js', {buffer: {all: false}});
	assert.equal(absentBuffer[propertyName], undefined);
};

test('fd-specific options preserve priority when stdout is absent or present', () => testFdKeyPresence('stdout', 'stdout', execa));
test('fd-specific options preserve priority when stderr is absent or present', () => testFdKeyPresence('stderr', 'stderr', execa));
test('fd-specific options preserve priority when fd1 is absent or present', () => testFdKeyPresence('fd1', 'stdout', execa));
test('fd-specific options preserve priority when fd2 is absent or present', () => testFdKeyPresence('fd2', 'stderr', execa));
test('fd-specific options preserve priority when stdout is absent or present, sync', () => testFdKeyPresence('stdout', 'stdout', execaSync));
test('fd-specific options preserve priority when stderr is absent or present, sync', () => testFdKeyPresence('stderr', 'stderr', execaSync));
test('fd-specific options preserve priority when fd1 is absent or present, sync', () => testFdKeyPresence('fd1', 'stdout', execaSync));
test('fd-specific options preserve priority when fd2 is absent or present, sync', () => testFdKeyPresence('fd2', 'stderr', execaSync));
