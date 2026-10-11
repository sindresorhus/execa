import {expectTypeOf, expectError} from 'nz';
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

expectTypeOf(unknownGeneratorFull).toBeAssignableTo<StdinOption>();
expectTypeOf(unknownGeneratorFull).toBeAssignableTo<StdinSyncOption>();
[unknownGeneratorFull] satisfies StdinOption;
[unknownGeneratorFull] satisfies StdinSyncOption;

expectTypeOf(unknownGeneratorFull).toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(unknownGeneratorFull).toBeAssignableTo<StdoutStderrSyncOption>();
[unknownGeneratorFull] satisfies StdoutStderrOption;
[unknownGeneratorFull] satisfies StdoutStderrSyncOption;
