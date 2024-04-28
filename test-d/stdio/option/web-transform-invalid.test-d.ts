import {expectError, expectNotAssignable} from 'tsd';
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

expectNotAssignable<StdinOption>(webTransformWithInvalidObjectMode);
expectNotAssignable<StdinSyncOption>(webTransformWithInvalidObjectMode);
expectNotAssignable<StdinOption>([webTransformWithInvalidObjectMode]);
expectNotAssignable<StdinSyncOption>([webTransformWithInvalidObjectMode]);

expectNotAssignable<StdoutStderrOption>(webTransformWithInvalidObjectMode);
expectNotAssignable<StdoutStderrSyncOption>(webTransformWithInvalidObjectMode);
expectNotAssignable<StdoutStderrOption>([webTransformWithInvalidObjectMode]);
expectNotAssignable<StdoutStderrSyncOption>([webTransformWithInvalidObjectMode]);
