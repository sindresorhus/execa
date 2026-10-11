import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const binaryIterableFunction = function * () {
	yield new Uint8Array(0);
};

const binaryIterable = binaryIterableFunction();

await execa('unicorns', {stdin: binaryIterable});
execaSync('unicorns', {stdin: binaryIterable});
await execa('unicorns', {stdin: [binaryIterable]});
execaSync('unicorns', {stdin: [binaryIterable]});

expectError(await execa('unicorns', {stdout: binaryIterable}));
expectError(execaSync('unicorns', {stdout: binaryIterable}));
expectError(await execa('unicorns', {stdout: [binaryIterable]}));
expectError(execaSync('unicorns', {stdout: [binaryIterable]}));

expectError(await execa('unicorns', {stderr: binaryIterable}));
expectError(execaSync('unicorns', {stderr: binaryIterable}));
expectError(await execa('unicorns', {stderr: [binaryIterable]}));
expectError(execaSync('unicorns', {stderr: [binaryIterable]}));

expectError(await execa('unicorns', {stdio: binaryIterable}));
expectError(execaSync('unicorns', {stdio: binaryIterable}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', binaryIterable]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', binaryIterable]}));
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [binaryIterable]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [binaryIterable]]}));

expectTypeOf(binaryIterable).toBeAssignableTo<StdinOption>();
expectTypeOf(binaryIterable).toBeAssignableTo<StdinSyncOption>();
[binaryIterable] satisfies StdinOption;
[binaryIterable] satisfies StdinSyncOption;

expectTypeOf(binaryIterable).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(binaryIterable).not.toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf([binaryIterable]).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf([binaryIterable]).not.toBeAssignableTo<StdoutStderrSyncOption>();
