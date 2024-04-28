import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

await execa('unicorns', {stdin: 3});
execaSync('unicorns', {stdin: 3});
expectError(await execa('unicorns', {stdin: [3]}));
execaSync('unicorns', {stdin: [3]});

await execa('unicorns', {stdout: 3});
execaSync('unicorns', {stdout: 3});
expectError(await execa('unicorns', {stdout: [3]}));
execaSync('unicorns', {stdout: [3]});

await execa('unicorns', {stderr: 3});
execaSync('unicorns', {stderr: 3});
expectError(await execa('unicorns', {stderr: [3]}));
execaSync('unicorns', {stderr: [3]});

expectError(await execa('unicorns', {stdio: 3}));
expectError(execaSync('unicorns', {stdio: 3}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 3]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 3]});
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [3]]}));
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [3]]});

expectAssignable<StdinOption>(3);
expectAssignable<StdinSyncOption>(3);
expectNotAssignable<StdinOption>([3]);
expectAssignable<StdinSyncOption>([3]);

expectAssignable<StdoutStderrOption>(3);
expectAssignable<StdoutStderrSyncOption>(3);
expectNotAssignable<StdoutStderrOption>([3]);
expectAssignable<StdoutStderrSyncOption>([3]);
