import {expectError, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const booleanGeneratorFull = {
	* transform(line: boolean) {
		yield line;
	},
} as const;

expectError(await execa('unicorns', {stdin: booleanGeneratorFull}));
expectError(execaSync('unicorns', {stdin: booleanGeneratorFull}));
expectError(await execa('unicorns', {stdin: [booleanGeneratorFull]}));
expectError(execaSync('unicorns', {stdin: [booleanGeneratorFull]}));

expectError(await execa('unicorns', {stdout: booleanGeneratorFull}));
expectError(execaSync('unicorns', {stdout: booleanGeneratorFull}));
expectError(await execa('unicorns', {stdout: [booleanGeneratorFull]}));
expectError(execaSync('unicorns', {stdout: [booleanGeneratorFull]}));

expectError(await execa('unicorns', {stderr: booleanGeneratorFull}));
expectError(execaSync('unicorns', {stderr: booleanGeneratorFull}));
expectError(await execa('unicorns', {stderr: [booleanGeneratorFull]}));
expectError(execaSync('unicorns', {stderr: [booleanGeneratorFull]}));

expectError(await execa('unicorns', {stdio: booleanGeneratorFull}));
expectError(execaSync('unicorns', {stdio: booleanGeneratorFull}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', booleanGeneratorFull]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', booleanGeneratorFull]}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [booleanGeneratorFull]]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [booleanGeneratorFull]]}));

expectNotAssignable<StdinOption>(booleanGeneratorFull);
expectNotAssignable<StdinSyncOption>(booleanGeneratorFull);
expectNotAssignable<StdinOption>([booleanGeneratorFull]);
expectNotAssignable<StdinSyncOption>([booleanGeneratorFull]);

expectNotAssignable<StdoutStderrOption>(booleanGeneratorFull);
expectNotAssignable<StdoutStderrSyncOption>(booleanGeneratorFull);
expectNotAssignable<StdoutStderrOption>([booleanGeneratorFull]);
expectNotAssignable<StdoutStderrSyncOption>([booleanGeneratorFull]);
