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

const inputPipe = {value: 'pipe', input: true} as const;
const isInput = true as boolean;
const booleanInputPipe = {value: 'pipe', input: isInput} as const;
const transform = function * (line: string) {
	yield line;
};

await execa('unicorns', {stdin: inputPipe});
execaSync('unicorns', {stdin: inputPipe});
await execa('unicorns', {stdout: inputPipe});
execaSync('unicorns', {stdout: inputPipe});
await execa('unicorns', {stderr: inputPipe});
execaSync('unicorns', {stderr: inputPipe});

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', inputPipe]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', inputPipe]}));
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', booleanInputPipe]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', booleanInputPipe]}));

await execa('unicorns', {stdin: {value: 'pipe'}});
await execa('unicorns', {stdin: {value: 'overlapped', input: true}});
expectError(execaSync('unicorns', {stdin: {value: 'overlapped', input: true}}));

expectError(await execa('unicorns', {stdin: {value: 'other', input: true}}));
expectError(await execa('unicorns', {stdin: {value: 'pipe', input: 'true'}}));

// The `{value, input}` form works with any direction-ambiguous value, not just `'pipe'`/`'overlapped'`.
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', {value: 'inherit', input: true}]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', {value: new URL('file:///test'), input: true}]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', {value: {file: './example'}, input: true}]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', {value: transform, input: true}]});
({value: 'inherit', input: true}) satisfies StdinOption;
({value: {file: './example'}, input: true}) satisfies StdinOption;

// A value with a fixed direction cannot be marked as input.
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', {value: new Writable(), input: true}]}));

expectTypeOf(inputPipe).toBeAssignableTo<StdinOption>();
expectTypeOf(booleanInputPipe).toBeAssignableTo<StdinOption>();
expectTypeOf(inputPipe).toBeAssignableTo<StdinSyncOption>();
expectTypeOf(booleanInputPipe).toBeAssignableTo<StdinSyncOption>();
expectTypeOf(inputPipe).toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(booleanInputPipe).toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(inputPipe).toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf(booleanInputPipe).toBeAssignableTo<StdoutStderrSyncOption>();
[inputPipe] satisfies StdinOption;
[booleanInputPipe] satisfies StdinOption;
[inputPipe] satisfies StdinSyncOption;
[booleanInputPipe] satisfies StdinSyncOption;
[inputPipe] satisfies StdoutStderrOption;
[booleanInputPipe] satisfies StdoutStderrOption;
[inputPipe] satisfies StdoutStderrSyncOption;
[booleanInputPipe] satisfies StdoutStderrSyncOption;
