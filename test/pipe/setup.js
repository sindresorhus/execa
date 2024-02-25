import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {fullStdio} from '../helpers/stdio.js';

setFixtureDir();

const pipeToProcess = async (t, fdNumber, from, options) => {
	const {stdout} = await execa('noop-fd.js', [`${fdNumber}`, 'test'], options)
		.pipe(execa('stdin.js'), {from});
	t.is(stdout, 'test');
};

test('pipe(...) can pipe', pipeToProcess, 1, undefined, {});
test('pipe(..., {from: "stdout"}) can pipe', pipeToProcess, 1, 'stdout', {});
test('pipe(..., {from: 1}) can pipe', pipeToProcess, 1, 1, {});
test('pipe(..., {from: "stderr"}) stderr can pipe', pipeToProcess, 2, 'stderr', {});
test('pipe(..., {from: 2}) can pipe', pipeToProcess, 2, 2, {});
test('pipe(..., {from: 3}) can pipe', pipeToProcess, 3, 3, fullStdio);
test('pipe(..., {from: "all"}) can pipe stdout', pipeToProcess, 1, 'all', {all: true});
test('pipe(..., {from: "all"}) can pipe stderr', pipeToProcess, 2, 'all', {all: true});
test('pipe(..., {from: "all"}) can pipe stdout even with "stderr: ignore"', pipeToProcess, 1, 'all', {all: true, stderr: 'ignore'});
test('pipe(..., {from: "all"}) can pipe stderr even with "stdout: ignore"', pipeToProcess, 2, 'all', {all: true, stdout: 'ignore'});
