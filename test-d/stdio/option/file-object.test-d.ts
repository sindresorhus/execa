import {expectError, expectAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinOptionSync,
	type StdoutStderrOption,
	type StdoutStderrOptionSync,
	type StdioOption,
	type StdioOptionSync,
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
expectAssignable<StdinOptionSync>(fileObject);
expectAssignable<StdinOption>([fileObject]);
expectAssignable<StdinOptionSync>([fileObject]);

expectAssignable<StdoutStderrOption>(fileObject);
expectAssignable<StdoutStderrOptionSync>(fileObject);
expectAssignable<StdoutStderrOption>([fileObject]);
expectAssignable<StdoutStderrOptionSync>([fileObject]);

expectAssignable<StdioOption>(fileObject);
expectAssignable<StdioOptionSync>(fileObject);
expectAssignable<StdioOption>([fileObject]);
expectAssignable<StdioOptionSync>([fileObject]);
