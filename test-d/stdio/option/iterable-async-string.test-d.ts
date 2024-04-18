import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinOptionSync,
	type StdoutStderrOption,
	type StdoutStderrOptionSync,
	type StdioOption,
	type StdioOptionSync,
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
expectNotAssignable<StdinOptionSync>(asyncStringIterable);
expectAssignable<StdinOption>([asyncStringIterable]);
expectNotAssignable<StdinOptionSync>([asyncStringIterable]);

expectNotAssignable<StdoutStderrOption>(asyncStringIterable);
expectNotAssignable<StdoutStderrOptionSync>(asyncStringIterable);
expectNotAssignable<StdoutStderrOption>([asyncStringIterable]);
expectNotAssignable<StdoutStderrOptionSync>([asyncStringIterable]);

expectAssignable<StdioOption>(asyncStringIterable);
expectNotAssignable<StdioOptionSync>(asyncStringIterable);
expectAssignable<StdioOption>([asyncStringIterable]);
expectNotAssignable<StdioOptionSync>([asyncStringIterable]);
