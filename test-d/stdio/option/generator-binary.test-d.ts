import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const transformWithBinary = {
	* transform(line: unknown) {
		yield line;
	},
	binary: true,
} as const;

await execa('unicorns', {stdin: transformWithBinary});
execaSync('unicorns', {stdin: transformWithBinary});
await execa('unicorns', {stdin: [transformWithBinary]});
execaSync('unicorns', {stdin: [transformWithBinary]});

await execa('unicorns', {stdout: transformWithBinary});
execaSync('unicorns', {stdout: transformWithBinary});
await execa('unicorns', {stdout: [transformWithBinary]});
execaSync('unicorns', {stdout: [transformWithBinary]});

await execa('unicorns', {stderr: transformWithBinary});
execaSync('unicorns', {stderr: transformWithBinary});
await execa('unicorns', {stderr: [transformWithBinary]});
execaSync('unicorns', {stderr: [transformWithBinary]});

expectError(await execa('unicorns', {stdio: transformWithBinary}));
expectError(execaSync('unicorns', {stdio: transformWithBinary}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', transformWithBinary]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', transformWithBinary]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [transformWithBinary]]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [transformWithBinary]]});

expectTypeOf(transformWithBinary).toBeAssignableTo<StdinOption>();
expectTypeOf(transformWithBinary).toBeAssignableTo<StdinSyncOption>();
[transformWithBinary] satisfies StdinOption;
[transformWithBinary] satisfies StdinSyncOption;

expectTypeOf(transformWithBinary).toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(transformWithBinary).toBeAssignableTo<StdoutStderrSyncOption>();
[transformWithBinary] satisfies StdoutStderrOption;
[transformWithBinary] satisfies StdoutStderrSyncOption;
