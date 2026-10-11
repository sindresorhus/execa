import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const objectGenerator = function * (line: unknown) {
	yield JSON.parse(line as string) as object;
};

await execa('unicorns', {stdin: objectGenerator});
execaSync('unicorns', {stdin: objectGenerator});
await execa('unicorns', {stdin: [objectGenerator]});
execaSync('unicorns', {stdin: [objectGenerator]});

await execa('unicorns', {stdout: objectGenerator});
execaSync('unicorns', {stdout: objectGenerator});
await execa('unicorns', {stdout: [objectGenerator]});
execaSync('unicorns', {stdout: [objectGenerator]});

await execa('unicorns', {stderr: objectGenerator});
execaSync('unicorns', {stderr: objectGenerator});
await execa('unicorns', {stderr: [objectGenerator]});
execaSync('unicorns', {stderr: [objectGenerator]});

expectError(await execa('unicorns', {stdio: objectGenerator}));
expectError(execaSync('unicorns', {stdio: objectGenerator}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', objectGenerator]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', objectGenerator]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [objectGenerator]]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [objectGenerator]]});

expectTypeOf(objectGenerator).toBeAssignableTo<StdinOption>();
expectTypeOf(objectGenerator).toBeAssignableTo<StdinSyncOption>();
[objectGenerator] satisfies StdinOption;
[objectGenerator] satisfies StdinSyncOption;

expectTypeOf(objectGenerator).toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(objectGenerator).toBeAssignableTo<StdoutStderrSyncOption>();
[objectGenerator] satisfies StdoutStderrOption;
[objectGenerator] satisfies StdoutStderrSyncOption;
