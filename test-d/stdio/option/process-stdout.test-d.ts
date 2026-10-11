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

expectError(await execa('unicorns', {stdin: process.stdout}));
expectError(execaSync('unicorns', {stdin: process.stdout}));
expectError(await execa('unicorns', {stdin: [process.stdout]}));
expectError(execaSync('unicorns', {stdin: [process.stdout]}));

await execa('unicorns', {stdout: process.stdout});
execaSync('unicorns', {stdout: process.stdout});
await execa('unicorns', {stdout: [process.stdout]});
expectError(execaSync('unicorns', {stdout: [process.stdout]}));

await execa('unicorns', {stderr: process.stdout});
execaSync('unicorns', {stderr: process.stdout});
await execa('unicorns', {stderr: [process.stdout]});
expectError(execaSync('unicorns', {stderr: [process.stdout]}));

expectError(await execa('unicorns', {stdio: process.stdout}));
expectError(execaSync('unicorns', {stdio: process.stdout}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', process.stdout]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', process.stdout]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [process.stdout]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [process.stdout]]}));

expectTypeOf(process.stdout).not.toBeAssignableTo<StdinOption>();
expectTypeOf(process.stdout).not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf([process.stdout]).not.toBeAssignableTo<StdinOption>();
expectTypeOf([process.stdout]).not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf(process.stdout).toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(process.stdout).toBeAssignableTo<StdoutStderrSyncOption>();
[process.stdout] satisfies StdoutStderrOption;
expectTypeOf([process.stdout]).not.toBeAssignableTo<StdoutStderrSyncOption>();
