import {expectTypeOf, expectError} from 'nz';
import {execa} from '../../index.js';

const subprocess = execa('unicorns');
const bufferSubprocess = execa('unicorns', {encoding: 'buffer', all: true});
const hexSubprocess = execa('unicorns', {encoding: 'hex', all: true});
const objectTransform = {
	objectMode: true as const,
	* transform() {
		yield {value: 'unicorn'};
	},
};
const objectSubprocess = execa('unicorns', {all: true, stdout: objectTransform});

expectTypeOf(objectSubprocess.iterable()).toBe<AsyncIterableIterator<unknown>>();
expectTypeOf(objectSubprocess[Symbol.asyncIterator]()).toBe<AsyncIterableIterator<unknown>>();

const wrappedObjectSubprocess = execa('unicorns', {stdout: {value: objectTransform}});
expectTypeOf(wrappedObjectSubprocess.iterable()).toBe<AsyncIterableIterator<unknown>>();
expectTypeOf(wrappedObjectSubprocess[Symbol.asyncIterator]()).toBe<AsyncIterableIterator<unknown>>();
const wrappedObjectResult = await wrappedObjectSubprocess;
expectTypeOf(wrappedObjectResult.stdout).toBe<unknown[]>();

const wrappedArraySubprocess = execa('unicorns', {stdout: ['pipe', {value: objectTransform, input: false}] as const});
expectTypeOf(wrappedArraySubprocess.iterable({binary: true})).toBe<AsyncIterableIterator<unknown>>();
const wrappedArrayResult = await wrappedArraySubprocess;
expectTypeOf(wrappedArrayResult.stdout).toBe<string | unknown[]>();

const wrappedStderrSubprocess = execa('unicorns', {all: true, stderr: {value: objectTransform}});
expectTypeOf(wrappedStderrSubprocess.iterable()).toBe<AsyncIterableIterator<string>>();
expectTypeOf(wrappedStderrSubprocess.iterable({from: 'stderr'})).toBe<AsyncIterableIterator<unknown>>();
expectTypeOf(wrappedStderrSubprocess.iterable({from: 'all'})).toBe<AsyncIterableIterator<unknown>>();
const wrappedStderrResult = await wrappedStderrSubprocess;
expectTypeOf(wrappedStderrResult.stderr).toBe<unknown[]>();

const wrappedFdSubprocess = execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', {value: objectTransform, input: false}] as const});
expectTypeOf(wrappedFdSubprocess.iterable({from: 'fd3'})).toBe<AsyncIterableIterator<unknown>>();
const wrappedFdResult = await wrappedFdSubprocess;
expectTypeOf(wrappedFdResult.stdio[3]).toBe<unknown[]>();

const wrappedTextSubprocess = execa('unicorns', {stdout: {value: 'pipe'}});
expectTypeOf(wrappedTextSubprocess.iterable()).toBe<AsyncIterableIterator<string>>();
const wrappedTextResult = await wrappedTextSubprocess;
expectTypeOf(wrappedTextResult.stdout).toBe<string>();

expectTypeOf(objectSubprocess.iterable({from: 'stdout'})).toBe<AsyncIterableIterator<unknown>>();
expectTypeOf(objectSubprocess.iterable({from: 'fd1'})).toBe<AsyncIterableIterator<unknown>>();
expectTypeOf(objectSubprocess.iterable({binary: true})).toBe<AsyncIterableIterator<unknown>>();
expectTypeOf(objectSubprocess.iterable({binary: false, preserveNewlines: true})).toBe<AsyncIterableIterator<unknown>>();
expectTypeOf(objectSubprocess.iterable({from: 'stderr'})).toBe<AsyncIterableIterator<string>>();
expectTypeOf(objectSubprocess.iterable({from: 'fd2', binary: true})).toBe<AsyncIterableIterator<Uint8Array>>();
expectTypeOf(objectSubprocess.iterable({from: 'all'})).toBe<AsyncIterableIterator<unknown>>();
expectTypeOf(objectSubprocess.iterable({from: 'all', binary: true})).toBe<AsyncIterableIterator<unknown>>();
expectTypeOf(objectSubprocess.iterable({} as {from?: 'stdout' | 'stderr'; binary?: boolean})).toBe<AsyncIterableIterator<unknown>>();

