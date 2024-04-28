import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
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

expectAssignable<StdinOption>(objectIterable);
expectAssignable<StdinSyncOption>(objectIterable);
expectAssignable<StdinOption>([objectIterable]);
expectAssignable<StdinSyncOption>([objectIterable]);

expectNotAssignable<StdoutStderrOption>(objectIterable);
expectNotAssignable<StdoutStderrSyncOption>(objectIterable);
expectNotAssignable<StdoutStderrOption>([objectIterable]);
expectNotAssignable<StdoutStderrSyncOption>([objectIterable]);
