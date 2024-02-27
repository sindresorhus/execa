import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {getStdio} from '../helpers/stdio.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';

setFixtureDir();

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

const testNoPipeOption = async (t, stdioOption, fdNumber) => {
	const childProcess = execa('empty.js', getStdio(fdNumber, stdioOption));
	t.is(childProcess.stdio[fdNumber], null);
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
