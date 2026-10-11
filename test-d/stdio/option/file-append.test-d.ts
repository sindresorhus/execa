import {expectTypeOf, expectError} from 'nz';
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

expectTypeOf(fileAppend).toBeAssignableTo<StdinOption>();
expectTypeOf(fileAppend).toBeAssignableTo<StdinSyncOption>();
[fileAppend] satisfies StdinOption;
[fileAppend] satisfies StdinSyncOption;

expectTypeOf(fileAppend).toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(fileAppend).toBeAssignableTo<StdoutStderrSyncOption>();
[fileAppend] satisfies StdoutStderrOption;
[fileAppend] satisfies StdoutStderrSyncOption;
