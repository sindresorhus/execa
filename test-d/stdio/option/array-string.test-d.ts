import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const stringArray = ['foo', 'bar'] as const;

await execa('unicorns', {stdin: [stringArray]});
execaSync('unicorns', {stdin: [stringArray]});

expectError(await execa('unicorns', {stdout: [stringArray]}));
expectError(execaSync('unicorns', {stdout: [stringArray]}));

expectError(await execa('unicorns', {stderr: [stringArray]}));
expectError(execaSync('unicorns', {stderr: [stringArray]}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [stringArray]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [stringArray]]}));
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [[stringArray]]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [[stringArray]]]}));

[stringArray] satisfies StdinOption;
[stringArray] satisfies StdinSyncOption;

expectTypeOf([stringArray]).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf([stringArray]).not.toBeAssignableTo<StdoutStderrSyncOption>();
