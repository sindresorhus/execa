import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

await execa('unicorns', {stdin: 0});
execaSync('unicorns', {stdin: 0});
await execa('unicorns', {stdin: [0]});
execaSync('unicorns', {stdin: [0]});

expectError(await execa('unicorns', {stdout: 0}));
expectError(execaSync('unicorns', {stdout: 0}));
expectError(await execa('unicorns', {stdout: [0]}));
expectError(execaSync('unicorns', {stdout: [0]}));

expectError(await execa('unicorns', {stderr: 0}));
expectError(execaSync('unicorns', {stderr: 0}));
expectError(await execa('unicorns', {stderr: [0]}));
expectError(execaSync('unicorns', {stderr: [0]}));

expectError(await execa('unicorns', {stdio: 0}));
expectError(execaSync('unicorns', {stdio: 0}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 0]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 0]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [0]]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [0]]});

expectTypeOf<0>().toBeAssignableTo<StdinOption>();
expectTypeOf<0>().toBeAssignableTo<StdinSyncOption>();
[0] satisfies StdinOption;
[0] satisfies StdinSyncOption;

expectTypeOf<0.5>().not.toBeAssignableTo<StdinOption>();
expectTypeOf<-1>().not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf(Infinity).not.toBeAssignableTo<StdinOption>();
expectTypeOf(NaN).not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf<0>().not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf<0>().not.toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf<[0]>().not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf<[0]>().not.toBeAssignableTo<StdoutStderrSyncOption>();

expectTypeOf<0.5>().not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf<-1>().not.toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf(Infinity).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(NaN).not.toBeAssignableTo<StdoutStderrSyncOption>();
