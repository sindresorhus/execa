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

const stringGeneratorFull = {
	* transform(line: string) {
		yield line;
	},
} as const;

expectError(await execa('unicorns', {stdin: stringGeneratorFull}));
expectError(execaSync('unicorns', {stdin: stringGeneratorFull}));
expectError(await execa('unicorns', {stdin: [stringGeneratorFull]}));
expectError(execaSync('unicorns', {stdin: [stringGeneratorFull]}));

expectError(await execa('unicorns', {stdout: stringGeneratorFull}));
expectError(execaSync('unicorns', {stdout: stringGeneratorFull}));
expectError(await execa('unicorns', {stdout: [stringGeneratorFull]}));
expectError(execaSync('unicorns', {stdout: [stringGeneratorFull]}));

expectError(await execa('unicorns', {stderr: stringGeneratorFull}));
expectError(execaSync('unicorns', {stderr: stringGeneratorFull}));
expectError(await execa('unicorns', {stderr: [stringGeneratorFull]}));
expectError(execaSync('unicorns', {stderr: [stringGeneratorFull]}));

expectError(await execa('unicorns', {stdio: stringGeneratorFull}));
expectError(execaSync('unicorns', {stdio: stringGeneratorFull}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', stringGeneratorFull]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', stringGeneratorFull]}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [stringGeneratorFull]]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [stringGeneratorFull]]}));

expectNotAssignable<StdinOption>(stringGeneratorFull);
expectNotAssignable<StdinOptionSync>(stringGeneratorFull);
expectNotAssignable<StdinOption>([stringGeneratorFull]);
expectNotAssignable<StdinOptionSync>([stringGeneratorFull]);

expectNotAssignable<StdoutStderrOption>(stringGeneratorFull);
expectNotAssignable<StdoutStderrOptionSync>(stringGeneratorFull);
expectNotAssignable<StdoutStderrOption>([stringGeneratorFull]);
expectNotAssignable<StdoutStderrOptionSync>([stringGeneratorFull]);

expectNotAssignable<StdioOption>(stringGeneratorFull);
expectNotAssignable<StdioOptionSync>(stringGeneratorFull);
expectNotAssignable<StdioOption>([stringGeneratorFull]);
expectNotAssignable<StdioOptionSync>([stringGeneratorFull]);
