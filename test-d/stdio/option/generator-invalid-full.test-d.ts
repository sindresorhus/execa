import {expectError, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
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
expectNotAssignable<StdinSyncOption>(invalidReturnGeneratorFull);
expectNotAssignable<StdinOption>([invalidReturnGeneratorFull]);
expectNotAssignable<StdinSyncOption>([invalidReturnGeneratorFull]);

expectNotAssignable<StdoutStderrOption>(invalidReturnGeneratorFull);
expectNotAssignable<StdoutStderrSyncOption>(invalidReturnGeneratorFull);
expectNotAssignable<StdoutStderrOption>([invalidReturnGeneratorFull]);
expectNotAssignable<StdoutStderrSyncOption>([invalidReturnGeneratorFull]);
