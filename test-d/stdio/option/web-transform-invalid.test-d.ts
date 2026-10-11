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

const webTransformWithInvalidObjectMode = {
	transform: new TransformStream(),
	objectMode: 'true',
} as const;

expectError(await execa('unicorns', {stdin: webTransformWithInvalidObjectMode}));
expectError(execaSync('unicorns', {stdin: webTransformWithInvalidObjectMode}));
expectError(await execa('unicorns', {stdin: [webTransformWithInvalidObjectMode]}));
expectError(execaSync('unicorns', {stdin: [webTransformWithInvalidObjectMode]}));

expectError(await execa('unicorns', {stdout: webTransformWithInvalidObjectMode}));
expectError(execaSync('unicorns', {stdout: webTransformWithInvalidObjectMode}));
expectError(await execa('unicorns', {stdout: [webTransformWithInvalidObjectMode]}));
expectError(execaSync('unicorns', {stdout: [webTransformWithInvalidObjectMode]}));

expectError(await execa('unicorns', {stderr: webTransformWithInvalidObjectMode}));
expectError(execaSync('unicorns', {stderr: webTransformWithInvalidObjectMode}));
expectError(await execa('unicorns', {stderr: [webTransformWithInvalidObjectMode]}));
expectError(execaSync('unicorns', {stderr: [webTransformWithInvalidObjectMode]}));

expectError(await execa('unicorns', {stdio: webTransformWithInvalidObjectMode}));
expectError(execaSync('unicorns', {stdio: webTransformWithInvalidObjectMode}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', webTransformWithInvalidObjectMode]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', webTransformWithInvalidObjectMode]}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [webTransformWithInvalidObjectMode]]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [webTransformWithInvalidObjectMode]]}));

expectTypeOf(webTransformWithInvalidObjectMode).not.toBeAssignableTo<StdinOption>();
expectTypeOf(webTransformWithInvalidObjectMode).not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf([webTransformWithInvalidObjectMode]).not.toBeAssignableTo<StdinOption>();
expectTypeOf([webTransformWithInvalidObjectMode]).not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf(webTransformWithInvalidObjectMode).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(webTransformWithInvalidObjectMode).not.toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf([webTransformWithInvalidObjectMode]).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf([webTransformWithInvalidObjectMode]).not.toBeAssignableTo<StdoutStderrSyncOption>();