const objectStderrSubprocess = execa('unicorns', {all: true, stderr: objectTransform});
expectTypeOf(objectStderrSubprocess.iterable()).toBe<AsyncIterableIterator<string>>();
expectTypeOf(objectStderrSubprocess[Symbol.asyncIterator]()).toBe<AsyncIterableIterator<string>>();
expectTypeOf(objectStderrSubprocess.iterable({from: 'stderr'})).toBe<AsyncIterableIterator<unknown>>();
expectTypeOf(objectStderrSubprocess.iterable({from: 'fd2'})).toBe<AsyncIterableIterator<unknown>>();
expectTypeOf(objectStderrSubprocess.iterable({from: 'all'})).toBe<AsyncIterableIterator<unknown>>();

const objectFdSubprocess = execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', objectTransform] as const});
expectTypeOf(objectFdSubprocess.iterable()).toBe<AsyncIterableIterator<string>>();
expectTypeOf(objectFdSubprocess.iterable({from: 'fd3'})).toBe<AsyncIterableIterator<unknown>>();
expectTypeOf(objectFdSubprocess.iterable({from: 'fd3', binary: true})).toBe<AsyncIterableIterator<unknown>>();
expectTypeOf(objectFdSubprocess.iterable({from: 'fd3' as `fd${number}`})).toBe<AsyncIterableIterator<unknown>>();
expectTypeOf(objectFdSubprocess.iterable({from: 'fd3' as `fd${number}`, binary: true})).toBe<AsyncIterableIterator<unknown>>();

const objectBufferSubprocess = execa('unicorns', {encoding: 'buffer', stdout: objectTransform});
const objectHexSubprocess = execa('unicorns', {encoding: 'hex', stdout: objectTransform});
expectTypeOf(objectBufferSubprocess.iterable()).toBe<AsyncIterableIterator<unknown>>();
expectTypeOf(objectBufferSubprocess[Symbol.asyncIterator]()).toBe<AsyncIterableIterator<unknown>>();
expectTypeOf(objectBufferSubprocess.iterable({binary: false})).toBe<AsyncIterableIterator<unknown>>();
expectTypeOf(objectBufferSubprocess.iterable({from: 'stderr'})).toBe<AsyncIterableIterator<Uint8Array>>();
expectTypeOf(objectHexSubprocess.iterable({binary: true})).toBe<AsyncIterableIterator<unknown>>();

const dynamicObjectSubprocess = execa('unicorns', {stdout: {...objectTransform, objectMode: true as boolean}});
expectTypeOf(dynamicObjectSubprocess.iterable()).toBe<AsyncIterableIterator<unknown>>();

const unionObjectSubprocess = execa('unicorns', {} as {stdout: typeof objectTransform} | {stdout: 'pipe'});
expectTypeOf(unionObjectSubprocess.iterable()).toBe<AsyncIterableIterator<unknown>>();

const unionDefaultSubprocess = execa('unicorns', {} as {} | {stdout: typeof objectTransform});
expectTypeOf(unionDefaultSubprocess.iterable()).toBe<AsyncIterableIterator<unknown>>();

const objectPipe = subprocess.pipe('unicorns', {stdout: objectTransform});
expectTypeOf(objectPipe.iterable()).toBe<AsyncIterableIterator<unknown>>();
expectTypeOf(objectPipe[Symbol.asyncIterator]()).toBe<AsyncIterableIterator<unknown>>();
expectTypeOf(subprocess.pipe(objectSubprocess).iterable()).toBe<AsyncIterableIterator<unknown>>();
expectTypeOf(subprocess.pipe(objectSubprocess).iterable({from: 'stderr'})).toBe<AsyncIterableIterator<string>>();

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
