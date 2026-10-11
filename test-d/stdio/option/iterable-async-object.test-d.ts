import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const asyncObjectIterableFunction = async function * () {
	yield {};
};

const asyncObjectIterable = asyncObjectIterableFunction();

await execa('unicorns', {stdin: asyncObjectIterable});
expectError(execaSync('unicorns', {stdin: asyncObjectIterable}));
await execa('unicorns', {stdin: [asyncObjectIterable]});
expectError(execaSync('unicorns', {stdin: [asyncObjectIterable]}));

expectError(await execa('unicorns', {stdout: asyncObjectIterable}));
expectError(execaSync('unicorns', {stdout: asyncObjectIterable}));
expectError(await execa('unicorns', {stdout: [asyncObjectIterable]}));
expectError(execaSync('unicorns', {stdout: [asyncObjectIterable]}));

expectError(await execa('unicorns', {stderr: asyncObjectIterable}));
expectError(execaSync('unicorns', {stderr: asyncObjectIterable}));
expectError(await execa('unicorns', {stderr: [asyncObjectIterable]}));
expectError(execaSync('unicorns', {stderr: [asyncObjectIterable]}));

expectError(await execa('unicorns', {stdio: asyncObjectIterable}));
expectError(execaSync('unicorns', {stdio: asyncObjectIterable}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', asyncObjectIterable]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', asyncObjectIterable]}));
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [asyncObjectIterable]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [asyncObjectIterable]]}));

expectTypeOf(asyncObjectIterable).toBeAssignableTo<StdinOption>();
expectTypeOf(asyncObjectIterable).not.toBeAssignableTo<StdinSyncOption>();
[asyncObjectIterable] satisfies StdinOption;
expectTypeOf([asyncObjectIterable]).not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf(asyncObjectIterable).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(asyncObjectIterable).not.toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf([asyncObjectIterable]).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf([asyncObjectIterable]).not.toBeAssignableTo<StdoutStderrSyncOption>();
