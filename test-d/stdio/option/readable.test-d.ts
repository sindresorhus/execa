import {Readable} from 'node:stream';
import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
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

expectAssignable<StdinOption>(new Readable());
expectAssignable<StdinSyncOption>(new Readable());
expectAssignable<StdinOption>([new Readable()]);
expectNotAssignable<StdinSyncOption>([new Readable()]);

expectNotAssignable<StdoutStderrOption>(new Readable());
expectNotAssignable<StdoutStderrSyncOption>(new Readable());
expectNotAssignable<StdoutStderrOption>([new Readable()]);
expectNotAssignable<StdoutStderrSyncOption>([new Readable()]);
