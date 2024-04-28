import {expectError, expectAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

await execa('unicorns', {stdin: 'inherit'});
execaSync('unicorns', {stdin: 'inherit'});
await execa('unicorns', {stdin: ['inherit']});
execaSync('unicorns', {stdin: ['inherit']});

await execa('unicorns', {stdout: 'inherit'});
execaSync('unicorns', {stdout: 'inherit'});
await execa('unicorns', {stdout: ['inherit']});
execaSync('unicorns', {stdout: ['inherit']});

await execa('unicorns', {stderr: 'inherit'});
execaSync('unicorns', {stderr: 'inherit'});
await execa('unicorns', {stderr: ['inherit']});
execaSync('unicorns', {stderr: ['inherit']});

await execa('unicorns', {stdio: 'inherit'});
execaSync('unicorns', {stdio: 'inherit'});

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'inherit']});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'inherit']});
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', ['inherit']]}));
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', ['inherit']]});

expectAssignable<StdinOption>('inherit');
expectAssignable<StdinSyncOption>('inherit');
expectAssignable<StdinOption>(['inherit']);
expectAssignable<StdinSyncOption>(['inherit']);

expectAssignable<StdoutStderrOption>('inherit');
expectAssignable<StdoutStderrSyncOption>('inherit');
expectAssignable<StdoutStderrOption>(['inherit']);
expectAssignable<StdoutStderrSyncOption>(['inherit']);
