import {expectError, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const invalidReturnFinalFull = {
	* transform(line: string) {
		yield line;
	},
	* final() {
		yield {} as unknown;
		return false;
	},
} as const;

expectError(await execa('unicorns', {stdin: invalidReturnFinalFull}));
expectError(execaSync('unicorns', {stdin: invalidReturnFinalFull}));
expectError(await execa('unicorns', {stdin: [invalidReturnFinalFull]}));
expectError(execaSync('unicorns', {stdin: [invalidReturnFinalFull]}));

expectError(await execa('unicorns', {stdout: invalidReturnFinalFull}));
expectError(execaSync('unicorns', {stdout: invalidReturnFinalFull}));
expectError(await execa('unicorns', {stdout: [invalidReturnFinalFull]}));
expectError(execaSync('unicorns', {stdout: [invalidReturnFinalFull]}));

expectError(await execa('unicorns', {stderr: invalidReturnFinalFull}));
expectError(execaSync('unicorns', {stderr: invalidReturnFinalFull}));
expectError(await execa('unicorns', {stderr: [invalidReturnFinalFull]}));
expectError(execaSync('unicorns', {stderr: [invalidReturnFinalFull]}));

expectError(await execa('unicorns', {stdio: invalidReturnFinalFull}));
expectError(execaSync('unicorns', {stdio: invalidReturnFinalFull}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', invalidReturnFinalFull]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', invalidReturnFinalFull]}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [invalidReturnFinalFull]]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [invalidReturnFinalFull]]}));

expectNotAssignable<StdinOption>(invalidReturnFinalFull);
expectNotAssignable<StdinSyncOption>(invalidReturnFinalFull);
expectNotAssignable<StdinOption>([invalidReturnFinalFull]);
expectNotAssignable<StdinSyncOption>([invalidReturnFinalFull]);

expectNotAssignable<StdoutStderrOption>(invalidReturnFinalFull);
expectNotAssignable<StdoutStderrSyncOption>(invalidReturnFinalFull);
expectNotAssignable<StdoutStderrOption>([invalidReturnFinalFull]);
expectNotAssignable<StdoutStderrSyncOption>([invalidReturnFinalFull]);
