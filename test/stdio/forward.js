import test from 'ava';
import {execa} from '../../index.js';
import {getStdio} from '../helpers/stdio.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';

setFixtureDir();

const testOverlapped = async (t, index) => {
	const {stdout} = await execa('noop.js', ['foobar'], getStdio(index, ['overlapped', 'pipe']));
	t.is(stdout, 'foobar');
};

test('stdin can be ["overlapped", "pipe"]', testOverlapped, 0);
test('stdout can be ["overlapped", "pipe"]', testOverlapped, 1);
test('stderr can be ["overlapped", "pipe"]', testOverlapped, 2);
test('stdio[*] can be ["overlapped", "pipe"]', testOverlapped, 3);
