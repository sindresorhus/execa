import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const binaryArray = [new Uint8Array(), new Uint8Array()] as const;

await execa('unicorns', {stdin: [binaryArray]});
execaSync('unicorns', {stdin: [binaryArray]});

expectError(await execa('unicorns', {stdout: [binaryArray]}));
expectError(execaSync('unicorns', {stdout: [binaryArray]}));

expectError(await execa('unicorns', {stderr: [binaryArray]}));
expectError(execaSync('unicorns', {stderr: [binaryArray]}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [binaryArray]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [binaryArray]]}));
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [[binaryArray]]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [[binaryArray]]]}));

[binaryArray] satisfies StdinOption;
[binaryArray] satisfies StdinSyncOption;

expectTypeOf([binaryArray]).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf([binaryArray]).not.toBeAssignableTo<StdoutStderrSyncOption>();
