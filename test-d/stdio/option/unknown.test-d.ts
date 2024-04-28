import {expectError, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinOptionSync,
	type StdoutStderrOption,
	type StdoutStderrOptionSync,
} from '../../../index.js';

expectError(await execa('unicorns', {stdin: 'unknown'}));
expectError(execaSync('unicorns', {stdin: 'unknown'}));
expectError(await execa('unicorns', {stdin: ['unknown']}));
expectError(execaSync('unicorns', {stdin: ['unknown']}));

expectError(await execa('unicorns', {stdout: 'unknown'}));
expectError(execaSync('unicorns', {stdout: 'unknown'}));
expectError(await execa('unicorns', {stdout: ['unknown']}));
expectError(execaSync('unicorns', {stdout: ['unknown']}));

expectError(await execa('unicorns', {stderr: 'unknown'}));
expectError(execaSync('unicorns', {stderr: 'unknown'}));
expectError(await execa('unicorns', {stderr: ['unknown']}));
expectError(execaSync('unicorns', {stderr: ['unknown']}));

expectError(await execa('unicorns', {stdio: 'unknown'}));
expectError(execaSync('unicorns', {stdio: 'unknown'}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'unknown']}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'unknown']}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', ['unknown']]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', ['unknown']]}));

expectNotAssignable<StdinOption>('unknown');
expectNotAssignable<StdinOptionSync>('unknown');
expectNotAssignable<StdinOption>(['unknown']);
expectNotAssignable<StdinOptionSync>(['unknown']);

expectNotAssignable<StdoutStderrOption>('unknown');
expectNotAssignable<StdoutStderrOptionSync>('unknown');
expectNotAssignable<StdoutStderrOption>(['unknown']);
expectNotAssignable<StdoutStderrOptionSync>(['unknown']);
