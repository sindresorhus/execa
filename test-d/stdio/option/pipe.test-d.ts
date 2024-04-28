import {expectAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

await execa('unicorns', {stdin: 'pipe'});
execaSync('unicorns', {stdin: 'pipe'});
await execa('unicorns', {stdin: ['pipe']});
execaSync('unicorns', {stdin: ['pipe']});

await execa('unicorns', {stdout: 'pipe'});
execaSync('unicorns', {stdout: 'pipe'});
await execa('unicorns', {stdout: ['pipe']});
execaSync('unicorns', {stdout: ['pipe']});

await execa('unicorns', {stderr: 'pipe'});
execaSync('unicorns', {stderr: 'pipe'});
await execa('unicorns', {stderr: ['pipe']});
execaSync('unicorns', {stderr: ['pipe']});

await execa('unicorns', {stdio: 'pipe'});
execaSync('unicorns', {stdio: 'pipe'});

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'pipe']});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'pipe']});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', ['pipe']]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', ['pipe']]});

expectAssignable<StdinOption>('pipe');
expectAssignable<StdinSyncOption>('pipe');
expectAssignable<StdinOption>(['pipe']);
expectAssignable<StdinSyncOption>(['pipe']);

expectAssignable<StdoutStderrOption>('pipe');
expectAssignable<StdoutStderrSyncOption>('pipe');
expectAssignable<StdoutStderrOption>(['pipe']);
expectAssignable<StdoutStderrSyncOption>(['pipe']);
