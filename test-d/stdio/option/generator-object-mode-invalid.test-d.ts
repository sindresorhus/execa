import {expectError, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinOptionSync,
	type StdoutStderrOption,
	type StdoutStderrOptionSync,
	type StdioOption,
	type StdioOptionSync,
} from '../../../index.js';

const transformWithInvalidObjectMode = {
	* transform(line: unknown) {
		yield line;
	},
	objectMode: 'true',
} as const;

expectError(await execa('unicorns', {stdin: transformWithInvalidObjectMode}));
expectError(execaSync('unicorns', {stdin: transformWithInvalidObjectMode}));
expectError(await execa('unicorns', {stdin: [transformWithInvalidObjectMode]}));
expectError(execaSync('unicorns', {stdin: [transformWithInvalidObjectMode]}));

expectError(await execa('unicorns', {stdout: transformWithInvalidObjectMode}));
expectError(execaSync('unicorns', {stdout: transformWithInvalidObjectMode}));
expectError(await execa('unicorns', {stdout: [transformWithInvalidObjectMode]}));
expectError(execaSync('unicorns', {stdout: [transformWithInvalidObjectMode]}));

expectError(await execa('unicorns', {stderr: transformWithInvalidObjectMode}));
expectError(execaSync('unicorns', {stderr: transformWithInvalidObjectMode}));
expectError(await execa('unicorns', {stderr: [transformWithInvalidObjectMode]}));
expectError(execaSync('unicorns', {stderr: [transformWithInvalidObjectMode]}));

expectError(await execa('unicorns', {stdio: transformWithInvalidObjectMode}));
expectError(execaSync('unicorns', {stdio: transformWithInvalidObjectMode}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', transformWithInvalidObjectMode]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', transformWithInvalidObjectMode]}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [transformWithInvalidObjectMode]]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [transformWithInvalidObjectMode]]}));

expectNotAssignable<StdinOption>(transformWithInvalidObjectMode);
expectNotAssignable<StdinOptionSync>(transformWithInvalidObjectMode);
expectNotAssignable<StdinOption>([transformWithInvalidObjectMode]);
expectNotAssignable<StdinOptionSync>([transformWithInvalidObjectMode]);

expectNotAssignable<StdoutStderrOption>(transformWithInvalidObjectMode);
expectNotAssignable<StdoutStderrOptionSync>(transformWithInvalidObjectMode);
expectNotAssignable<StdoutStderrOption>([transformWithInvalidObjectMode]);
expectNotAssignable<StdoutStderrOptionSync>([transformWithInvalidObjectMode]);

expectNotAssignable<StdioOption>(transformWithInvalidObjectMode);
expectNotAssignable<StdioOptionSync>(transformWithInvalidObjectMode);
expectNotAssignable<StdioOption>([transformWithInvalidObjectMode]);
expectNotAssignable<StdioOptionSync>([transformWithInvalidObjectMode]);
