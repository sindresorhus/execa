import {TransformStream} from 'node:stream/web';
import {expectTypeOf, expectError} from 'nz';
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

expectTypeOf(webTransformInstance).toBeAssignableTo<StdinOption>();
expectTypeOf(webTransformInstance).not.toBeAssignableTo<StdinSyncOption>();
[webTransformInstance] satisfies StdinOption;
expectTypeOf([webTransformInstance]).not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf(webTransformInstance).toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(webTransformInstance).not.toBeAssignableTo<StdoutStderrSyncOption>();
[webTransformInstance] satisfies StdoutStderrOption;
expectTypeOf([webTransformInstance]).not.toBeAssignableTo<StdoutStderrSyncOption>();
