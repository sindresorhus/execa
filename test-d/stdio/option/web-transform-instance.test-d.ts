import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const webTransformInstance = new TransformStream();

await execa('unicorns', {stdin: webTransformInstance});
expectError(execaSync('unicorns', {stdin: webTransformInstance}));
await execa('unicorns', {stdin: [webTransformInstance]});
expectError(execaSync('unicorns', {stdin: [webTransformInstance]}));

await execa('unicorns', {stdout: webTransformInstance});
expectError(execaSync('unicorns', {stdout: webTransformInstance}));
await execa('unicorns', {stdout: [webTransformInstance]});
expectError(execaSync('unicorns', {stdout: [webTransformInstance]}));

await execa('unicorns', {stderr: webTransformInstance});
expectError(execaSync('unicorns', {stderr: webTransformInstance}));
await execa('unicorns', {stderr: [webTransformInstance]});
expectError(execaSync('unicorns', {stderr: [webTransformInstance]}));

expectError(await execa('unicorns', {stdio: webTransformInstance}));
expectError(execaSync('unicorns', {stdio: webTransformInstance}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', webTransformInstance]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', webTransformInstance]}));
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [webTransformInstance]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [webTransformInstance]]}));

expectAssignable<StdinOption>(webTransformInstance);
expectNotAssignable<StdinSyncOption>(webTransformInstance);
expectAssignable<StdinOption>([webTransformInstance]);
expectNotAssignable<StdinSyncOption>([webTransformInstance]);

expectAssignable<StdoutStderrOption>(webTransformInstance);
expectNotAssignable<StdoutStderrSyncOption>(webTransformInstance);
expectAssignable<StdoutStderrOption>([webTransformInstance]);
expectNotAssignable<StdoutStderrSyncOption>([webTransformInstance]);
