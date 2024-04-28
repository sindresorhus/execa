import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinOptionSync,
	type StdoutStderrOption,
	type StdoutStderrOptionSync,
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

expectAssignable<StdinOption>(stringIterable);
expectAssignable<StdinOptionSync>(stringIterable);
expectAssignable<StdinOption>([stringIterable]);
expectAssignable<StdinOptionSync>([stringIterable]);

expectNotAssignable<StdoutStderrOption>(stringIterable);
expectNotAssignable<StdoutStderrOptionSync>(stringIterable);
expectNotAssignable<StdoutStderrOption>([stringIterable]);
expectNotAssignable<StdoutStderrOptionSync>([stringIterable]);
