import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const asyncGeneratorFull = {
	async * transform(line: unknown) {
		yield '';
	},
} as const;

await execa('unicorns', {stdin: asyncGeneratorFull});
expectError(execaSync('unicorns', {stdin: asyncGeneratorFull}));
await execa('unicorns', {stdin: [asyncGeneratorFull]});
expectError(execaSync('unicorns', {stdin: [asyncGeneratorFull]}));

await execa('unicorns', {stdout: asyncGeneratorFull});
expectError(execaSync('unicorns', {stdout: asyncGeneratorFull}));
await execa('unicorns', {stdout: [asyncGeneratorFull]});
expectError(execaSync('unicorns', {stdout: [asyncGeneratorFull]}));

await execa('unicorns', {stderr: asyncGeneratorFull});
expectError(execaSync('unicorns', {stderr: asyncGeneratorFull}));
await execa('unicorns', {stderr: [asyncGeneratorFull]});
expectError(execaSync('unicorns', {stderr: [asyncGeneratorFull]}));

expectError(await execa('unicorns', {stdio: asyncGeneratorFull}));
expectError(execaSync('unicorns', {stdio: asyncGeneratorFull}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', asyncGeneratorFull]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', asyncGeneratorFull]}));
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [asyncGeneratorFull]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [asyncGeneratorFull]]}));

expectAssignable<StdinOption>(asyncGeneratorFull);
expectNotAssignable<StdinSyncOption>(asyncGeneratorFull);
expectAssignable<StdinOption>([asyncGeneratorFull]);
expectNotAssignable<StdinSyncOption>([asyncGeneratorFull]);

expectAssignable<StdoutStderrOption>(asyncGeneratorFull);
expectNotAssignable<StdoutStderrSyncOption>(asyncGeneratorFull);
expectAssignable<StdoutStderrOption>([asyncGeneratorFull]);
expectNotAssignable<StdoutStderrSyncOption>([asyncGeneratorFull]);
