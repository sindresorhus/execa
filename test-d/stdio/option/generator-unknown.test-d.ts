import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const unknownGenerator = function * (line: unknown) {
	yield line;
};

await execa('unicorns', {stdin: unknownGenerator});
execaSync('unicorns', {stdin: unknownGenerator});
await execa('unicorns', {stdin: [unknownGenerator]});
execaSync('unicorns', {stdin: [unknownGenerator]});

await execa('unicorns', {stdout: unknownGenerator});
execaSync('unicorns', {stdout: unknownGenerator});
await execa('unicorns', {stdout: [unknownGenerator]});
execaSync('unicorns', {stdout: [unknownGenerator]});

await execa('unicorns', {stderr: unknownGenerator});
execaSync('unicorns', {stderr: unknownGenerator});
await execa('unicorns', {stderr: [unknownGenerator]});
execaSync('unicorns', {stderr: [unknownGenerator]});

expectError(await execa('unicorns', {stdio: unknownGenerator}));
expectError(execaSync('unicorns', {stdio: unknownGenerator}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', unknownGenerator]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', unknownGenerator]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [unknownGenerator]]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [unknownGenerator]]});

expectTypeOf(unknownGenerator).toBeAssignableTo<StdinOption>();
expectTypeOf(unknownGenerator).toBeAssignableTo<StdinSyncOption>();
[unknownGenerator] satisfies StdinOption;
[unknownGenerator] satisfies StdinSyncOption;

expectTypeOf(unknownGenerator).toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(unknownGenerator).toBeAssignableTo<StdoutStderrSyncOption>();
[unknownGenerator] satisfies StdoutStderrOption;
[unknownGenerator] satisfies StdoutStderrSyncOption;
