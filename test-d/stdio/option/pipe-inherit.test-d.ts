import {expectError, expectAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const pipeInherit = ['pipe', 'inherit'] as const;

await execa('unicorns', {stdin: pipeInherit});
execaSync('unicorns', {stdin: pipeInherit});

await execa('unicorns', {stdout: pipeInherit});
execaSync('unicorns', {stdout: pipeInherit});

await execa('unicorns', {stderr: pipeInherit});
execaSync('unicorns', {stderr: pipeInherit});

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', pipeInherit]}));
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', pipeInherit]});

expectAssignable<StdinOption>(pipeInherit);
expectAssignable<StdinSyncOption>(pipeInherit);

expectAssignable<StdoutStderrOption>(pipeInherit);
expectAssignable<StdoutStderrSyncOption>(pipeInherit);
