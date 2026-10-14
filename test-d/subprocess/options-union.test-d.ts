import type {Readable, Writable} from 'node:stream';
import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaNode,
	$,
	type Subprocess,
} from '../../index.js';

declare const outputOptions: {stdout: 'ignore'} | {encoding: 'buffer'};
const subprocess = execa('unicorns', outputOptions);
expectTypeOf(subprocess.stdout).toBe<Readable | null>();
expectTypeOf(subprocess.stdio[1]).toBe<Readable | null>();
expectError(subprocess.stdout.read());
expectTypeOf<Subprocess<typeof outputOptions>['stdout']>().toBe<Readable | null>();
expectTypeOf(execa(outputOptions)`unicorns`.stdout).toBe<Readable | null>();
expectTypeOf(execaNode('unicorns', outputOptions).stdout).toBe<Readable | null>();
expectTypeOf($(outputOptions)`unicorns`.stdout).toBe<Readable | null>();
expectTypeOf($(outputOptions)`unicorns`.stdio[1]).toBe<Readable | null>();

declare const stderrOptions: {stderr: 'inherit'} | {encoding: 'buffer'};
const stderrSubprocess = execa('unicorns', [], stderrOptions);
expectTypeOf(stderrSubprocess.stderr).toBe<Readable | null>();
expectTypeOf(stderrSubprocess.stdio[2]).toBe<Readable | null>();

declare const allOptions: {all: true} | {lines: true};
expectTypeOf(execa('unicorns', allOptions).all).toBe<Readable | undefined>();
expectTypeOf(execaNode(allOptions)`unicorns`.all).toBe<Readable | undefined>();
expectTypeOf($(allOptions)`unicorns`.all).toBe<Readable | undefined>();

declare const ignoredAllOptions: {all: true; stdout: 'ignore'; stderr: 'ignore'} | {all: false; encoding: 'buffer'};
expectTypeOf(execa('unicorns', ignoredAllOptions).all).toBe<undefined>();

declare const mixedAllOptions: {all: true; stdout: 'ignore'; stderr: 'ignore'} | {all: true; stdout: 'pipe'};
expectTypeOf(execa('unicorns', mixedAllOptions).all).toBe<Readable | undefined>();

declare const descriptorOptions: {stdio: ['pipe', 'pipe', 'pipe', {value: 'pipe'; input: true}]} | {stdio: ['pipe', 'pipe', 'pipe', 'pipe']};
expectTypeOf(execa('unicorns', descriptorOptions).stdio[3]).toBe<Writable | Readable>();

declare const stdout: 'ignore' | 'pipe';
const dynamicOutputSubprocess = execa('unicorns', {all: true, stdout, stderr: 'ignore'});
expectTypeOf(dynamicOutputSubprocess.all).toBe<Readable | undefined>();
expectError(dynamicOutputSubprocess.all.read());
expectTypeOf(execaNode({all: true, stdout, stderr: 'ignore'})`unicorns`.all).toBe<Readable | undefined>();
expectTypeOf($({all: true, stdout, stderr: 'ignore'})`unicorns`.all).toBe<Readable | undefined>();

// Input modes, shared option keys and optional flags already preserve the stream shape.
declare const ignoredDescriptorOptions: {stdio: ['pipe', 'pipe', 'pipe', {value: 'pipe'; input: true}]} | {stdio: ['pipe', 'pipe', 'pipe', 'ignore']};
expectTypeOf(execa('unicorns', ignoredDescriptorOptions).stdio[3]).toBe<Writable | null>();
declare const inputOptions: {stdin: 'ignore'} | {encoding: 'buffer'};
expectTypeOf(execa('unicorns', inputOptions).stdin).toBe<Writable | null>();
expectTypeOf(execa('unicorns', inputOptions).stdio[0]).toBe<Writable | null>();
declare const sharedOutputOptions: {stdout: 'ignore'} | {stdout: 'pipe'};
expectTypeOf(execa('unicorns', sharedOutputOptions).stdout).toBe<Readable | null>();
declare const optionalAllOptions: {all?: true};
expectTypeOf(execa('unicorns', optionalAllOptions).all).toBe<Readable | undefined>();
expectTypeOf(execa('unicorns', {all: true as boolean}).all).toBe<Readable | undefined>();
expectTypeOf(execa('unicorns').stdout).toBe<Readable>();
expectTypeOf(execa('unicorns').stdin).toBe<Writable>();
