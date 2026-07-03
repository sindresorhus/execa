import {expectError, expectAssignable} from 'tsd';
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

await execa('unicorns', {stdin: stringGeneratorFull});
execaSync('unicorns', {stdin: stringGeneratorFull});
await execa('unicorns', {stdin: [stringGeneratorFull]});
execaSync('unicorns', {stdin: [stringGeneratorFull]});

await execa('unicorns', {stdout: stringGeneratorFull});
execaSync('unicorns', {stdout: stringGeneratorFull});
await execa('unicorns', {stdout: [stringGeneratorFull]});
execaSync('unicorns', {stdout: [stringGeneratorFull]});

await execa('unicorns', {stderr: stringGeneratorFull});
execaSync('unicorns', {stderr: stringGeneratorFull});
await execa('unicorns', {stderr: [stringGeneratorFull]});
execaSync('unicorns', {stderr: [stringGeneratorFull]});

expectError(await execa('unicorns', {stdio: stringGeneratorFull}));
expectError(execaSync('unicorns', {stdio: stringGeneratorFull}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', stringGeneratorFull]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', stringGeneratorFull]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [stringGeneratorFull]]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [stringGeneratorFull]]});

expectAssignable<StdinOption>(stringGeneratorFull);
expectAssignable<StdinSyncOption>(stringGeneratorFull);
expectAssignable<StdinOption>([stringGeneratorFull]);
expectAssignable<StdinSyncOption>([stringGeneratorFull]);

expectAssignable<StdoutStderrOption>(stringGeneratorFull);
expectAssignable<StdoutStderrSyncOption>(stringGeneratorFull);
expectAssignable<StdoutStderrOption>([stringGeneratorFull]);
expectAssignable<StdoutStderrSyncOption>([stringGeneratorFull]);
