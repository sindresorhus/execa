import {expectError, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

expectError(await execa('unicorns', {stdin: {}}));
expectError(execaSync('unicorns', {stdin: {}}));
expectError(await execa('unicorns', {stdin: [{}]}));
expectError(execaSync('unicorns', {stdin: [{}]}));

expectError(await execa('unicorns', {stdout: {}}));
expectError(execaSync('unicorns', {stdout: {}}));
expectError(await execa('unicorns', {stdout: [{}]}));
expectError(execaSync('unicorns', {stdout: [{}]}));

expectError(await execa('unicorns', {stderr: {}}));
expectError(execaSync('unicorns', {stderr: {}}));
expectError(await execa('unicorns', {stderr: [{}]}));
expectError(execaSync('unicorns', {stderr: [{}]}));

expectError(await execa('unicorns', {stdio: {}}));
expectError(execaSync('unicorns', {stdio: {}}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', {}]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', {}]}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [{}]]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [{}]]}));

expectNotAssignable<StdinOption>({});
expectNotAssignable<StdinSyncOption>({});
expectNotAssignable<StdinOption>([{}]);
expectNotAssignable<StdinSyncOption>([{}]);

expectNotAssignable<StdoutStderrOption>({});
expectNotAssignable<StdoutStderrSyncOption>({});
expectNotAssignable<StdoutStderrOption>([{}]);
expectNotAssignable<StdoutStderrSyncOption>([{}]);
