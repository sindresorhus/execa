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

const objectArray = [{}, {}] as const;

await execa('unicorns', {stdin: [objectArray]});
execaSync('unicorns', {stdin: [objectArray]});

expectError(await execa('unicorns', {stdout: [objectArray]}));
expectError(execaSync('unicorns', {stdout: [objectArray]}));

expectError(await execa('unicorns', {stderr: [objectArray]}));
expectError(execaSync('unicorns', {stderr: [objectArray]}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [objectArray]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [objectArray]]}));
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [[objectArray]]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [[objectArray]]]}));

expectAssignable<StdinOption>([objectArray]);
expectAssignable<StdinOptionSync>([objectArray]);

expectNotAssignable<StdoutStderrOption>([objectArray]);
expectNotAssignable<StdoutStderrOptionSync>([objectArray]);

expectAssignable<StdioOption>([objectArray]);
expectAssignable<StdioOptionSync>([objectArray]);
