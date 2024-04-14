import {expectError, expectNotAssignable} from 'tsd';
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

const binaryOnly = {binary: true} as const;

expectError(await execa('unicorns', {stdin: binaryOnly}));
expectError(execaSync('unicorns', {stdin: binaryOnly}));
expectError(await execa('unicorns', {stdin: [binaryOnly]}));
expectError(execaSync('unicorns', {stdin: [binaryOnly]}));

expectError(await execa('unicorns', {stdout: binaryOnly}));
expectError(execaSync('unicorns', {stdout: binaryOnly}));
expectError(await execa('unicorns', {stdout: [binaryOnly]}));
expectError(execaSync('unicorns', {stdout: [binaryOnly]}));

expectError(await execa('unicorns', {stderr: binaryOnly}));
expectError(execaSync('unicorns', {stderr: binaryOnly}));
expectError(await execa('unicorns', {stderr: [binaryOnly]}));
expectError(execaSync('unicorns', {stderr: [binaryOnly]}));

expectError(await execa('unicorns', {stdio: binaryOnly}));
expectError(execaSync('unicorns', {stdio: binaryOnly}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', binaryOnly]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', binaryOnly]}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [binaryOnly]]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [binaryOnly]]}));

expectNotAssignable<StdinOption>(binaryOnly);
expectNotAssignable<StdinOptionSync>(binaryOnly);
expectNotAssignable<StdinOption>([binaryOnly]);
expectNotAssignable<StdinOptionSync>([binaryOnly]);

expectNotAssignable<StdoutStderrOption>(binaryOnly);
expectNotAssignable<StdoutStderrOptionSync>(binaryOnly);
expectNotAssignable<StdoutStderrOption>([binaryOnly]);
expectNotAssignable<StdoutStderrOptionSync>([binaryOnly]);

expectNotAssignable<StdioOption>(binaryOnly);
expectNotAssignable<StdioOptionSync>(binaryOnly);
expectNotAssignable<StdioOption>([binaryOnly]);
expectNotAssignable<StdioOptionSync>([binaryOnly]);
