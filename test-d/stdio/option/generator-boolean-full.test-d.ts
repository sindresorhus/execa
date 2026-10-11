import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const booleanGeneratorFull = {
	// eslint-disable-next-line unicorn/consistent-boolean-name -- `line` matches the naming convention used by every other generator test file, mistyped on purpose to test the type error.
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

expectTypeOf(booleanGeneratorFull).not.toBeAssignableTo<StdinOption>();
expectTypeOf(booleanGeneratorFull).not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf([booleanGeneratorFull]).not.toBeAssignableTo<StdinOption>();
expectTypeOf([booleanGeneratorFull]).not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf(booleanGeneratorFull).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(booleanGeneratorFull).not.toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf([booleanGeneratorFull]).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf([booleanGeneratorFull]).not.toBeAssignableTo<StdoutStderrSyncOption>();
