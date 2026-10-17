import process from 'node:process';
import {Readable, type Writable} from 'node:stream';
import {expectTypeOf} from 'nz';
import {
	execa,
	execaNode,
	$,
	type Result,
} from '../../index.js';

const inputSubprocess = execa('unicorns', {stdin: Readable.from(['first']), input: 'second'});
expectTypeOf(inputSubprocess.stdin).toBe<Writable>();
expectTypeOf(inputSubprocess.stdio[0]).toBe<Writable>();

const emptyInputSubprocess = execa('unicorns', {stdin: Readable.from(['first']), input: ''});
expectTypeOf(emptyInputSubprocess.stdin).toBe<Writable>();

const emptyBinarySubprocess = execa('unicorns', {stdin: Readable.from(['first']), input: new Uint8Array()});
expectTypeOf(emptyBinarySubprocess.stdin).toBe<Writable>();
const singletonSubprocess = execa('unicorns', {stdin: [Readable.from(['first'])] as const, input: 'second'});
expectTypeOf(singletonSubprocess.stdin).toBe<Writable>();
expectTypeOf(singletonSubprocess.stdio[0]).toBe<Writable>();
const tupleSubprocess = execa('unicorns', {stdio: [Readable.from(['first']), 'pipe', 'pipe'] as const, input: 'second'});
expectTypeOf(tupleSubprocess.stdin).toBe<Writable>();
expectTypeOf(tupleSubprocess.stdio[0]).toBe<Writable>();

const nodeSubprocess = execaNode({stdin: Readable.from(['first']), input: 'second'})`unicorns`;
expectTypeOf(nodeSubprocess.stdin).toBe<Writable>();
const scriptSubprocess = $({stdin: Readable.from(['first']), input: 'second'})`unicorns`;
expectTypeOf(scriptSubprocess.stdin).toBe<Writable>();
expectTypeOf(scriptSubprocess.stdio[0]).toBe<Writable>();

const fileSubprocess = execa('unicorns', {stdin: Readable.from(['first']), inputFile: 'input.txt'});
expectTypeOf(fileSubprocess.stdin).toBe<Writable>();
const fileUrlSubprocess = $({stdin: Readable.from(['first']), inputFile: new URL('file:///test')})`unicorns`;
expectTypeOf(fileUrlSubprocess.stdin).toBe<Writable>();
expectTypeOf(fileUrlSubprocess.stdio[0]).toBe<Writable>();

const sharedReadable = Readable.from(['first']);
const duplicateSubprocess = execa('unicorns', {stdin: sharedReadable, input: sharedReadable});
expectTypeOf(duplicateSubprocess.stdin).toBe<Writable>();

declare const optionalInput: {input?: string};
const optionalInputSubprocess = execa('unicorns', {stdin: process.stdin, ...optionalInput});
expectTypeOf(optionalInputSubprocess.stdin).toBe<Writable | null>();
expectTypeOf(optionalInputSubprocess.stdio[0]).toBe<Writable | null>();
declare const optionalInputFile: {inputFile?: URL};
expectTypeOf(execa('unicorns', {stdin: process.stdin, ...optionalInputFile}).stdin).toBe<Writable | null>();
declare const maybeInput: Uint8Array | undefined;
expectTypeOf($({stdin: process.stdin, input: maybeInput})`unicorns`.stdin).toBe<Writable | null>();

declare const inputOptions: {stdin: Readable; input: string} | {stdin: Readable; inputFile: URL};
const unionSubprocess = execa('unicorns', inputOptions);
expectTypeOf(unionSubprocess.stdin).toBe<Writable>();
expectTypeOf(unionSubprocess.stdio[0]).toBe<Writable>();

// Without another input source, native stdin stays unpiped. Transforms and output modes are preserved.
const nativeSubprocess = execa('unicorns', {stdin: process.stdin});
expectTypeOf(nativeSubprocess.stdin).toBe<null>();
const undefinedSubprocess = execa('unicorns', {stdin: process.stdin, input: undefined, inputFile: undefined});
expectTypeOf(undefinedSubprocess.stdin).toBe<null>();
expectTypeOf(undefinedSubprocess.stdio[0]).toBe<null>();
expectTypeOf(tupleSubprocess.stdout).toBe<Readable>();
expectTypeOf(tupleSubprocess.stderr).toBe<Readable>();

const objectModeOptions = {
	input: '',
	stdin: {
		objectMode: true as const,
		* transform(chunk: unknown) {
			yield JSON.stringify(chunk);
		},
	},
	stdout: {
		objectMode: true as const,
		* transform() {
			yield {value: 'output'};
		},
	},
};
const objectModeSubprocess = execa('unicorns', objectModeOptions);
expectTypeOf(objectModeSubprocess.stdin).toBe<Writable>();
expectTypeOf(objectModeSubprocess.iterable()).toBe<AsyncIterableIterator<unknown>>();
expectTypeOf<Result<typeof objectModeOptions>['stdio'][0]>().toBe<undefined>();
