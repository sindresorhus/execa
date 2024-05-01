import test from 'ava';
import {execa} from '../../index.js';
import {getStdio} from '../helpers/stdio.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

const testNoPipeOption = async (t, stdioOption, fdNumber) => {
	const subprocess = execa('empty.js', getStdio(fdNumber, stdioOption));
	t.is(subprocess.stdio[fdNumber], null);
	await subprocess;
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
