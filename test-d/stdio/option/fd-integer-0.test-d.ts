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

await execa('unicorns', {stdin: 0});
execaSync('unicorns', {stdin: 0});
await execa('unicorns', {stdin: [0]});
execaSync('unicorns', {stdin: [0]});

expectError(await execa('unicorns', {stdout: 0}));
expectError(execaSync('unicorns', {stdout: 0}));
expectError(await execa('unicorns', {stdout: [0]}));
expectError(execaSync('unicorns', {stdout: [0]}));

expectError(await execa('unicorns', {stderr: 0}));
expectError(execaSync('unicorns', {stderr: 0}));
expectError(await execa('unicorns', {stderr: [0]}));
expectError(execaSync('unicorns', {stderr: [0]}));

expectError(await execa('unicorns', {stdio: 0}));
expectError(execaSync('unicorns', {stdio: 0}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 0]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 0]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [0]]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [0]]});

expectAssignable<StdinOption>(0);
expectAssignable<StdinOptionSync>(0);
expectAssignable<StdinOption>([0]);
expectAssignable<StdinOptionSync>([0]);

expectNotAssignable<StdoutStderrOption>(0);
expectNotAssignable<StdoutStderrOptionSync>(0);
expectNotAssignable<StdoutStderrOption>([0]);
expectNotAssignable<StdoutStderrOptionSync>([0]);

expectAssignable<StdioOption>(0);
expectAssignable<StdioOptionSync>(0);
expectAssignable<StdioOption>([0]);
expectAssignable<StdioOptionSync>([0]);

expectNotAssignable<StdioOption>(0.5);
expectNotAssignable<StdioOption>(-1);
expectNotAssignable<StdioOption>(Number.POSITIVE_INFINITY);
expectNotAssignable<StdioOption>(Number.NaN);
