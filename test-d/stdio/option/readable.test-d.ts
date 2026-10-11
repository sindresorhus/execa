import {Readable} from 'node:stream';
import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

await execa('unicorns', {stdin: new Readable()});
execaSync('unicorns', {stdin: new Readable()});
await execa('unicorns', {stdin: [new Readable()]});
expectError(execaSync('unicorns', {stdin: [new Readable()]}));

expectError(await execa('unicorns', {stdout: new Readable()}));
expectError(execaSync('unicorns', {stdout: new Readable()}));
expectError(await execa('unicorns', {stdout: [new Readable()]}));
expectError(execaSync('unicorns', {stdout: [new Readable()]}));

expectError(await execa('unicorns', {stderr: new Readable()}));
expectError(execaSync('unicorns', {stderr: new Readable()}));
expectError(await execa('unicorns', {stderr: [new Readable()]}));
expectError(execaSync('unicorns', {stderr: [new Readable()]}));

expectError(await execa('unicorns', {stdio: new Readable()}));
expectError(execaSync('unicorns', {stdio: new Readable()}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', new Readable()]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', new Readable()]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [new Readable()]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [new Readable()]]}));

expectTypeOf(new Readable()).toBeAssignableTo<StdinOption>();
expectTypeOf(new Readable()).toBeAssignableTo<StdinSyncOption>();
[new Readable()] satisfies StdinOption;
expectTypeOf([new Readable()]).not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf(new Readable()).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(new Readable()).not.toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf([new Readable()]).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf([new Readable()]).not.toBeAssignableTo<StdoutStderrSyncOption>();
