import {TransformStream} from 'node:stream/web';
import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const webTransformObject = {
	transform: new TransformStream(),
	objectMode: true as const,
} as const;

await execa('unicorns', {stdin: webTransformObject});
expectError(execaSync('unicorns', {stdin: webTransformObject}));
await execa('unicorns', {stdin: [webTransformObject]});
expectError(execaSync('unicorns', {stdin: [webTransformObject]}));

await execa('unicorns', {stdout: webTransformObject});
expectError(execaSync('unicorns', {stdout: webTransformObject}));
await execa('unicorns', {stdout: [webTransformObject]});
expectError(execaSync('unicorns', {stdout: [webTransformObject]}));

await execa('unicorns', {stderr: webTransformObject});
expectError(execaSync('unicorns', {stderr: webTransformObject}));
await execa('unicorns', {stderr: [webTransformObject]});
expectError(execaSync('unicorns', {stderr: [webTransformObject]}));

expectError(await execa('unicorns', {stdio: webTransformObject}));
expectError(execaSync('unicorns', {stdio: webTransformObject}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', webTransformObject]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', webTransformObject]}));
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [webTransformObject]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [webTransformObject]]}));

expectAssignable<StdinOption>(webTransformObject);
expectNotAssignable<StdinSyncOption>(webTransformObject);
expectAssignable<StdinOption>([webTransformObject]);
expectNotAssignable<StdinSyncOption>([webTransformObject]);

expectAssignable<StdoutStderrOption>(webTransformObject);
expectNotAssignable<StdoutStderrSyncOption>(webTransformObject);
expectAssignable<StdoutStderrOption>([webTransformObject]);
expectNotAssignable<StdoutStderrSyncOption>([webTransformObject]);
