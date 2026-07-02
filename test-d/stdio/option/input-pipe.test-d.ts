import {expectError, expectAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const inputPipe = {value: 'pipe', input: true} as const;
const input = true as boolean;
const booleanInputPipe = {value: 'pipe', input} as const;

await execa('unicorns', {stdin: inputPipe});
execaSync('unicorns', {stdin: inputPipe});
await execa('unicorns', {stdout: inputPipe});
execaSync('unicorns', {stdout: inputPipe});
await execa('unicorns', {stderr: inputPipe});
execaSync('unicorns', {stderr: inputPipe});

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', inputPipe]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', inputPipe]}));
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', booleanInputPipe]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', booleanInputPipe]}));

await execa('unicorns', {stdin: {value: 'pipe'}});
await execa('unicorns', {stdin: {value: 'overlapped', input: true}});
expectError(execaSync('unicorns', {stdin: {value: 'overlapped', input: true}}));

expectError(await execa('unicorns', {stdin: {value: 'other', input: true}}));
expectError(await execa('unicorns', {stdin: {value: 'pipe', input: 'true'}}));

expectAssignable<StdinOption>(inputPipe);
expectAssignable<StdinOption>(booleanInputPipe);
expectAssignable<StdinSyncOption>(inputPipe);
expectAssignable<StdinSyncOption>(booleanInputPipe);
expectAssignable<StdoutStderrOption>(inputPipe);
expectAssignable<StdoutStderrOption>(booleanInputPipe);
expectAssignable<StdoutStderrSyncOption>(inputPipe);
expectAssignable<StdoutStderrSyncOption>(booleanInputPipe);
expectAssignable<StdinOption>([inputPipe]);
expectAssignable<StdinOption>([booleanInputPipe]);
expectAssignable<StdinSyncOption>([inputPipe]);
expectAssignable<StdinSyncOption>([booleanInputPipe]);
expectAssignable<StdoutStderrOption>([inputPipe]);
expectAssignable<StdoutStderrOption>([booleanInputPipe]);
expectAssignable<StdoutStderrSyncOption>([inputPipe]);
expectAssignable<StdoutStderrSyncOption>([booleanInputPipe]);
