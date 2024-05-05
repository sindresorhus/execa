import {ReadableStream} from 'node:stream/web';
import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
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

expectAssignable<StdinOption>(new ReadableStream());
expectNotAssignable<StdinSyncOption>(new ReadableStream());
expectAssignable<StdinOption>([new ReadableStream()]);
expectNotAssignable<StdinSyncOption>([new ReadableStream()]);

expectNotAssignable<StdoutStderrOption>(new ReadableStream());
expectNotAssignable<StdoutStderrSyncOption>(new ReadableStream());
expectNotAssignable<StdoutStderrOption>([new ReadableStream()]);
expectNotAssignable<StdoutStderrSyncOption>([new ReadableStream()]);
