import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const asyncFinalFull = {
	async * transform(line: unknown) {
		yield '';
	},
	async * final() {
		yield '';
	},
} as const;

await execa('unicorns', {stdin: asyncFinalFull});
expectError(execaSync('unicorns', {stdin: asyncFinalFull}));
await execa('unicorns', {stdin: [asyncFinalFull]});
expectError(execaSync('unicorns', {stdin: [asyncFinalFull]}));

await execa('unicorns', {stdout: asyncFinalFull});
expectError(execaSync('unicorns', {stdout: asyncFinalFull}));
await execa('unicorns', {stdout: [asyncFinalFull]});
expectError(execaSync('unicorns', {stdout: [asyncFinalFull]}));

await execa('unicorns', {stderr: asyncFinalFull});
expectError(execaSync('unicorns', {stderr: asyncFinalFull}));
await execa('unicorns', {stderr: [asyncFinalFull]});
expectError(execaSync('unicorns', {stderr: [asyncFinalFull]}));

expectError(await execa('unicorns', {stdio: asyncFinalFull}));
expectError(execaSync('unicorns', {stdio: asyncFinalFull}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', asyncFinalFull]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', asyncFinalFull]}));
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [asyncFinalFull]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [asyncFinalFull]]}));

expectTypeOf(asyncFinalFull).toBeAssignableTo<StdinOption>();
expectTypeOf(asyncFinalFull).not.toBeAssignableTo<StdinSyncOption>();
[asyncFinalFull] satisfies StdinOption;
expectTypeOf([asyncFinalFull]).not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf(asyncFinalFull).toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(asyncFinalFull).not.toBeAssignableTo<StdoutStderrSyncOption>();
[asyncFinalFull] satisfies StdoutStderrOption;
expectTypeOf([asyncFinalFull]).not.toBeAssignableTo<StdoutStderrSyncOption>();
