import {Duplex} from 'node:stream';
import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinOptionSync,
	type StdoutStderrOption,
	type StdoutStderrOptionSync,
} from '../../../index.js';

const duplexObjectProperty = {
	transform: new Duplex(),
	objectMode: true as const,
} as const;

await execa('unicorns', {stdin: duplexObjectProperty});
expectError(execaSync('unicorns', {stdin: duplexObjectProperty}));
await execa('unicorns', {stdin: [duplexObjectProperty]});
expectError(execaSync('unicorns', {stdin: [duplexObjectProperty]}));

await execa('unicorns', {stdout: duplexObjectProperty});
expectError(execaSync('unicorns', {stdout: duplexObjectProperty}));
await execa('unicorns', {stdout: [duplexObjectProperty]});
expectError(execaSync('unicorns', {stdout: [duplexObjectProperty]}));

await execa('unicorns', {stderr: duplexObjectProperty});
expectError(execaSync('unicorns', {stderr: duplexObjectProperty}));
await execa('unicorns', {stderr: [duplexObjectProperty]});
expectError(execaSync('unicorns', {stderr: [duplexObjectProperty]}));

expectError(await execa('unicorns', {stdio: duplexObjectProperty}));
expectError(execaSync('unicorns', {stdio: duplexObjectProperty}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', duplexObjectProperty]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', duplexObjectProperty]}));
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [duplexObjectProperty]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [duplexObjectProperty]]}));

expectAssignable<StdinOption>(duplexObjectProperty);
expectNotAssignable<StdinOptionSync>(duplexObjectProperty);
expectAssignable<StdinOption>([duplexObjectProperty]);
expectNotAssignable<StdinOptionSync>([duplexObjectProperty]);

expectAssignable<StdoutStderrOption>(duplexObjectProperty);
expectNotAssignable<StdoutStderrOptionSync>(duplexObjectProperty);
expectAssignable<StdoutStderrOption>([duplexObjectProperty]);
expectNotAssignable<StdoutStderrOptionSync>([duplexObjectProperty]);
