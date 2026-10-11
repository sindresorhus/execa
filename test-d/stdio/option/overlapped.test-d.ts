import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

await execa('unicorns', {stdin: 'overlapped'});
expectError(execaSync('unicorns', {stdin: 'overlapped'}));
await execa('unicorns', {stdin: ['overlapped']});
expectError(execaSync('unicorns', {stdin: ['overlapped']}));

await execa('unicorns', {stdout: 'overlapped'});
expectError(execaSync('unicorns', {stdout: 'overlapped'}));
await execa('unicorns', {stdout: ['overlapped']});
expectError(execaSync('unicorns', {stdout: ['overlapped']}));

await execa('unicorns', {stderr: 'overlapped'});
expectError(execaSync('unicorns', {stderr: 'overlapped'}));
await execa('unicorns', {stderr: ['overlapped']});
expectError(execaSync('unicorns', {stderr: ['overlapped']}));

await execa('unicorns', {stdio: 'overlapped'});
expectError(execaSync('unicorns', {stdio: 'overlapped'}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'overlapped']});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'overlapped']}));
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', ['overlapped']]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', ['overlapped']]}));

expectTypeOf<'overlapped'>().toBeAssignableTo<StdinOption>();
expectTypeOf<'overlapped'>().not.toBeAssignableTo<StdinSyncOption>();
['overlapped'] satisfies StdinOption;
expectTypeOf<['overlapped']>().not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf<'overlapped'>().toBeAssignableTo<StdoutStderrOption>();
expectTypeOf<'overlapped'>().not.toBeAssignableTo<StdoutStderrSyncOption>();
['overlapped'] satisfies StdoutStderrOption;
expectTypeOf<['overlapped']>().not.toBeAssignableTo<StdoutStderrSyncOption>();
