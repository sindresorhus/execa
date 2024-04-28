import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinOptionSync,
	type StdoutStderrOption,
	type StdoutStderrOptionSync,
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

expectAssignable<StdinOption>(binaryIterable);
expectAssignable<StdinOptionSync>(binaryIterable);
expectAssignable<StdinOption>([binaryIterable]);
expectAssignable<StdinOptionSync>([binaryIterable]);

expectNotAssignable<StdoutStderrOption>(binaryIterable);
expectNotAssignable<StdoutStderrOptionSync>(binaryIterable);
expectNotAssignable<StdoutStderrOption>([binaryIterable]);
expectNotAssignable<StdoutStderrOptionSync>([binaryIterable]);
