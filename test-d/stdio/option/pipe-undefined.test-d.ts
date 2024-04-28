import {expectAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const pipeUndefined = ['pipe', undefined] as const;

await execa('unicorns', {stdin: pipeUndefined});
execaSync('unicorns', {stdin: pipeUndefined});

await execa('unicorns', {stdout: pipeUndefined});
execaSync('unicorns', {stdout: pipeUndefined});

await execa('unicorns', {stderr: pipeUndefined});
execaSync('unicorns', {stderr: pipeUndefined});

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', pipeUndefined]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', pipeUndefined]});

expectAssignable<StdinOption>(pipeUndefined);
expectAssignable<StdinSyncOption>(pipeUndefined);

expectAssignable<StdoutStderrOption>(pipeUndefined);
expectAssignable<StdoutStderrSyncOption>(pipeUndefined);
