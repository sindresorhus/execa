import type {Readable, Writable} from 'node:stream';
import {expectTypeOf} from 'nz';
import {execa, $} from '../../index.js';

const inputSubprocess = execa('unicorns', {stdin: 'inherit', input: 'text'});
expectTypeOf(inputSubprocess.stdin).toBe<Writable>();
expectTypeOf(inputSubprocess.stdio[0]).toBe<Writable>();

const scriptInputSubprocess = $({stdin: 'inherit', input: 'text'})`unicorns`;
expectTypeOf(scriptInputSubprocess.stdin).toBe<Writable>();
expectTypeOf(scriptInputSubprocess.stdio[0]).toBe<Writable>();

const inputFileSubprocess = execa('unicorns', {stdin: 'inherit', inputFile: 'input.txt'});
expectTypeOf(inputFileSubprocess.stdin).toBe<Writable>();
expectTypeOf(inputFileSubprocess.stdio[0]).toBe<Writable>();
const scriptInputFileSubprocess = $({stdin: 'inherit', inputFile: new URL('file:///test')})`unicorns`;
expectTypeOf(scriptInputFileSubprocess.stdin).toBe<Writable>();
expectTypeOf(scriptInputFileSubprocess.stdio[0]).toBe<Writable>();

const emptyInputSubprocess = execa('unicorns', {stdin: 'inherit', input: ''});
expectTypeOf(emptyInputSubprocess.stdin).toBe<Writable>();
const binaryInputSubprocess = execa('unicorns', {stdin: 'inherit', input: new Uint8Array()});
expectTypeOf(binaryInputSubprocess.stdin).toBe<Writable>();
const singletonInputSubprocess = execa('unicorns', {stdin: ['inherit'] as const, input: 'text'});
expectTypeOf(singletonInputSubprocess.stdin).toBe<Writable>();
expectTypeOf(singletonInputSubprocess.stdio[0]).toBe<Writable>();
const wrappedInputSubprocess = execa('unicorns', {stdin: {value: 'inherit', input: true}, input: 'text'});
expectTypeOf(wrappedInputSubprocess.stdin).toBe<Writable>();
const wrappedSingletonInputSubprocess = execa('unicorns', {stdin: [{value: 'inherit'}] as const, inputFile: 'input.txt'});
expectTypeOf(wrappedSingletonInputSubprocess.stdin).toBe<Writable>();
const stdioInputSubprocess = execa('unicorns', {stdio: 'inherit', input: 'text'});
expectTypeOf(stdioInputSubprocess.stdin).toBe<Writable>();
expectTypeOf(stdioInputSubprocess.stdio[0]).toBe<Writable>();
const tupleInputSubprocess = execa('unicorns', {stdio: ['inherit', 'pipe', 'pipe'] as const, input: 'text'});
expectTypeOf(tupleInputSubprocess.stdin).toBe<Writable>();
expectTypeOf(tupleInputSubprocess.stdio[0]).toBe<Writable>();
const wrappedTupleInputSubprocess = execa('unicorns', {stdio: [{value: 'inherit'}, 'pipe', 'pipe'] as const, inputFile: 'input.txt'});
expectTypeOf(wrappedTupleInputSubprocess.stdin).toBe<Writable>();

const optionalInput: {input?: string} = {};
const optionalInputSubprocess = execa('unicorns', {stdin: 'inherit', ...optionalInput});
expectTypeOf(optionalInputSubprocess.stdin).toBe<Writable | null>();
expectTypeOf(optionalInputSubprocess.stdio[0]).toBe<Writable | null>();
const optionalScriptInputSubprocess = $({stdin: 'inherit', ...optionalInput})`unicorns`;
expectTypeOf(optionalScriptInputSubprocess.stdin).toBe<Writable | null>();
const optionalInputFile: {inputFile?: string} = {};
const optionalFileSubprocess = execa('unicorns', {stdin: 'inherit', ...optionalInputFile});
expectTypeOf(optionalFileSubprocess.stdin).toBe<Writable | null>();
const requiredMaybeInput: {input: string | undefined} = {input: undefined};
const requiredMaybeInputSubprocess = execa('unicorns', {stdin: 'inherit', ...requiredMaybeInput});
expectTypeOf(requiredMaybeInputSubprocess.stdin).toBe<Writable | null>();
const combinedInputSubprocess = execa('unicorns', {stdin: 'inherit', ...optionalInput, inputFile: 'input.txt'});
expectTypeOf(combinedInputSubprocess.stdin).toBe<Writable>();

// Explicitly undefined input keeps inherited stdin, and input options do not change output descriptors.
const inheritedSubprocess = execa('unicorns', {stdin: 'inherit'});
expectTypeOf(inheritedSubprocess.stdin).toBe<null>();
const undefinedInputSubprocess = execa('unicorns', {stdin: 'inherit', input: undefined, inputFile: undefined});
expectTypeOf(undefinedInputSubprocess.stdin).toBe<null>();
expectTypeOf(undefinedInputSubprocess.stdio[0]).toBe<null>();
const undefinedScriptInputSubprocess = $({stdin: 'inherit', input: undefined, inputFile: undefined})`unicorns`;
expectTypeOf(undefinedScriptInputSubprocess.stdin).toBe<null>();
const singletonInheritedSubprocess = execa('unicorns', {stdin: ['inherit'] as const, input: undefined});
expectTypeOf(singletonInheritedSubprocess.stdin).toBe<null>();
const wrappedInheritedSubprocess = execa('unicorns', {stdin: {value: 'inherit'}, input: undefined});
expectTypeOf(wrappedInheritedSubprocess.stdin).toBe<null>();
const wrappedSingletonInheritedSubprocess = execa('unicorns', {stdin: [{value: 'inherit'}] as const});
expectTypeOf(wrappedSingletonInheritedSubprocess.stdin).toBe<null>();
expectTypeOf(stdioInputSubprocess.stdout).toBe<null>();
expectTypeOf(stdioInputSubprocess.stderr).toBe<null>();
expectTypeOf(stdioInputSubprocess.stdio[1]).toBe<null>();
expectTypeOf(stdioInputSubprocess.stdio[2]).toBe<null>();
expectTypeOf(tupleInputSubprocess.stdout).toBe<Readable>();
expectTypeOf(tupleInputSubprocess.stderr).toBe<Readable>();
const inheritedOutputSubprocess = execa('unicorns', {
	stdin: 'inherit',
	stdout: 'inherit',
	stderr: 'inherit',
	input: 'text',
});
expectTypeOf(inheritedOutputSubprocess.stdout).toBe<null>();
expectTypeOf(inheritedOutputSubprocess.stderr).toBe<null>();
const extraOutputSubprocess = execa('unicorns', {stdio: ['inherit', 'pipe', 'pipe', 'inherit'] as const, input: 'text'});
expectTypeOf(extraOutputSubprocess.stdio[3]).toBe<null>();

declare const inputSourceOptions: {stdin: 'inherit'; input: string} | {stdin: 'inherit'; inputFile: string};
const unionInputSubprocess = execa('unicorns', inputSourceOptions);
expectTypeOf(unionInputSubprocess.stdin).toBe<Writable>();
expectTypeOf(unionInputSubprocess.stdio[0]).toBe<Writable>();
const unionScriptInputSubprocess = $(inputSourceOptions)`unicorns`;
expectTypeOf(unionScriptInputSubprocess.stdin).toBe<Writable>();
expectTypeOf(unionScriptInputSubprocess.stdio[0]).toBe<Writable>();
