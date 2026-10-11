import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

expectError(await execa('unicorns', {stdin: 1}));
expectError(execaSync('unicorns', {stdin: 1}));
expectError(await execa('unicorns', {stdin: [1]}));
expectError(execaSync('unicorns', {stdin: [1]}));

await execa('unicorns', {stdout: 1});
execaSync('unicorns', {stdout: 1});
await execa('unicorns', {stdout: [1]});
execaSync('unicorns', {stdout: [1]});

await execa('unicorns', {stderr: 1});
execaSync('unicorns', {stderr: 1});
await execa('unicorns', {stderr: [1]});
execaSync('unicorns', {stderr: [1]});

expectError(await execa('unicorns', {stdio: 1}));
expectError(execaSync('unicorns', {stdio: 1}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 1]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 1]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [1]]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [1]]});

expectTypeOf<1>().not.toBeAssignableTo<StdinOption>();
expectTypeOf<1>().not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf<[1]>().not.toBeAssignableTo<StdinOption>();
expectTypeOf<[1]>().not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf<1>().toBeAssignableTo<StdoutStderrOption>();
expectTypeOf<1>().toBeAssignableTo<StdoutStderrSyncOption>();
[1] satisfies StdoutStderrOption;
[1] satisfies StdoutStderrSyncOption;
