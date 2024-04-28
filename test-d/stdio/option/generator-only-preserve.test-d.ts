import {expectError, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const preserveNewlinesOnly = {preserveNewlines: true} as const;

expectError(await execa('unicorns', {stdin: preserveNewlinesOnly}));
expectError(execaSync('unicorns', {stdin: preserveNewlinesOnly}));
expectError(await execa('unicorns', {stdin: [preserveNewlinesOnly]}));
expectError(execaSync('unicorns', {stdin: [preserveNewlinesOnly]}));

expectError(await execa('unicorns', {stdout: preserveNewlinesOnly}));
expectError(execaSync('unicorns', {stdout: preserveNewlinesOnly}));
expectError(await execa('unicorns', {stdout: [preserveNewlinesOnly]}));
expectError(execaSync('unicorns', {stdout: [preserveNewlinesOnly]}));

expectError(await execa('unicorns', {stderr: preserveNewlinesOnly}));
expectError(execaSync('unicorns', {stderr: preserveNewlinesOnly}));
expectError(await execa('unicorns', {stderr: [preserveNewlinesOnly]}));
expectError(execaSync('unicorns', {stderr: [preserveNewlinesOnly]}));

expectError(await execa('unicorns', {stdio: preserveNewlinesOnly}));
expectError(execaSync('unicorns', {stdio: preserveNewlinesOnly}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', preserveNewlinesOnly]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', preserveNewlinesOnly]}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [preserveNewlinesOnly]]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [preserveNewlinesOnly]]}));

expectNotAssignable<StdinOption>(preserveNewlinesOnly);
expectNotAssignable<StdinSyncOption>(preserveNewlinesOnly);
expectNotAssignable<StdinOption>([preserveNewlinesOnly]);
expectNotAssignable<StdinSyncOption>([preserveNewlinesOnly]);

expectNotAssignable<StdoutStderrOption>(preserveNewlinesOnly);
expectNotAssignable<StdoutStderrSyncOption>(preserveNewlinesOnly);
expectNotAssignable<StdoutStderrOption>([preserveNewlinesOnly]);
expectNotAssignable<StdoutStderrSyncOption>([preserveNewlinesOnly]);
