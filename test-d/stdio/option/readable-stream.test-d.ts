import {ReadableStream} from 'node:stream/web';
import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

await execa('unicorns', {stdin: new ReadableStream()});
expectError(execaSync('unicorns', {stdin: new ReadableStream()}));
await execa('unicorns', {stdin: [new ReadableStream()]});
expectError(execaSync('unicorns', {stdin: [new ReadableStream()]}));

expectError(await execa('unicorns', {stdout: new ReadableStream()}));
expectError(execaSync('unicorns', {stdout: new ReadableStream()}));
expectError(await execa('unicorns', {stdout: [new ReadableStream()]}));
expectError(execaSync('unicorns', {stdout: [new ReadableStream()]}));

expectError(await execa('unicorns', {stderr: new ReadableStream()}));
expectError(execaSync('unicorns', {stderr: new ReadableStream()}));
expectError(await execa('unicorns', {stderr: [new ReadableStream()]}));
expectError(execaSync('unicorns', {stderr: [new ReadableStream()]}));

expectError(await execa('unicorns', {stdio: new ReadableStream()}));
expectError(execaSync('unicorns', {stdio: new ReadableStream()}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', new ReadableStream()]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', new ReadableStream()]}));
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [new ReadableStream()]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [new ReadableStream()]]}));

expectTypeOf(new ReadableStream()).toBeAssignableTo<StdinOption>();
expectTypeOf(new ReadableStream()).not.toBeAssignableTo<StdinSyncOption>();
[new ReadableStream()] satisfies StdinOption;
expectTypeOf([new ReadableStream()]).not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf(new ReadableStream()).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(new ReadableStream()).not.toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf([new ReadableStream()]).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf([new ReadableStream()]).not.toBeAssignableTo<StdoutStderrSyncOption>();
