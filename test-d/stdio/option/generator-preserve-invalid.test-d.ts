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

const transformWithInvalidPreserveNewlines = {
	* transform(line: unknown) {
		yield line;
	},
	preserveNewlines: 'true',
} as const;

expectError(await execa('unicorns', {stdin: transformWithInvalidPreserveNewlines}));
expectError(execaSync('unicorns', {stdin: transformWithInvalidPreserveNewlines}));
expectError(await execa('unicorns', {stdin: [transformWithInvalidPreserveNewlines]}));
expectError(execaSync('unicorns', {stdin: [transformWithInvalidPreserveNewlines]}));

expectError(await execa('unicorns', {stdout: transformWithInvalidPreserveNewlines}));
expectError(execaSync('unicorns', {stdout: transformWithInvalidPreserveNewlines}));
expectError(await execa('unicorns', {stdout: [transformWithInvalidPreserveNewlines]}));
expectError(execaSync('unicorns', {stdout: [transformWithInvalidPreserveNewlines]}));

expectError(await execa('unicorns', {stderr: transformWithInvalidPreserveNewlines}));
expectError(execaSync('unicorns', {stderr: transformWithInvalidPreserveNewlines}));
expectError(await execa('unicorns', {stderr: [transformWithInvalidPreserveNewlines]}));
expectError(execaSync('unicorns', {stderr: [transformWithInvalidPreserveNewlines]}));

expectError(await execa('unicorns', {stdio: transformWithInvalidPreserveNewlines}));
expectError(execaSync('unicorns', {stdio: transformWithInvalidPreserveNewlines}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', transformWithInvalidPreserveNewlines]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', transformWithInvalidPreserveNewlines]}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [transformWithInvalidPreserveNewlines]]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [transformWithInvalidPreserveNewlines]]}));

expectNotAssignable<StdinOption>(transformWithInvalidPreserveNewlines);
expectNotAssignable<StdinOptionSync>(transformWithInvalidPreserveNewlines);
expectNotAssignable<StdinOption>([transformWithInvalidPreserveNewlines]);
expectNotAssignable<StdinOptionSync>([transformWithInvalidPreserveNewlines]);

expectNotAssignable<StdoutStderrOption>(transformWithInvalidPreserveNewlines);
expectNotAssignable<StdoutStderrOptionSync>(transformWithInvalidPreserveNewlines);
expectNotAssignable<StdoutStderrOption>([transformWithInvalidPreserveNewlines]);
expectNotAssignable<StdoutStderrOptionSync>([transformWithInvalidPreserveNewlines]);

expectNotAssignable<StdioOption>(transformWithInvalidPreserveNewlines);
expectNotAssignable<StdioOptionSync>(transformWithInvalidPreserveNewlines);
expectNotAssignable<StdioOption>([transformWithInvalidPreserveNewlines]);
expectNotAssignable<StdioOptionSync>([transformWithInvalidPreserveNewlines]);
