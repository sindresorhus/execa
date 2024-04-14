import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {fullStdio, fullReadableStdio} from '../helpers/stdio.js';
import {foobarString} from '../helpers/input.js';

setFixtureDirectory();

// eslint-disable-next-line max-params
const pipeToSubprocess = async (t, readableFdNumber, writableFdNumber, from, to, readableOptions = {}, writableOptions = {}) => {
	const {stdout} = await execa('noop-fd.js', [`${readableFdNumber}`, foobarString], readableOptions)
		.pipe(execa('stdin-fd.js', [`${writableFdNumber}`], writableOptions), {from, to});
	t.is(stdout, foobarString);
};

test('pipe(...) can pipe', pipeToSubprocess, 1, 0);
test('pipe(..., {from: "stdout"}) can pipe', pipeToSubprocess, 1, 0, 'stdout');
test('pipe(..., {from: "fd1"}) can pipe', pipeToSubprocess, 1, 0, 'fd1');
test('pipe(..., {from: "stderr"}) can pipe stderr', pipeToSubprocess, 2, 0, 'stderr');
test('pipe(..., {from: "fd2"}) can pipe', pipeToSubprocess, 2, 0, 'fd2');
test('pipe(..., {from: "fd3"}) can pipe', pipeToSubprocess, 3, 0, 'fd3', undefined, fullStdio);
test('pipe(..., {from: "all"}) can pipe stdout', pipeToSubprocess, 1, 0, 'all', undefined, {all: true});
test('pipe(..., {from: "all"}) can pipe stderr', pipeToSubprocess, 2, 0, 'all', undefined, {all: true});
test('pipe(..., {from: "all"}) can pipe stdout even with "stderr: ignore"', pipeToSubprocess, 1, 0, 'all', undefined, {all: true, stderr: 'ignore'});
test('pipe(..., {from: "all"}) can pipe stderr even with "stdout: ignore"', pipeToSubprocess, 2, 0, 'all', undefined, {all: true, stdout: 'ignore'});
test('pipe(..., {to: "stdin"}) can pipe', pipeToSubprocess, 1, 0, undefined, 'stdin');
test('pipe(..., {to: "fd0"}) can pipe', pipeToSubprocess, 1, 0, undefined, 'fd0');
test('pipe(..., {to: "fd3"}) can pipe', pipeToSubprocess, 1, 3, undefined, 'fd3', {}, fullReadableStdio());
