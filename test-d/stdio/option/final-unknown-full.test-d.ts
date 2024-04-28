import {expectError, expectAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const unknownFinalFull = {
	* transform(line: unknown) {
		yield line;
	},
	* final() {
		yield {} as unknown;
	},
	objectMode: true,
} as const;

await execa('unicorns', {stdin: unknownFinalFull});
execaSync('unicorns', {stdin: unknownFinalFull});
await execa('unicorns', {stdin: [unknownFinalFull]});
execaSync('unicorns', {stdin: [unknownFinalFull]});

await execa('unicorns', {stdout: unknownFinalFull});
execaSync('unicorns', {stdout: unknownFinalFull});
await execa('unicorns', {stdout: [unknownFinalFull]});
execaSync('unicorns', {stdout: [unknownFinalFull]});

await execa('unicorns', {stderr: unknownFinalFull});
execaSync('unicorns', {stderr: unknownFinalFull});
await execa('unicorns', {stderr: [unknownFinalFull]});
execaSync('unicorns', {stderr: [unknownFinalFull]});

expectError(await execa('unicorns', {stdio: unknownFinalFull}));
expectError(execaSync('unicorns', {stdio: unknownFinalFull}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', unknownFinalFull]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', unknownFinalFull]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [unknownFinalFull]]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [unknownFinalFull]]});

expectAssignable<StdinOption>(unknownFinalFull);
expectAssignable<StdinSyncOption>(unknownFinalFull);
expectAssignable<StdinOption>([unknownFinalFull]);
expectAssignable<StdinSyncOption>([unknownFinalFull]);

expectAssignable<StdoutStderrOption>(unknownFinalFull);
expectAssignable<StdoutStderrSyncOption>(unknownFinalFull);
expectAssignable<StdoutStderrOption>([unknownFinalFull]);
expectAssignable<StdoutStderrSyncOption>([unknownFinalFull]);
