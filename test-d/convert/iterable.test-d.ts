import {expectTypeOf, expectError} from 'nz';
import {execa} from '../../index.js';

const subprocess = execa('unicorns');
const bufferSubprocess = execa('unicorns', {encoding: 'buffer', all: true});
const hexSubprocess = execa('unicorns', {encoding: 'hex', all: true});

const asyncIteration = async () => {
	for await (const line of subprocess) {
		expectTypeOf(line).toBe<string>();
	}

	for await (const line of subprocess.iterable()) {
		expectTypeOf(line).toBe<string>();
	}

	for await (const line of subprocess.iterable({binary: false})) {
		expectTypeOf(line).toBe<string>();
	}

	for await (const line of subprocess.iterable({binary: true})) {
		expectTypeOf(line).toBe<Uint8Array>();
	}

	for await (const line of subprocess.iterable({} as {binary: boolean})) {
		expectTypeOf(line).toBe<string | Uint8Array>();
	}

	for await (const line of bufferSubprocess) {
		expectTypeOf(line).toBe<Uint8Array>();
	}

	for await (const line of bufferSubprocess.iterable()) {
		expectTypeOf(line).toBe<Uint8Array>();
	}

	for await (const line of bufferSubprocess.iterable({binary: false})) {
		expectTypeOf(line).toBe<Uint8Array>();
	}

	for await (const line of bufferSubprocess.iterable({binary: true})) {
		expectTypeOf(line).toBe<Uint8Array>();
	}

	for await (const line of bufferSubprocess.iterable({} as {binary: boolean})) {
		expectTypeOf(line).toBe<Uint8Array>();
	}
};

await asyncIteration();

expectTypeOf(subprocess.iterable()).toBe<AsyncIterableIterator<string>>();
expectTypeOf(subprocess.iterable({binary: false})).toBe<AsyncIterableIterator<string>>();
expectTypeOf(subprocess.iterable({binary: true})).toBe<AsyncIterableIterator<Uint8Array>>();
expectTypeOf(subprocess.iterable({} as {binary: boolean})).toBe<AsyncIterableIterator<string | Uint8Array>>();

expectTypeOf(bufferSubprocess.iterable()).toBe<AsyncIterableIterator<Uint8Array>>();
expectTypeOf(bufferSubprocess.iterable({binary: false})).toBe<AsyncIterableIterator<Uint8Array>>();
expectTypeOf(bufferSubprocess.iterable({binary: true})).toBe<AsyncIterableIterator<Uint8Array>>();
expectTypeOf(bufferSubprocess.iterable({} as {binary: boolean})).toBe<AsyncIterableIterator<Uint8Array>>();

expectTypeOf(hexSubprocess.iterable()).toBe<AsyncIterableIterator<Uint8Array>>();
expectTypeOf(hexSubprocess.iterable({binary: false})).toBe<AsyncIterableIterator<Uint8Array>>();
expectTypeOf(hexSubprocess.iterable({binary: true})).toBe<AsyncIterableIterator<Uint8Array>>();
expectTypeOf(hexSubprocess.iterable({} as {binary: boolean})).toBe<AsyncIterableIterator<Uint8Array>>();

subprocess.iterable({});
subprocess.iterable({from: 'stdout'});
subprocess.iterable({from: 'stderr'});
subprocess.iterable({from: 'all'});
subprocess.iterable({from: 'fd3'});
expectError(subprocess.iterable({from: 'fd3' as string}));
expectError(subprocess.iterable({from: 'stdin'}));
expectError(subprocess.iterable({from: 'fd'}));
expectError(subprocess.iterable({from: 'fdNotANumber'}));
expectError(subprocess.iterable({to: 'stdin'}));

subprocess.iterable({binary: false});
expectError(subprocess.iterable({binary: 'false'}));

subprocess.iterable({preserveNewlines: false});
expectError(subprocess.iterable({preserveNewlines: 'false'}));

expectError(subprocess.iterable('stdout'));
expectError(subprocess.iterable({other: 'stdout'}));
