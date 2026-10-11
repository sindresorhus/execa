import {expectTypeOf, expectError} from 'nz';
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

expectTypeOf(fileUrl).toBeAssignableTo<StdinOption>();
expectTypeOf(fileUrl).toBeAssignableTo<StdinSyncOption>();
[fileUrl] satisfies StdinOption;
[fileUrl] satisfies StdinSyncOption;

expectTypeOf(fileUrl).toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(fileUrl).toBeAssignableTo<StdoutStderrSyncOption>();
[fileUrl] satisfies StdoutStderrOption;
[fileUrl] satisfies StdoutStderrSyncOption;
