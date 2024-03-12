import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {fullStdio, fullReadableStdio} from '../helpers/stdio.js';
import {foobarString} from '../helpers/input.js';

setFixtureDir();

// eslint-disable-next-line max-params
const pipeToSubprocess = async (t, readableFdNumber, writableFdNumber, from, to, readableOptions = {}, writableOptions = {}) => {
	const {stdout} = await execa('noop-fd.js', [`${readableFdNumber}`, foobarString], readableOptions)
		.pipe(execa('stdin-fd.js', [`${writableFdNumber}`], writableOptions), {from, to});
	t.is(stdout, foobarString);
};

test('pipe(...) can pipe', pipeToSubprocess, 1, 0);
test('pipe(..., {from: "stdout"}) can pipe', pipeToSubprocess, 1, 0, 'stdout');
test('pipe(..., {from: 1}) can pipe', pipeToSubprocess, 1, 0, 1);
test('pipe(..., {from: "stderr"}) can pipe stderr', pipeToSubprocess, 2, 0, 'stderr');
test('pipe(..., {from: 2}) can pipe', pipeToSubprocess, 2, 0, 2);
test('pipe(..., {from: 3}) can pipe', pipeToSubprocess, 3, 0, 3, undefined, fullStdio);
test('pipe(..., {from: "all"}) can pipe stdout', pipeToSubprocess, 1, 0, 'all', undefined, {all: true});
test('pipe(..., {from: "all"}) can pipe stderr', pipeToSubprocess, 2, 0, 'all', undefined, {all: true});
test('pipe(..., {from: "all"}) can pipe stdout even with "stderr: ignore"', pipeToSubprocess, 1, 0, 'all', undefined, {all: true, stderr: 'ignore'});
test('pipe(..., {from: "all"}) can pipe stderr even with "stdout: ignore"', pipeToSubprocess, 2, 0, 'all', undefined, {all: true, stdout: 'ignore'});
test('pipe(..., {to: "stdin"}) can pipe', pipeToSubprocess, 1, 0, undefined, 'stdin');
test('pipe(..., {to: 0}) can pipe', pipeToSubprocess, 1, 0, undefined, 0);
test('pipe(..., {to: 3}) can pipe', pipeToSubprocess, 1, 3, undefined, 3, {}, fullReadableStdio());
