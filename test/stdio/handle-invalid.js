import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {getStdio} from '../helpers/stdio.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

const testEmptyArray = (t, fdNumber, optionName, execaMethod) => {
	t.throws(() => {
		execaMethod('empty.js', getStdio(fdNumber, []));
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

const testInvalidValueSync = (t, fdNumber, stdioOption) => {
	const {message} = t.throws(() => {
		execaSync('empty.js', getStdio(fdNumber, stdioOption));
	});
	t.true(message.includes(`cannot be "${stdioOption}" with synchronous methods`));
};

test('stdin cannot be "ipc", sync', testInvalidValueSync, 0, 'ipc');
test('stdout cannot be "ipc", sync', testInvalidValueSync, 1, 'ipc');
test('stderr cannot be "ipc", sync', testInvalidValueSync, 2, 'ipc');
test('stdio[*] cannot be "ipc", sync', testInvalidValueSync, 3, 'ipc');
test('stdin cannot be "overlapped", sync', testInvalidValueSync, 0, 'overlapped');
test('stdout cannot be "overlapped", sync', testInvalidValueSync, 1, 'overlapped');
test('stderr cannot be "overlapped", sync', testInvalidValueSync, 2, 'overlapped');
test('stdio[*] cannot be "overlapped", sync', testInvalidValueSync, 3, 'overlapped');

const testInvalidArrayValue = (t, invalidStdio, fdNumber, execaMethod) => {
	t.throws(() => {
		execaMethod('empty.js', getStdio(fdNumber, ['pipe', invalidStdio]));
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
