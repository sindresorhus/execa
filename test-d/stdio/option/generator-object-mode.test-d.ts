import {expectError, expectAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const transformWithObjectMode = {
	* transform(line: unknown) {
		yield line;
	},
	objectMode: true,
} as const;

await execa('unicorns', {stdin: transformWithObjectMode});
execaSync('unicorns', {stdin: transformWithObjectMode});
await execa('unicorns', {stdin: [transformWithObjectMode]});
execaSync('unicorns', {stdin: [transformWithObjectMode]});

await execa('unicorns', {stdout: transformWithObjectMode});
execaSync('unicorns', {stdout: transformWithObjectMode});
await execa('unicorns', {stdout: [transformWithObjectMode]});
execaSync('unicorns', {stdout: [transformWithObjectMode]});

await execa('unicorns', {stderr: transformWithObjectMode});
execaSync('unicorns', {stderr: transformWithObjectMode});
await execa('unicorns', {stderr: [transformWithObjectMode]});
execaSync('unicorns', {stderr: [transformWithObjectMode]});

expectError(await execa('unicorns', {stdio: transformWithObjectMode}));
expectError(execaSync('unicorns', {stdio: transformWithObjectMode}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', transformWithObjectMode]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', transformWithObjectMode]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [transformWithObjectMode]]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [transformWithObjectMode]]});

expectAssignable<StdinOption>(transformWithObjectMode);
expectAssignable<StdinSyncOption>(transformWithObjectMode);
expectAssignable<StdinOption>([transformWithObjectMode]);
expectAssignable<StdinSyncOption>([transformWithObjectMode]);

expectAssignable<StdoutStderrOption>(transformWithObjectMode);
expectAssignable<StdoutStderrSyncOption>(transformWithObjectMode);
expectAssignable<StdoutStderrOption>([transformWithObjectMode]);
expectAssignable<StdoutStderrSyncOption>([transformWithObjectMode]);
