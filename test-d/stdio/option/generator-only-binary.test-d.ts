import {expectError, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
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
expectNotAssignable<StdinSyncOption>(binaryOnly);
expectNotAssignable<StdinOption>([binaryOnly]);
expectNotAssignable<StdinSyncOption>([binaryOnly]);

expectNotAssignable<StdoutStderrOption>(binaryOnly);
expectNotAssignable<StdoutStderrSyncOption>(binaryOnly);
expectNotAssignable<StdoutStderrOption>([binaryOnly]);
expectNotAssignable<StdoutStderrSyncOption>([binaryOnly]);
