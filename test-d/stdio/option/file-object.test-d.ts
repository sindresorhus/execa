import {expectError, expectAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const fileObject = {file: './test'} as const;

await execa('unicorns', {stdin: fileObject});
execaSync('unicorns', {stdin: fileObject});
await execa('unicorns', {stdin: [fileObject]});
execaSync('unicorns', {stdin: [fileObject]});

await execa('unicorns', {stdout: fileObject});
execaSync('unicorns', {stdout: fileObject});
await execa('unicorns', {stdout: [fileObject]});
execaSync('unicorns', {stdout: [fileObject]});

await execa('unicorns', {stderr: fileObject});
execaSync('unicorns', {stderr: fileObject});
await execa('unicorns', {stderr: [fileObject]});
execaSync('unicorns', {stderr: [fileObject]});

expectError(await execa('unicorns', {stdio: fileObject}));
expectError(execaSync('unicorns', {stdio: fileObject}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', fileObject]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', fileObject]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [fileObject]]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [fileObject]]});

expectAssignable<StdinOption>(fileObject);
expectAssignable<StdinSyncOption>(fileObject);
expectAssignable<StdinOption>([fileObject]);
expectAssignable<StdinSyncOption>([fileObject]);

expectAssignable<StdoutStderrOption>(fileObject);
expectAssignable<StdoutStderrSyncOption>(fileObject);
expectAssignable<StdoutStderrOption>([fileObject]);
expectAssignable<StdoutStderrSyncOption>([fileObject]);
