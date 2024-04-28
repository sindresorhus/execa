import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

await execa('unicorns', {stdin: 'ignore'});
execaSync('unicorns', {stdin: 'ignore'});
expectError(await execa('unicorns', {stdin: ['ignore']}));
expectError(execaSync('unicorns', {stdin: ['ignore']}));

await execa('unicorns', {stdout: 'ignore'});
execaSync('unicorns', {stdout: 'ignore'});
expectError(await execa('unicorns', {stdout: ['ignore']}));
expectError(execaSync('unicorns', {stdout: ['ignore']}));

await execa('unicorns', {stderr: 'ignore'});
execaSync('unicorns', {stderr: 'ignore'});
expectError(await execa('unicorns', {stderr: ['ignore']}));
expectError(execaSync('unicorns', {stderr: ['ignore']}));

await execa('unicorns', {stdio: 'ignore'});
execaSync('unicorns', {stdio: 'ignore'});

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'ignore']});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'ignore']});
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', ['ignore']]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', ['ignore']]}));

expectAssignable<StdinOption>('ignore');
expectAssignable<StdinSyncOption>('ignore');
expectNotAssignable<StdinOption>(['ignore']);
expectNotAssignable<StdinSyncOption>(['ignore']);

expectAssignable<StdoutStderrOption>('ignore');
expectAssignable<StdoutStderrSyncOption>('ignore');
expectNotAssignable<StdoutStderrOption>(['ignore']);
expectNotAssignable<StdoutStderrSyncOption>(['ignore']);
