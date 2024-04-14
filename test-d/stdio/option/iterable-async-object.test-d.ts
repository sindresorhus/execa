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

expectAssignable<StdinOption>(asyncObjectIterable);
expectNotAssignable<StdinOptionSync>(asyncObjectIterable);
expectAssignable<StdinOption>([asyncObjectIterable]);
expectNotAssignable<StdinOptionSync>([asyncObjectIterable]);

expectNotAssignable<StdoutStderrOption>(asyncObjectIterable);
expectNotAssignable<StdoutStderrOptionSync>(asyncObjectIterable);
expectNotAssignable<StdoutStderrOption>([asyncObjectIterable]);
expectNotAssignable<StdoutStderrOptionSync>([asyncObjectIterable]);

expectAssignable<StdioOption>(asyncObjectIterable);
expectNotAssignable<StdioOptionSync>(asyncObjectIterable);
expectAssignable<StdioOption>([asyncObjectIterable]);
expectNotAssignable<StdioOptionSync>([asyncObjectIterable]);
