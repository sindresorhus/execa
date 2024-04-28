import {expectError, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinOptionSync,
	type StdoutStderrOption,
	type StdoutStderrOptionSync,
} from '../../../index.js';

const transformWithInvalidBinary = {
	* transform(line: unknown) {
		yield line;
	},
	binary: 'true',
} as const;

expectError(await execa('unicorns', {stdin: transformWithInvalidBinary}));
expectError(execaSync('unicorns', {stdin: transformWithInvalidBinary}));
expectError(await execa('unicorns', {stdin: [transformWithInvalidBinary]}));
expectError(execaSync('unicorns', {stdin: [transformWithInvalidBinary]}));

expectError(await execa('unicorns', {stdout: transformWithInvalidBinary}));
expectError(execaSync('unicorns', {stdout: transformWithInvalidBinary}));
expectError(await execa('unicorns', {stdout: [transformWithInvalidBinary]}));
expectError(execaSync('unicorns', {stdout: [transformWithInvalidBinary]}));

expectError(await execa('unicorns', {stderr: transformWithInvalidBinary}));
expectError(execaSync('unicorns', {stderr: transformWithInvalidBinary}));
expectError(await execa('unicorns', {stderr: [transformWithInvalidBinary]}));
expectError(execaSync('unicorns', {stderr: [transformWithInvalidBinary]}));

expectError(await execa('unicorns', {stdio: transformWithInvalidBinary}));
expectError(execaSync('unicorns', {stdio: transformWithInvalidBinary}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', transformWithInvalidBinary]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', transformWithInvalidBinary]}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [transformWithInvalidBinary]]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [transformWithInvalidBinary]]}));

expectNotAssignable<StdinOption>(transformWithInvalidBinary);
expectNotAssignable<StdinOptionSync>(transformWithInvalidBinary);
expectNotAssignable<StdinOption>([transformWithInvalidBinary]);
expectNotAssignable<StdinOptionSync>([transformWithInvalidBinary]);

expectNotAssignable<StdoutStderrOption>(transformWithInvalidBinary);
expectNotAssignable<StdoutStderrOptionSync>(transformWithInvalidBinary);
expectNotAssignable<StdoutStderrOption>([transformWithInvalidBinary]);
expectNotAssignable<StdoutStderrOptionSync>([transformWithInvalidBinary]);
