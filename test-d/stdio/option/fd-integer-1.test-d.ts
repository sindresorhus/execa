import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinOptionSync,
	type StdoutStderrOption,
	type StdoutStderrOptionSync,
} from '../../../index.js';

expectError(await execa('unicorns', {stdin: 1}));
expectError(execaSync('unicorns', {stdin: 1}));
expectError(await execa('unicorns', {stdin: [1]}));
expectError(execaSync('unicorns', {stdin: [1]}));

await execa('unicorns', {stdout: 1});
execaSync('unicorns', {stdout: 1});
await execa('unicorns', {stdout: [1]});
execaSync('unicorns', {stdout: [1]});

await execa('unicorns', {stderr: 1});
execaSync('unicorns', {stderr: 1});
await execa('unicorns', {stderr: [1]});
execaSync('unicorns', {stderr: [1]});

expectError(await execa('unicorns', {stdio: 1}));
expectError(execaSync('unicorns', {stdio: 1}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 1]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 1]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [1]]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [1]]});

expectNotAssignable<StdinOption>(1);
expectNotAssignable<StdinOptionSync>(1);
expectNotAssignable<StdinOption>([1]);
expectNotAssignable<StdinOptionSync>([1]);

expectAssignable<StdoutStderrOption>(1);
expectAssignable<StdoutStderrOptionSync>(1);
expectAssignable<StdoutStderrOption>([1]);
expectAssignable<StdoutStderrOptionSync>([1]);
