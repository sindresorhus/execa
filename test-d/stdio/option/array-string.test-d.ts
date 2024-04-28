import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const stringArray = ['foo', 'bar'] as const;

await execa('unicorns', {stdin: [stringArray]});
execaSync('unicorns', {stdin: [stringArray]});

expectError(await execa('unicorns', {stdout: [stringArray]}));
expectError(execaSync('unicorns', {stdout: [stringArray]}));

expectError(await execa('unicorns', {stderr: [stringArray]}));
expectError(execaSync('unicorns', {stderr: [stringArray]}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [stringArray]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [stringArray]]}));
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [[stringArray]]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [[stringArray]]]}));

expectAssignable<StdinOption>([stringArray]);
expectAssignable<StdinSyncOption>([stringArray]);

expectNotAssignable<StdoutStderrOption>([stringArray]);
expectNotAssignable<StdoutStderrSyncOption>([stringArray]);
