import {expectError, expectAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const fileAppend = {file: './test', append: true} as const;

await execa('unicorns', {stdin: fileAppend});
execaSync('unicorns', {stdin: fileAppend});
await execa('unicorns', {stdin: [fileAppend]});
execaSync('unicorns', {stdin: [fileAppend]});

await execa('unicorns', {stdout: fileAppend});
execaSync('unicorns', {stdout: fileAppend});
await execa('unicorns', {stdout: [fileAppend]});
execaSync('unicorns', {stdout: [fileAppend]});

await execa('unicorns', {stderr: fileAppend});
execaSync('unicorns', {stderr: fileAppend});
await execa('unicorns', {stderr: [fileAppend]});
execaSync('unicorns', {stderr: [fileAppend]});

expectError(await execa('unicorns', {stdio: fileAppend}));
expectError(execaSync('unicorns', {stdio: fileAppend}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', fileAppend]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', fileAppend]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [fileAppend]]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [fileAppend]]});

expectAssignable<StdinOption>(fileAppend);
expectAssignable<StdinSyncOption>(fileAppend);
expectAssignable<StdinOption>([fileAppend]);
expectAssignable<StdinSyncOption>([fileAppend]);

expectAssignable<StdoutStderrOption>(fileAppend);
expectAssignable<StdoutStderrSyncOption>(fileAppend);
expectAssignable<StdoutStderrOption>([fileAppend]);
expectAssignable<StdoutStderrSyncOption>([fileAppend]);
