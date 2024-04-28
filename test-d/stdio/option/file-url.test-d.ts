import {expectError, expectAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinOptionSync,
	type StdoutStderrOption,
	type StdoutStderrOptionSync,
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
expectAssignable<StdinOptionSync>(fileUrl);
expectAssignable<StdinOption>([fileUrl]);
expectAssignable<StdinOptionSync>([fileUrl]);

expectAssignable<StdoutStderrOption>(fileUrl);
expectAssignable<StdoutStderrOptionSync>(fileUrl);
expectAssignable<StdoutStderrOption>([fileUrl]);
expectAssignable<StdoutStderrOptionSync>([fileUrl]);
