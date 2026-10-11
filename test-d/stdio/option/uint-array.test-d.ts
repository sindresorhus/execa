import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

await execa('unicorns', {stdin: new Uint8Array()});
execaSync('unicorns', {stdin: new Uint8Array()});
await execa('unicorns', {stdin: [new Uint8Array()]});
execaSync('unicorns', {stdin: [new Uint8Array()]});

expectError(await execa('unicorns', {stdout: new Uint8Array()}));
expectError(execaSync('unicorns', {stdout: new Uint8Array()}));
expectError(await execa('unicorns', {stdout: [new Uint8Array()]}));
expectError(execaSync('unicorns', {stdout: [new Uint8Array()]}));

expectError(await execa('unicorns', {stderr: new Uint8Array()}));
expectError(execaSync('unicorns', {stderr: new Uint8Array()}));
expectError(await execa('unicorns', {stderr: [new Uint8Array()]}));
expectError(execaSync('unicorns', {stderr: [new Uint8Array()]}));

expectError(await execa('unicorns', {stdio: new Uint8Array()}));
expectError(execaSync('unicorns', {stdio: new Uint8Array()}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', new Uint8Array()]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', new Uint8Array()]}));
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [new Uint8Array()]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [new Uint8Array()]]}));

expectTypeOf(new Uint8Array()).toBeAssignableTo<StdinOption>();
expectTypeOf(new Uint8Array()).toBeAssignableTo<StdinSyncOption>();
[new Uint8Array()] satisfies StdinOption;
[new Uint8Array()] satisfies StdinSyncOption;

expectTypeOf(new Uint8Array()).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(new Uint8Array()).not.toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf([new Uint8Array()]).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf([new Uint8Array()]).not.toBeAssignableTo<StdoutStderrSyncOption>();
