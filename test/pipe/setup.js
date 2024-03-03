import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDir} from '../helpers/fixtures-dir.js';
import {fullStdio} from '../helpers/stdio.js';

setFixtureDir();

const pipeToSubprocess = async (t, fdNumber, from, options) => {
	const {stdout} = await execa('noop-fd.js', [`${fdNumber}`, 'test'], options)
		.pipe(execa('stdin.js'), {from});
	t.is(stdout, 'test');
};

test('pipe(...) can pipe', pipeToSubprocess, 1, undefined, {});
test('pipe(..., {from: "stdout"}) can pipe', pipeToSubprocess, 1, 'stdout', {});
test('pipe(..., {from: 1}) can pipe', pipeToSubprocess, 1, 1, {});
test('pipe(..., {from: "stderr"}) stderr can pipe', pipeToSubprocess, 2, 'stderr', {});
test('pipe(..., {from: 2}) can pipe', pipeToSubprocess, 2, 2, {});
test('pipe(..., {from: 3}) can pipe', pipeToSubprocess, 3, 3, fullStdio);
test('pipe(..., {from: "all"}) can pipe stdout', pipeToSubprocess, 1, 'all', {all: true});
test('pipe(..., {from: "all"}) can pipe stderr', pipeToSubprocess, 2, 'all', {all: true});
test('pipe(..., {from: "all"}) can pipe stdout even with "stderr: ignore"', pipeToSubprocess, 1, 'all', {all: true, stderr: 'ignore'});
test('pipe(..., {from: "all"}) can pipe stderr even with "stdout: ignore"', pipeToSubprocess, 2, 'all', {all: true, stdout: 'ignore'});
