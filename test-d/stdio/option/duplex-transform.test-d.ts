import {Transform} from 'node:stream';
import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const duplexTransform = {transform: new Transform()} as const;

await execa('unicorns', {stdin: duplexTransform});
expectError(execaSync('unicorns', {stdin: duplexTransform}));
await execa('unicorns', {stdin: [duplexTransform]});
expectError(execaSync('unicorns', {stdin: [duplexTransform]}));

await execa('unicorns', {stdout: duplexTransform});
expectError(execaSync('unicorns', {stdout: duplexTransform}));
await execa('unicorns', {stdout: [duplexTransform]});
expectError(execaSync('unicorns', {stdout: [duplexTransform]}));

await execa('unicorns', {stderr: duplexTransform});
expectError(execaSync('unicorns', {stderr: duplexTransform}));
await execa('unicorns', {stderr: [duplexTransform]});
expectError(execaSync('unicorns', {stderr: [duplexTransform]}));

expectError(await execa('unicorns', {stdio: duplexTransform}));
expectError(execaSync('unicorns', {stdio: duplexTransform}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', duplexTransform]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', duplexTransform]}));
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [duplexTransform]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [duplexTransform]]}));

expectAssignable<StdinOption>(duplexTransform);
expectNotAssignable<StdinSyncOption>(duplexTransform);
expectAssignable<StdinOption>([duplexTransform]);
expectNotAssignable<StdinSyncOption>([duplexTransform]);

expectAssignable<StdoutStderrOption>(duplexTransform);
expectNotAssignable<StdoutStderrSyncOption>(duplexTransform);
expectAssignable<StdoutStderrOption>([duplexTransform]);
expectNotAssignable<StdoutStderrSyncOption>([duplexTransform]);
