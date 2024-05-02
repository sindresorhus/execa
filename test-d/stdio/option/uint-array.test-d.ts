import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinOptionSync,
	type StdoutStderrOption,
	type StdoutStderrOptionSync,
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

expectAssignable<StdinOption>(new Uint8Array());
expectAssignable<StdinOptionSync>(new Uint8Array());
expectAssignable<StdinOption>([new Uint8Array()]);
expectAssignable<StdinOptionSync>([new Uint8Array()]);

expectNotAssignable<StdoutStderrOption>(new Uint8Array());
expectNotAssignable<StdoutStderrOptionSync>(new Uint8Array());
expectNotAssignable<StdoutStderrOption>([new Uint8Array()]);
expectNotAssignable<StdoutStderrOptionSync>([new Uint8Array()]);
