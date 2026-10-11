import {expectTypeOf, expectError} from 'nz';
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

expectTypeOf(asyncGeneratorFull).toBeAssignableTo<StdinOption>();
expectTypeOf(asyncGeneratorFull).not.toBeAssignableTo<StdinSyncOption>();
[asyncGeneratorFull] satisfies StdinOption;
expectTypeOf([asyncGeneratorFull]).not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf(asyncGeneratorFull).toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(asyncGeneratorFull).not.toBeAssignableTo<StdoutStderrSyncOption>();
[asyncGeneratorFull] satisfies StdoutStderrOption;
expectTypeOf([asyncGeneratorFull]).not.toBeAssignableTo<StdoutStderrSyncOption>();
