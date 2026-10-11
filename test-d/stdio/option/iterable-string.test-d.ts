import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const stringIterableFunction = function * () {
	yield '';
};

const stringIterable = stringIterableFunction();

await execa('unicorns', {stdin: stringIterable});
execaSync('unicorns', {stdin: stringIterable});
await execa('unicorns', {stdin: [stringIterable]});
execaSync('unicorns', {stdin: [stringIterable]});

expectError(await execa('unicorns', {stdout: stringIterable}));
expectError(execaSync('unicorns', {stdout: stringIterable}));
expectError(await execa('unicorns', {stdout: [stringIterable]}));
expectError(execaSync('unicorns', {stdout: [stringIterable]}));

expectError(await execa('unicorns', {stderr: stringIterable}));
expectError(execaSync('unicorns', {stderr: stringIterable}));
expectError(await execa('unicorns', {stderr: [stringIterable]}));
expectError(execaSync('unicorns', {stderr: [stringIterable]}));

expectError(await execa('unicorns', {stdio: stringIterable}));
expectError(execaSync('unicorns', {stdio: stringIterable}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', stringIterable]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', stringIterable]}));
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [stringIterable]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [stringIterable]]}));

expectTypeOf(stringIterable).toBeAssignableTo<StdinOption>();
expectTypeOf(stringIterable).toBeAssignableTo<StdinSyncOption>();
[stringIterable] satisfies StdinOption;
[stringIterable] satisfies StdinSyncOption;

expectTypeOf(stringIterable).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(stringIterable).not.toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf([stringIterable]).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf([stringIterable]).not.toBeAssignableTo<StdoutStderrSyncOption>();
