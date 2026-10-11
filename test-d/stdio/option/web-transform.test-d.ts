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

expectTypeOf(webTransform).toBeAssignableTo<StdinOption>();
expectTypeOf(webTransform).not.toBeAssignableTo<StdinSyncOption>();
[webTransform] satisfies StdinOption;
expectTypeOf([webTransform]).not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf(webTransform).toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(webTransform).not.toBeAssignableTo<StdoutStderrSyncOption>();
[webTransform] satisfies StdoutStderrOption;
expectTypeOf([webTransform]).not.toBeAssignableTo<StdoutStderrSyncOption>();
