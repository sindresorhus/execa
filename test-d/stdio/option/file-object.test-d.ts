import {expectTypeOf, expectError} from 'nz';
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

expectTypeOf(fileObject).toBeAssignableTo<StdinOption>();
expectTypeOf(fileObject).toBeAssignableTo<StdinSyncOption>();
[fileObject] satisfies StdinOption;
[fileObject] satisfies StdinSyncOption;

expectTypeOf(fileObject).toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(fileObject).toBeAssignableTo<StdoutStderrSyncOption>();
[fileObject] satisfies StdoutStderrOption;
[fileObject] satisfies StdoutStderrSyncOption;
