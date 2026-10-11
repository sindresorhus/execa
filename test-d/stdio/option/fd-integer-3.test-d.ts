import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

await execa('unicorns', {stdin: 3});
execaSync('unicorns', {stdin: 3});
expectError(await execa('unicorns', {stdin: [3]}));
execaSync('unicorns', {stdin: [3]});

await execa('unicorns', {stdout: 3});
execaSync('unicorns', {stdout: 3});
expectError(await execa('unicorns', {stdout: [3]}));
execaSync('unicorns', {stdout: [3]});

await execa('unicorns', {stderr: 3});
execaSync('unicorns', {stderr: 3});
expectError(await execa('unicorns', {stderr: [3]}));
execaSync('unicorns', {stderr: [3]});

expectError(await execa('unicorns', {stdio: 3}));
expectError(execaSync('unicorns', {stdio: 3}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 3]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 3]});
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [3]]}));
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [3]]});

expectTypeOf<3>().toBeAssignableTo<StdinOption>();
expectTypeOf<3>().toBeAssignableTo<StdinSyncOption>();
expectTypeOf<[3]>().not.toBeAssignableTo<StdinOption>();
[3] satisfies StdinSyncOption;

expectTypeOf<3>().toBeAssignableTo<StdoutStderrOption>();
expectTypeOf<3>().toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf<[3]>().not.toBeAssignableTo<StdoutStderrOption>();
[3] satisfies StdoutStderrSyncOption;
