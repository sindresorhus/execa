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
expectAssignable<StdinOptionSync>('ignore');
expectNotAssignable<StdinOption>(['ignore']);
expectNotAssignable<StdinOptionSync>(['ignore']);

expectAssignable<StdoutStderrOption>('ignore');
expectAssignable<StdoutStderrOptionSync>('ignore');
expectNotAssignable<StdoutStderrOption>(['ignore']);
expectNotAssignable<StdoutStderrOptionSync>(['ignore']);

expectAssignable<StdioOption>('ignore');
expectAssignable<StdioOptionSync>('ignore');
expectNotAssignable<StdioOption>(['ignore']);
expectNotAssignable<StdioOptionSync>(['ignore']);
