import * as process from 'node:process';
import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

expectError(await execa('unicorns', {stdin: process.stderr}));
expectError(execaSync('unicorns', {stdin: process.stderr}));
expectError(await execa('unicorns', {stdin: [process.stderr]}));
expectError(execaSync('unicorns', {stdin: [process.stderr]}));

await execa('unicorns', {stdout: process.stderr});
execaSync('unicorns', {stdout: process.stderr});
await execa('unicorns', {stdout: [process.stderr]});
expectError(execaSync('unicorns', {stdout: [process.stderr]}));

await execa('unicorns', {stderr: process.stderr});
execaSync('unicorns', {stderr: process.stderr});
await execa('unicorns', {stderr: [process.stderr]});
expectError(execaSync('unicorns', {stderr: [process.stderr]}));

expectError(await execa('unicorns', {stdio: process.stderr}));
expectError(execaSync('unicorns', {stdio: process.stderr}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', process.stderr]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', process.stderr]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [process.stderr]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [process.stderr]]}));

expectTypeOf(process.stderr).not.toBeAssignableTo<StdinOption>();
expectTypeOf(process.stderr).not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf([process.stderr]).not.toBeAssignableTo<StdinOption>();
expectTypeOf([process.stderr]).not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf(process.stderr).toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(process.stderr).toBeAssignableTo<StdoutStderrSyncOption>();
[process.stderr] satisfies StdoutStderrOption;
expectTypeOf([process.stderr]).not.toBeAssignableTo<StdoutStderrSyncOption>();
