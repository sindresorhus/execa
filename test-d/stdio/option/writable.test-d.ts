import {Writable} from 'node:stream';
import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

expectError(await execa('unicorns', {stdin: new Writable()}));
expectError(execaSync('unicorns', {stdin: new Writable()}));
expectError(await execa('unicorns', {stdin: [new Writable()]}));
expectError(execaSync('unicorns', {stdin: [new Writable()]}));

await execa('unicorns', {stdout: new Writable()});
execaSync('unicorns', {stdout: new Writable()});
await execa('unicorns', {stdout: [new Writable()]});
expectError(execaSync('unicorns', {stdout: [new Writable()]}));

await execa('unicorns', {stderr: new Writable()});
execaSync('unicorns', {stderr: new Writable()});
await execa('unicorns', {stderr: [new Writable()]});
expectError(execaSync('unicorns', {stderr: [new Writable()]}));

expectError(await execa('unicorns', {stdio: new Writable()}));
expectError(execaSync('unicorns', {stdio: new Writable()}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', new Writable()]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', new Writable()]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [new Writable()]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [new Writable()]]}));

expectTypeOf(new Writable()).not.toBeAssignableTo<StdinOption>();
expectTypeOf(new Writable()).not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf([new Writable()]).not.toBeAssignableTo<StdinOption>();
expectTypeOf([new Writable()]).not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf(new Writable()).toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(new Writable()).toBeAssignableTo<StdoutStderrSyncOption>();
[new Writable()] satisfies StdoutStderrOption;
expectTypeOf([new Writable()]).not.toBeAssignableTo<StdoutStderrSyncOption>();
