import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const objectIterableFunction = function * () {
	yield {};
};

const objectIterable = objectIterableFunction();

await execa('unicorns', {stdin: objectIterable});
execaSync('unicorns', {stdin: objectIterable});
await execa('unicorns', {stdin: [objectIterable]});
execaSync('unicorns', {stdin: [objectIterable]});

expectError(await execa('unicorns', {stdout: objectIterable}));
expectError(execaSync('unicorns', {stdout: objectIterable}));
expectError(await execa('unicorns', {stdout: [objectIterable]}));
expectError(execaSync('unicorns', {stdout: [objectIterable]}));

expectError(await execa('unicorns', {stderr: objectIterable}));
expectError(execaSync('unicorns', {stderr: objectIterable}));
expectError(await execa('unicorns', {stderr: [objectIterable]}));
expectError(execaSync('unicorns', {stderr: [objectIterable]}));

expectError(await execa('unicorns', {stdio: objectIterable}));
expectError(execaSync('unicorns', {stdio: objectIterable}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', objectIterable]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', objectIterable]}));
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [objectIterable]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [objectIterable]]}));

expectTypeOf(objectIterable).toBeAssignableTo<StdinOption>();
expectTypeOf(objectIterable).toBeAssignableTo<StdinSyncOption>();
[objectIterable] satisfies StdinOption;
[objectIterable] satisfies StdinSyncOption;

expectTypeOf(objectIterable).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(objectIterable).not.toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf([objectIterable]).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf([objectIterable]).not.toBeAssignableTo<StdoutStderrSyncOption>();
