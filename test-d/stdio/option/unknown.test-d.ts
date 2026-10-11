import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

expectError(await execa('unicorns', {stdin: 'unknown'}));
expectError(execaSync('unicorns', {stdin: 'unknown'}));
expectError(await execa('unicorns', {stdin: ['unknown']}));
expectError(execaSync('unicorns', {stdin: ['unknown']}));

expectError(await execa('unicorns', {stdout: 'unknown'}));
expectError(execaSync('unicorns', {stdout: 'unknown'}));
expectError(await execa('unicorns', {stdout: ['unknown']}));
expectError(execaSync('unicorns', {stdout: ['unknown']}));

expectError(await execa('unicorns', {stderr: 'unknown'}));
expectError(execaSync('unicorns', {stderr: 'unknown'}));
expectError(await execa('unicorns', {stderr: ['unknown']}));
expectError(execaSync('unicorns', {stderr: ['unknown']}));

expectError(await execa('unicorns', {stdio: 'unknown'}));
expectError(execaSync('unicorns', {stdio: 'unknown'}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'unknown']}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'unknown']}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', ['unknown']]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', ['unknown']]}));

expectTypeOf<'unknown'>().not.toBeAssignableTo<StdinOption>();
expectTypeOf<'unknown'>().not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf<['unknown']>().not.toBeAssignableTo<StdinOption>();
expectTypeOf<['unknown']>().not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf<'unknown'>().not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf<'unknown'>().not.toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf<['unknown']>().not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf<['unknown']>().not.toBeAssignableTo<StdoutStderrSyncOption>();
