import {expectTypeOf, expectError} from 'nz';
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

expectTypeOf(invalidReturnFinalFull).not.toBeAssignableTo<StdinOption>();
expectTypeOf(invalidReturnFinalFull).not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf([invalidReturnFinalFull]).not.toBeAssignableTo<StdinOption>();
expectTypeOf([invalidReturnFinalFull]).not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf(invalidReturnFinalFull).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(invalidReturnFinalFull).not.toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf([invalidReturnFinalFull]).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf([invalidReturnFinalFull]).not.toBeAssignableTo<StdoutStderrSyncOption>();
