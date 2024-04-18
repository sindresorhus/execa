import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinOptionSync,
	type StdoutStderrOption,
	type StdoutStderrOptionSync,
	type StdioOption,
	type StdioOptionSync,
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

expectNotAssignable<StdinOption>(new WritableStream());
expectNotAssignable<StdinOptionSync>(new WritableStream());
expectNotAssignable<StdinOption>([new WritableStream()]);
expectNotAssignable<StdinOptionSync>([new WritableStream()]);

expectAssignable<StdoutStderrOption>(new WritableStream());
expectNotAssignable<StdoutStderrOptionSync>(new WritableStream());
expectAssignable<StdoutStderrOption>([new WritableStream()]);
expectNotAssignable<StdoutStderrOptionSync>([new WritableStream()]);

expectAssignable<StdioOption>(new WritableStream());
expectNotAssignable<StdioOptionSync>(new WritableStream());
expectAssignable<StdioOption>([new WritableStream()]);
expectNotAssignable<StdioOptionSync>([new WritableStream()]);
