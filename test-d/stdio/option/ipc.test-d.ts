import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

await execa('unicorns', {stdin: 'ipc'});
expectError(execaSync('unicorns', {stdin: 'ipc'}));
expectError(await execa('unicorns', {stdin: ['ipc']}));
expectError(execaSync('unicorns', {stdin: ['ipc']}));

await execa('unicorns', {stdout: 'ipc'});
expectError(execaSync('unicorns', {stdout: 'ipc'}));
expectError(await execa('unicorns', {stdout: ['ipc']}));
expectError(execaSync('unicorns', {stdout: ['ipc']}));

await execa('unicorns', {stderr: 'ipc'});
expectError(execaSync('unicorns', {stderr: 'ipc'}));
expectError(await execa('unicorns', {stderr: ['ipc']}));
expectError(execaSync('unicorns', {stderr: ['ipc']}));

expectError(await execa('unicorns', {stdio: 'ipc'}));
expectError(execaSync('unicorns', {stdio: 'ipc'}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'ipc']});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'ipc']}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', ['ipc']]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', ['ipc']]}));

expectAssignable<StdinOption>('ipc');
expectNotAssignable<StdinSyncOption>('ipc');
expectNotAssignable<StdinOption>(['ipc']);
expectNotAssignable<StdinSyncOption>(['ipc']);

expectAssignable<StdoutStderrOption>('ipc');
expectNotAssignable<StdoutStderrSyncOption>('ipc');
expectNotAssignable<StdoutStderrOption>(['ipc']);
expectNotAssignable<StdoutStderrSyncOption>(['ipc']);
