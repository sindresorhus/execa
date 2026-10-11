import {WritableStream} from 'node:stream/web';
import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

expectError(await execa('unicorns', {stdin: new WritableStream()}));
expectError(execaSync('unicorns', {stdin: new WritableStream()}));
expectError(await execa('unicorns', {stdin: [new WritableStream()]}));
expectError(execaSync('unicorns', {stdin: [new WritableStream()]}));

await execa('unicorns', {stdout: new WritableStream()});
expectError(execaSync('unicorns', {stdout: new WritableStream()}));
await execa('unicorns', {stdout: [new WritableStream()]});
expectError(execaSync('unicorns', {stdout: [new WritableStream()]}));

await execa('unicorns', {stderr: new WritableStream()});
expectError(execaSync('unicorns', {stderr: new WritableStream()}));
await execa('unicorns', {stderr: [new WritableStream()]});
expectError(execaSync('unicorns', {stderr: [new WritableStream()]}));

expectError(await execa('unicorns', {stdio: new WritableStream()}));
expectError(execaSync('unicorns', {stdio: new WritableStream()}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', new WritableStream()]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', new WritableStream()]}));
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [new WritableStream()]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [new WritableStream()]]}));

expectTypeOf(new WritableStream()).not.toBeAssignableTo<StdinOption>();
expectTypeOf(new WritableStream()).not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf([new WritableStream()]).not.toBeAssignableTo<StdinOption>();
expectTypeOf([new WritableStream()]).not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf(new WritableStream()).toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(new WritableStream()).not.toBeAssignableTo<StdoutStderrSyncOption>();
[new WritableStream()] satisfies StdoutStderrOption;
expectTypeOf([new WritableStream()]).not.toBeAssignableTo<StdoutStderrSyncOption>();
