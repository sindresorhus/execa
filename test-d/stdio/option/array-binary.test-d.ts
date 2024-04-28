import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinOptionSync,
	type StdoutStderrOption,
	type StdoutStderrOptionSync,
} from '../../../index.js';

const binaryArray = [new Uint8Array(), new Uint8Array()] as const;

await execa('unicorns', {stdin: [binaryArray]});
execaSync('unicorns', {stdin: [binaryArray]});

expectError(await execa('unicorns', {stdout: [binaryArray]}));
expectError(execaSync('unicorns', {stdout: [binaryArray]}));

expectError(await execa('unicorns', {stderr: [binaryArray]}));
expectError(execaSync('unicorns', {stderr: [binaryArray]}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [binaryArray]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [binaryArray]]}));
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [[binaryArray]]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [[binaryArray]]]}));

expectAssignable<StdinOption>([binaryArray]);
expectAssignable<StdinOptionSync>([binaryArray]);

expectNotAssignable<StdoutStderrOption>([binaryArray]);
expectNotAssignable<StdoutStderrOptionSync>([binaryArray]);
