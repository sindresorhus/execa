import type {Writable} from 'node:stream';
import {expectTypeOf, expectError} from 'nz';
import {$, type Options, type ResultPromise} from '../../index.js';

const subprocess = $('unicorns');
expectTypeOf(subprocess.stdin).toBe<null>();
expectTypeOf(subprocess.stdio[0]).toBe<null>();
expectError(subprocess.stdin.write('input'));

expectTypeOf($`unicorns`.stdin).toBe<null>();
expectTypeOf($({})('unicorns').stdin).toBe<null>();
expectTypeOf($({stdin: undefined})`unicorns`.stdin).toBe<null>();

expectTypeOf($('unicorns', []).stdin).toBe<null>();
expectTypeOf($('unicorns', {}).stdio[0]).toBe<null>();
expectTypeOf($('unicorns', [], {stdin: undefined}).stdin).toBe<null>();
expectTypeOf($({input: undefined, inputFile: undefined, stdio: undefined})`unicorns`.stdin).toBe<null>();
expectTypeOf($({encoding: 'buffer'})('unicorns').stdin).toBe<null>();
expectTypeOf($({})({})('unicorns').stdio[0]).toBe<null>();

declare const input: string | undefined;
declare const inputFile: URL | undefined;
declare const stdin: 'pipe' | undefined;
expectTypeOf($('unicorns', {input}).stdin).toBe<Writable | null>();
expectTypeOf($({inputFile})`unicorns`.stdio[0]).toBe<Writable | null>();
expectTypeOf($({stdin})('unicorns').stdin).toBe<Writable | null>();
expectError($('unicorns', {input}).stdin.write('input'));

// Explicit options already infer the correct stdin stream without the script defaults.
declare const stdio: 'ignore' | undefined;
expectTypeOf($('unicorns', [], {stdio}).stdin).toBe<Writable | null>();
expectTypeOf($('unicorns', {stdin: 'pipe'}).stdin).toBe<Writable>();
expectTypeOf($('unicorns', [], {stdin: 'pipe'}).stdio[0]).toBe<Writable>();
expectTypeOf($({stdin: 'pipe'})`unicorns`.stdin).toBe<Writable>();
expectTypeOf($('unicorns', {input: ''}).stdin).toBe<Writable>();
expectTypeOf($({inputFile: new URL('file:///test')})('unicorns').stdin).toBe<Writable>();
expectTypeOf($('unicorns', {stdio: 'pipe'}).stdin).toBe<Writable>();
expectTypeOf($('unicorns', {stdio: ['pipe', 'pipe', 'pipe']}).stdio[0]).toBe<Writable>();
expectTypeOf($('unicorns', {stdio: ['ignore', 'pipe', 'pipe']}).stdin).toBe<null>();
expectTypeOf($({stdin: 'inherit', input: undefined})`unicorns`.stdin).toBe<null>();
expectTypeOf($({stdin: undefined, stdio: 'ignore'})('unicorns').stdin).toBe<null>();
expectTypeOf($('unicorns', {input: '', inputFile: undefined, stdio: undefined}).stdin).toBe<Writable>();
expectTypeOf(await $('unicorns', {encoding: 'buffer'})).toBeAssignableTo<{stdout: Uint8Array}>();

const options: Options = {};
expectTypeOf($('unicorns', options)).toBeAssignableTo<ResultPromise>();
