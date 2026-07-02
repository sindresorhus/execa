import {expectError, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

// The `stdio: 'ipc'` value (raw `child_process` syntax) was replaced by the `ipc: true` option
expectError(await execa('unicorns', {stdin: 'ipc'}));
expectError(execaSync('unicorns', {stdin: 'ipc'}));
expectError(await execa('unicorns', {stdin: ['ipc']}));
expectError(execaSync('unicorns', {stdin: ['ipc']}));

expectError(await execa('unicorns', {stdout: 'ipc'}));
expectError(execaSync('unicorns', {stdout: 'ipc'}));
expectError(await execa('unicorns', {stdout: ['ipc']}));
expectError(execaSync('unicorns', {stdout: ['ipc']}));

expectError(await execa('unicorns', {stderr: 'ipc'}));
expectError(execaSync('unicorns', {stderr: 'ipc'}));
expectError(await execa('unicorns', {stderr: ['ipc']}));
expectError(execaSync('unicorns', {stderr: ['ipc']}));

expectError(await execa('unicorns', {stdio: 'ipc'}));
expectError(execaSync('unicorns', {stdio: 'ipc'}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'ipc']}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'ipc']}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', ['ipc']]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', ['ipc']]}));

expectNotAssignable<StdinOption>('ipc');
expectNotAssignable<StdinSyncOption>('ipc');
expectNotAssignable<StdinOption>(['ipc']);
expectNotAssignable<StdinSyncOption>(['ipc']);

expectNotAssignable<StdoutStderrOption>('ipc');
expectNotAssignable<StdoutStderrSyncOption>('ipc');
expectNotAssignable<StdoutStderrOption>(['ipc']);
expectNotAssignable<StdoutStderrSyncOption>(['ipc']);
