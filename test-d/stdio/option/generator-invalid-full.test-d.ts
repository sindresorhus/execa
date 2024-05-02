import {expectError, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinOptionSync,
	type StdoutStderrOption,
	type StdoutStderrOptionSync,
} from '../../../index.js';

const invalidReturnGeneratorFull = {
	* transform(line: unknown) {
		yield line;
		return false;
	},
} as const;

expectError(await execa('unicorns', {stdin: invalidReturnGeneratorFull}));
expectError(execaSync('unicorns', {stdin: invalidReturnGeneratorFull}));
expectError(await execa('unicorns', {stdin: [invalidReturnGeneratorFull]}));
expectError(execaSync('unicorns', {stdin: [invalidReturnGeneratorFull]}));

expectError(await execa('unicorns', {stdout: invalidReturnGeneratorFull}));
expectError(execaSync('unicorns', {stdout: invalidReturnGeneratorFull}));
expectError(await execa('unicorns', {stdout: [invalidReturnGeneratorFull]}));
expectError(execaSync('unicorns', {stdout: [invalidReturnGeneratorFull]}));

expectError(await execa('unicorns', {stderr: invalidReturnGeneratorFull}));
expectError(execaSync('unicorns', {stderr: invalidReturnGeneratorFull}));
expectError(await execa('unicorns', {stderr: [invalidReturnGeneratorFull]}));
expectError(execaSync('unicorns', {stderr: [invalidReturnGeneratorFull]}));

expectError(await execa('unicorns', {stdio: invalidReturnGeneratorFull}));
expectError(execaSync('unicorns', {stdio: invalidReturnGeneratorFull}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', invalidReturnGeneratorFull]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', invalidReturnGeneratorFull]}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [invalidReturnGeneratorFull]]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [invalidReturnGeneratorFull]]}));

expectNotAssignable<StdinOption>(invalidReturnGeneratorFull);
expectNotAssignable<StdinOptionSync>(invalidReturnGeneratorFull);
expectNotAssignable<StdinOption>([invalidReturnGeneratorFull]);
expectNotAssignable<StdinOptionSync>([invalidReturnGeneratorFull]);

expectNotAssignable<StdoutStderrOption>(invalidReturnGeneratorFull);
expectNotAssignable<StdoutStderrOptionSync>(invalidReturnGeneratorFull);
expectNotAssignable<StdoutStderrOption>([invalidReturnGeneratorFull]);
expectNotAssignable<StdoutStderrOptionSync>([invalidReturnGeneratorFull]);
