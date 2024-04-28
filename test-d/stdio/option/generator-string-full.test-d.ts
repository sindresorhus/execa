import {expectError, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
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
expectNotAssignable<StdinSyncOption>(stringGeneratorFull);
expectNotAssignable<StdinOption>([stringGeneratorFull]);
expectNotAssignable<StdinSyncOption>([stringGeneratorFull]);

expectNotAssignable<StdoutStderrOption>(stringGeneratorFull);
expectNotAssignable<StdoutStderrSyncOption>(stringGeneratorFull);
expectNotAssignable<StdoutStderrOption>([stringGeneratorFull]);
expectNotAssignable<StdoutStderrSyncOption>([stringGeneratorFull]);
