import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
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
expectNotAssignable<StdinOptionSync>('ipc');
expectNotAssignable<StdinOption>(['ipc']);
expectNotAssignable<StdinOptionSync>(['ipc']);

expectAssignable<StdoutStderrOption>('ipc');
expectNotAssignable<StdoutStderrOptionSync>('ipc');
expectNotAssignable<StdoutStderrOption>(['ipc']);
expectNotAssignable<StdoutStderrOptionSync>(['ipc']);

expectAssignable<StdioOption>('ipc');
expectNotAssignable<StdioOptionSync>('ipc');
expectNotAssignable<StdioOption>(['ipc']);
expectNotAssignable<StdioOptionSync>(['ipc']);
