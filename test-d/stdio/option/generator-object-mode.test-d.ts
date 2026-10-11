import {expectTypeOf, expectError} from 'nz';
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

expectTypeOf(transformWithObjectMode).toBeAssignableTo<StdinOption>();
expectTypeOf(transformWithObjectMode).toBeAssignableTo<StdinSyncOption>();
[transformWithObjectMode] satisfies StdinOption;
[transformWithObjectMode] satisfies StdinSyncOption;

expectTypeOf(transformWithObjectMode).toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(transformWithObjectMode).toBeAssignableTo<StdoutStderrSyncOption>();
[transformWithObjectMode] satisfies StdoutStderrOption;
[transformWithObjectMode] satisfies StdoutStderrSyncOption;
