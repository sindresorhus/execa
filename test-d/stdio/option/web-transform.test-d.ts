import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const webTransform = {transform: new TransformStream()} as const;

await execa('unicorns', {stdin: webTransform});
expectError(execaSync('unicorns', {stdin: webTransform}));
await execa('unicorns', {stdin: [webTransform]});
expectError(execaSync('unicorns', {stdin: [webTransform]}));

await execa('unicorns', {stdout: webTransform});
expectError(execaSync('unicorns', {stdout: webTransform}));
await execa('unicorns', {stdout: [webTransform]});
expectError(execaSync('unicorns', {stdout: [webTransform]}));

await execa('unicorns', {stderr: webTransform});
expectError(execaSync('unicorns', {stderr: webTransform}));
await execa('unicorns', {stderr: [webTransform]});
expectError(execaSync('unicorns', {stderr: [webTransform]}));

expectError(await execa('unicorns', {stdio: webTransform}));
expectError(execaSync('unicorns', {stdio: webTransform}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', webTransform]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', webTransform]}));
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [webTransform]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [webTransform]]}));

expectAssignable<StdinOption>(webTransform);
expectNotAssignable<StdinSyncOption>(webTransform);
expectAssignable<StdinOption>([webTransform]);
expectNotAssignable<StdinSyncOption>([webTransform]);

expectAssignable<StdoutStderrOption>(webTransform);
expectNotAssignable<StdoutStderrSyncOption>(webTransform);
expectAssignable<StdoutStderrOption>([webTransform]);
expectNotAssignable<StdoutStderrSyncOption>([webTransform]);
