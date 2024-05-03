import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

await execa('unicorns', {stdin: 0});
execaSync('unicorns', {stdin: 0});
await execa('unicorns', {stdin: [0]});
execaSync('unicorns', {stdin: [0]});

expectError(await execa('unicorns', {stdout: 0}));
expectError(execaSync('unicorns', {stdout: 0}));
expectError(await execa('unicorns', {stdout: [0]}));
expectError(execaSync('unicorns', {stdout: [0]}));

expectError(await execa('unicorns', {stderr: 0}));
expectError(execaSync('unicorns', {stderr: 0}));
expectError(await execa('unicorns', {stderr: [0]}));
expectError(execaSync('unicorns', {stderr: [0]}));

expectError(await execa('unicorns', {stdio: 0}));
expectError(execaSync('unicorns', {stdio: 0}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 0]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 0]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [0]]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [0]]});

expectAssignable<StdinOption>(0);
expectAssignable<StdinSyncOption>(0);
expectAssignable<StdinOption>([0]);
expectAssignable<StdinSyncOption>([0]);

expectNotAssignable<StdinOption>(0.5);
expectNotAssignable<StdinSyncOption>(-1);
expectNotAssignable<StdinOption>(Number.POSITIVE_INFINITY);
expectNotAssignable<StdinSyncOption>(Number.NaN);

expectNotAssignable<StdoutStderrOption>(0);
expectNotAssignable<StdoutStderrSyncOption>(0);
expectNotAssignable<StdoutStderrOption>([0]);
expectNotAssignable<StdoutStderrSyncOption>([0]);

expectNotAssignable<StdoutStderrOption>(0.5);
expectNotAssignable<StdoutStderrSyncOption>(-1);
expectNotAssignable<StdoutStderrOption>(Number.POSITIVE_INFINITY);
expectNotAssignable<StdoutStderrSyncOption>(Number.NaN);
