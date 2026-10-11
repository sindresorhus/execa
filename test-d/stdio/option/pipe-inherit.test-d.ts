import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const pipeInherit = ['pipe', 'inherit'] as const;

await execa('unicorns', {stdin: pipeInherit});
execaSync('unicorns', {stdin: pipeInherit});

await execa('unicorns', {stdout: pipeInherit});
execaSync('unicorns', {stdout: pipeInherit});

await execa('unicorns', {stderr: pipeInherit});
execaSync('unicorns', {stderr: pipeInherit});

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', pipeInherit]}));
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', pipeInherit]});

expectTypeOf(pipeInherit).toBeAssignableTo<StdinOption>();
expectTypeOf(pipeInherit).toBeAssignableTo<StdinSyncOption>();

expectTypeOf(pipeInherit).toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(pipeInherit).toBeAssignableTo<StdoutStderrSyncOption>();
