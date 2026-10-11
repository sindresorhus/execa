import {expectTypeOf, expectError} from 'nz';
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

expectTypeOf<2>().not.toBeAssignableTo<StdinOption>();
expectTypeOf<2>().not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf<[2]>().not.toBeAssignableTo<StdinOption>();
expectTypeOf<[2]>().not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf<2>().toBeAssignableTo<StdoutStderrOption>();
expectTypeOf<2>().toBeAssignableTo<StdoutStderrSyncOption>();
[2] satisfies StdoutStderrOption;
[2] satisfies StdoutStderrSyncOption;
