import {expectError, expectAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const fileUrl = new URL('file:///test');

await execa('unicorns', {stdin: fileUrl});
execaSync('unicorns', {stdin: fileUrl});
await execa('unicorns', {stdin: [fileUrl]});
execaSync('unicorns', {stdin: [fileUrl]});

await execa('unicorns', {stdout: fileUrl});
execaSync('unicorns', {stdout: fileUrl});
await execa('unicorns', {stdout: [fileUrl]});
execaSync('unicorns', {stdout: [fileUrl]});

await execa('unicorns', {stderr: fileUrl});
execaSync('unicorns', {stderr: fileUrl});
await execa('unicorns', {stderr: [fileUrl]});
execaSync('unicorns', {stderr: [fileUrl]});

expectError(await execa('unicorns', {stdio: fileUrl}));
expectError(execaSync('unicorns', {stdio: fileUrl}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', fileUrl]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', fileUrl]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [fileUrl]]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [fileUrl]]});

expectAssignable<StdinOption>(fileUrl);
expectAssignable<StdinSyncOption>(fileUrl);
expectAssignable<StdinOption>([fileUrl]);
expectAssignable<StdinSyncOption>([fileUrl]);

expectAssignable<StdoutStderrOption>(fileUrl);
expectAssignable<StdoutStderrSyncOption>(fileUrl);
expectAssignable<StdoutStderrOption>([fileUrl]);
expectAssignable<StdoutStderrSyncOption>([fileUrl]);
