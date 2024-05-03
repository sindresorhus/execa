import {expectError, expectAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const unknownGeneratorFull = {
	* transform(line: unknown) {
		yield line;
	},
	objectMode: true,
} as const;

await execa('unicorns', {stdin: unknownGeneratorFull});
execaSync('unicorns', {stdin: unknownGeneratorFull});
await execa('unicorns', {stdin: [unknownGeneratorFull]});
execaSync('unicorns', {stdin: [unknownGeneratorFull]});

await execa('unicorns', {stdout: unknownGeneratorFull});
execaSync('unicorns', {stdout: unknownGeneratorFull});
await execa('unicorns', {stdout: [unknownGeneratorFull]});
execaSync('unicorns', {stdout: [unknownGeneratorFull]});

await execa('unicorns', {stderr: unknownGeneratorFull});
execaSync('unicorns', {stderr: unknownGeneratorFull});
await execa('unicorns', {stderr: [unknownGeneratorFull]});
execaSync('unicorns', {stderr: [unknownGeneratorFull]});

expectError(await execa('unicorns', {stdio: unknownGeneratorFull}));
expectError(execaSync('unicorns', {stdio: unknownGeneratorFull}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', unknownGeneratorFull]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', unknownGeneratorFull]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [unknownGeneratorFull]]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [unknownGeneratorFull]]});

expectAssignable<StdinOption>(unknownGeneratorFull);
expectAssignable<StdinSyncOption>(unknownGeneratorFull);
expectAssignable<StdinOption>([unknownGeneratorFull]);
expectAssignable<StdinSyncOption>([unknownGeneratorFull]);

expectAssignable<StdoutStderrOption>(unknownGeneratorFull);
expectAssignable<StdoutStderrSyncOption>(unknownGeneratorFull);
expectAssignable<StdoutStderrOption>([unknownGeneratorFull]);
expectAssignable<StdoutStderrSyncOption>([unknownGeneratorFull]);
