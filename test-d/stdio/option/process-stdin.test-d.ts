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

await execa('unicorns', {stdin: process.stdin});
execaSync('unicorns', {stdin: process.stdin});
await execa('unicorns', {stdin: [process.stdin]});
expectError(execaSync('unicorns', {stdin: [process.stdin]}));

expectError(await execa('unicorns', {stdout: process.stdin}));
expectError(execaSync('unicorns', {stdout: process.stdin}));
expectError(await execa('unicorns', {stdout: [process.stdin]}));
expectError(execaSync('unicorns', {stdout: [process.stdin]}));

expectError(await execa('unicorns', {stderr: process.stdin}));
expectError(execaSync('unicorns', {stderr: process.stdin}));
expectError(await execa('unicorns', {stderr: [process.stdin]}));
expectError(execaSync('unicorns', {stderr: [process.stdin]}));

expectError(await execa('unicorns', {stdio: process.stdin}));
expectError(execaSync('unicorns', {stdio: process.stdin}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', process.stdin]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', process.stdin]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [process.stdin]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [process.stdin]]}));

expectTypeOf(process.stdin).toBeAssignableTo<StdinOption>();
expectTypeOf(process.stdin).toBeAssignableTo<StdinSyncOption>();
[process.stdin] satisfies StdinOption;
expectTypeOf([process.stdin]).not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf(process.stdin).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(process.stdin).not.toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf([process.stdin]).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf([process.stdin]).not.toBeAssignableTo<StdoutStderrSyncOption>();
