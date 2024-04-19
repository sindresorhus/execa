import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {getStdio} from '../helpers/stdio.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {appendGenerator, appendAsyncGenerator, casedSuffix} from '../helpers/generator.js';
import {appendDuplex} from '../helpers/duplex.js';
import {appendWebTransform} from '../helpers/web-transform.js';
import {foobarString} from '../helpers/input.js';

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

// eslint-disable-next-line max-params
const testTwoGenerators = async (t, producesTwo, execaMethod, firstGenerator, secondGenerator = firstGenerator) => {
	const {stdout} = await execaMethod('noop-fd.js', ['1', foobarString], {stdout: [firstGenerator, secondGenerator]});
	const expectedSuffix = producesTwo ? `${casedSuffix}${casedSuffix}` : casedSuffix;
	t.is(stdout, `${foobarString}${expectedSuffix}`);
};

test('Can use multiple identical generators', testTwoGenerators, true, execa, appendGenerator().transform);
test('Can use multiple identical generators, options object', testTwoGenerators, true, execa, appendGenerator());
test('Can use multiple identical generators, async', testTwoGenerators, true, execa, appendAsyncGenerator().transform);
test('Can use multiple identical generators, options object, async', testTwoGenerators, true, execa, appendAsyncGenerator());
test('Can use multiple identical generators, sync', testTwoGenerators, true, execaSync, appendGenerator().transform);
test('Can use multiple identical generators, options object, sync', testTwoGenerators, true, execaSync, appendGenerator());
test('Ignore duplicate identical duplexes', testTwoGenerators, false, execa, appendDuplex());
test('Ignore duplicate identical webTransforms', testTwoGenerators, false, execa, appendWebTransform());
test('Can use multiple generators with duplexes', testTwoGenerators, true, execa, appendGenerator(false, false, true), appendDuplex());
test('Can use multiple generators with webTransforms', testTwoGenerators, true, execa, appendGenerator(false, false, true), appendWebTransform());
test('Can use multiple duplexes with webTransforms', testTwoGenerators, true, execa, appendDuplex(), appendWebTransform());
