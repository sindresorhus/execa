import {expectTypeOf} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

await execa('unicorns', {stdin: undefined});
execaSync('unicorns', {stdin: undefined});
await execa('unicorns', {stdin: [undefined]});
execaSync('unicorns', {stdin: [undefined]});

await execa('unicorns', {stdout: undefined});
execaSync('unicorns', {stdout: undefined});
await execa('unicorns', {stdout: [undefined]});
execaSync('unicorns', {stdout: [undefined]});

await execa('unicorns', {stderr: undefined});
execaSync('unicorns', {stderr: undefined});
await execa('unicorns', {stderr: [undefined]});
execaSync('unicorns', {stderr: [undefined]});

await execa('unicorns', {stdio: undefined});
execaSync('unicorns', {stdio: undefined});

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', undefined]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', undefined]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [undefined]]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [undefined]]});

expectTypeOf<undefined>().toBeAssignableTo<StdinOption>();
expectTypeOf<undefined>().toBeAssignableTo<StdinSyncOption>();
[undefined] satisfies StdinOption;
[undefined] satisfies StdinSyncOption;

expectTypeOf<undefined>().toBeAssignableTo<StdoutStderrOption>();
expectTypeOf<undefined>().toBeAssignableTo<StdoutStderrSyncOption>();
[undefined] satisfies StdoutStderrOption;
[undefined] satisfies StdoutStderrSyncOption;
