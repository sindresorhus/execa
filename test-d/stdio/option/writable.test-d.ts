import {Writable} from 'node:stream';
import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

expectError(await execa('unicorns', {stdin: new Writable()}));
expectError(execaSync('unicorns', {stdin: new Writable()}));
expectError(await execa('unicorns', {stdin: [new Writable()]}));
expectError(execaSync('unicorns', {stdin: [new Writable()]}));

await execa('unicorns', {stdout: new Writable()});
execaSync('unicorns', {stdout: new Writable()});
await execa('unicorns', {stdout: [new Writable()]});
expectError(execaSync('unicorns', {stdout: [new Writable()]}));

await execa('unicorns', {stderr: new Writable()});
execaSync('unicorns', {stderr: new Writable()});
await execa('unicorns', {stderr: [new Writable()]});
expectError(execaSync('unicorns', {stderr: [new Writable()]}));

expectError(await execa('unicorns', {stdio: new Writable()}));
expectError(execaSync('unicorns', {stdio: new Writable()}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', new Writable()]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', new Writable()]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [new Writable()]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [new Writable()]]}));

expectNotAssignable<StdinOption>(new Writable());
expectNotAssignable<StdinSyncOption>(new Writable());
expectNotAssignable<StdinOption>([new Writable()]);
expectNotAssignable<StdinSyncOption>([new Writable()]);

expectAssignable<StdoutStderrOption>(new Writable());
expectAssignable<StdoutStderrSyncOption>(new Writable());
expectAssignable<StdoutStderrOption>([new Writable()]);
expectNotAssignable<StdoutStderrSyncOption>([new Writable()]);
