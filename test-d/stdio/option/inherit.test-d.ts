import {expectTypeOf, expectError} from 'nz';
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

expectTypeOf<'inherit'>().toBeAssignableTo<StdinOption>();
expectTypeOf<'inherit'>().toBeAssignableTo<StdinSyncOption>();
['inherit'] satisfies StdinOption;
['inherit'] satisfies StdinSyncOption;

expectTypeOf<'inherit'>().toBeAssignableTo<StdoutStderrOption>();
expectTypeOf<'inherit'>().toBeAssignableTo<StdoutStderrSyncOption>();
['inherit'] satisfies StdoutStderrOption;
['inherit'] satisfies StdoutStderrSyncOption;
