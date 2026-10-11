import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const stringGenerator = function * (line: string) {
	yield line;
};

await execa('unicorns', {stdin: stringGenerator});
execaSync('unicorns', {stdin: stringGenerator});
await execa('unicorns', {stdin: [stringGenerator]});
execaSync('unicorns', {stdin: [stringGenerator]});

await execa('unicorns', {stdout: stringGenerator});
execaSync('unicorns', {stdout: stringGenerator});
await execa('unicorns', {stdout: [stringGenerator]});
execaSync('unicorns', {stdout: [stringGenerator]});

await execa('unicorns', {stderr: stringGenerator});
execaSync('unicorns', {stderr: stringGenerator});
await execa('unicorns', {stderr: [stringGenerator]});
execaSync('unicorns', {stderr: [stringGenerator]});

expectError(await execa('unicorns', {stdio: stringGenerator}));
expectError(execaSync('unicorns', {stdio: stringGenerator}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', stringGenerator]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', stringGenerator]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [stringGenerator]]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [stringGenerator]]});

expectTypeOf(stringGenerator).toBeAssignableTo<StdinOption>();
expectTypeOf(stringGenerator).toBeAssignableTo<StdinSyncOption>();
[stringGenerator] satisfies StdinOption;
[stringGenerator] satisfies StdinSyncOption;

expectTypeOf(stringGenerator).toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(stringGenerator).toBeAssignableTo<StdoutStderrSyncOption>();
[stringGenerator] satisfies StdoutStderrOption;
[stringGenerator] satisfies StdoutStderrSyncOption;

// The `chunk` argument is typed, but the return type stays `unknown`: a transform can yield both `string` and `Uint8Array`.
const mixedYieldGenerator = function * (line: string) {
	yield line;
	yield new TextEncoder().encode(line);
};

expectTypeOf(mixedYieldGenerator).toBeAssignableTo<StdinOption>();
expectTypeOf(mixedYieldGenerator).toBeAssignableTo<StdinSyncOption>();
expectTypeOf(mixedYieldGenerator).toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(mixedYieldGenerator).toBeAssignableTo<StdoutStderrSyncOption>();
