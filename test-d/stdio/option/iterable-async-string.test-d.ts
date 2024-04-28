import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const asyncStringIterableFunction = async function * () {
	yield '';
};

const asyncStringIterable = asyncStringIterableFunction();

await execa('unicorns', {stdin: asyncStringIterable});
expectError(execaSync('unicorns', {stdin: asyncStringIterable}));
await execa('unicorns', {stdin: [asyncStringIterable]});
expectError(execaSync('unicorns', {stdin: [asyncStringIterable]}));

expectError(await execa('unicorns', {stdout: asyncStringIterable}));
expectError(execaSync('unicorns', {stdout: asyncStringIterable}));
expectError(await execa('unicorns', {stdout: [asyncStringIterable]}));
expectError(execaSync('unicorns', {stdout: [asyncStringIterable]}));

expectError(await execa('unicorns', {stderr: asyncStringIterable}));
expectError(execaSync('unicorns', {stderr: asyncStringIterable}));
expectError(await execa('unicorns', {stderr: [asyncStringIterable]}));
expectError(execaSync('unicorns', {stderr: [asyncStringIterable]}));

expectError(await execa('unicorns', {stdio: asyncStringIterable}));
expectError(execaSync('unicorns', {stdio: asyncStringIterable}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', asyncStringIterable]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', asyncStringIterable]}));
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [asyncStringIterable]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [asyncStringIterable]]}));

expectAssignable<StdinOption>(asyncStringIterable);
expectNotAssignable<StdinSyncOption>(asyncStringIterable);
expectAssignable<StdinOption>([asyncStringIterable]);
expectNotAssignable<StdinSyncOption>([asyncStringIterable]);

expectNotAssignable<StdoutStderrOption>(asyncStringIterable);
expectNotAssignable<StdoutStderrSyncOption>(asyncStringIterable);
expectNotAssignable<StdoutStderrOption>([asyncStringIterable]);
expectNotAssignable<StdoutStderrSyncOption>([asyncStringIterable]);
