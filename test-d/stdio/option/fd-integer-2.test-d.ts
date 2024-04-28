import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

expectError(await execa('unicorns', {stdin: 2}));
expectError(execaSync('unicorns', {stdin: 2}));
expectError(await execa('unicorns', {stdin: [2]}));
expectError(execaSync('unicorns', {stdin: [2]}));

await execa('unicorns', {stdout: 2});
execaSync('unicorns', {stdout: 2});
await execa('unicorns', {stdout: [2]});
execaSync('unicorns', {stdout: [2]});

await execa('unicorns', {stderr: 2});
execaSync('unicorns', {stderr: 2});
await execa('unicorns', {stderr: [2]});
execaSync('unicorns', {stderr: [2]});

expectError(await execa('unicorns', {stdio: 2}));
expectError(execaSync('unicorns', {stdio: 2}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 2]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 2]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [2]]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [2]]});

expectNotAssignable<StdinOption>(2);
expectNotAssignable<StdinSyncOption>(2);
expectNotAssignable<StdinOption>([2]);
expectNotAssignable<StdinSyncOption>([2]);

expectAssignable<StdoutStderrOption>(2);
expectAssignable<StdoutStderrSyncOption>(2);
expectAssignable<StdoutStderrOption>([2]);
expectAssignable<StdoutStderrSyncOption>([2]);
