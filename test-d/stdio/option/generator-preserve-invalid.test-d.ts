import {expectError, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const transformWithInvalidPreserveNewlines = {
	* transform(line: unknown) {
		yield line;
	},
	preserveNewlines: 'true',
} as const;

expectError(await execa('unicorns', {stdin: transformWithInvalidPreserveNewlines}));
expectError(execaSync('unicorns', {stdin: transformWithInvalidPreserveNewlines}));
expectError(await execa('unicorns', {stdin: [transformWithInvalidPreserveNewlines]}));
expectError(execaSync('unicorns', {stdin: [transformWithInvalidPreserveNewlines]}));

expectError(await execa('unicorns', {stdout: transformWithInvalidPreserveNewlines}));
expectError(execaSync('unicorns', {stdout: transformWithInvalidPreserveNewlines}));
expectError(await execa('unicorns', {stdout: [transformWithInvalidPreserveNewlines]}));
expectError(execaSync('unicorns', {stdout: [transformWithInvalidPreserveNewlines]}));

expectError(await execa('unicorns', {stderr: transformWithInvalidPreserveNewlines}));
expectError(execaSync('unicorns', {stderr: transformWithInvalidPreserveNewlines}));
expectError(await execa('unicorns', {stderr: [transformWithInvalidPreserveNewlines]}));
expectError(execaSync('unicorns', {stderr: [transformWithInvalidPreserveNewlines]}));

expectError(await execa('unicorns', {stdio: transformWithInvalidPreserveNewlines}));
expectError(execaSync('unicorns', {stdio: transformWithInvalidPreserveNewlines}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', transformWithInvalidPreserveNewlines]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', transformWithInvalidPreserveNewlines]}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [transformWithInvalidPreserveNewlines]]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [transformWithInvalidPreserveNewlines]]}));

expectNotAssignable<StdinOption>(transformWithInvalidPreserveNewlines);
expectNotAssignable<StdinSyncOption>(transformWithInvalidPreserveNewlines);
expectNotAssignable<StdinOption>([transformWithInvalidPreserveNewlines]);
expectNotAssignable<StdinSyncOption>([transformWithInvalidPreserveNewlines]);

expectNotAssignable<StdoutStderrOption>(transformWithInvalidPreserveNewlines);
expectNotAssignable<StdoutStderrSyncOption>(transformWithInvalidPreserveNewlines);
expectNotAssignable<StdoutStderrOption>([transformWithInvalidPreserveNewlines]);
expectNotAssignable<StdoutStderrSyncOption>([transformWithInvalidPreserveNewlines]);
