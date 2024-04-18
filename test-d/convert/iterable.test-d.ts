import {expectType, expectError} from 'tsd';
import {execa} from '../../index.js';

const execaPromise = execa('unicorns');
const execaBufferPromise = execa('unicorns', {encoding: 'buffer', all: true});
const execaHexPromise = execa('unicorns', {encoding: 'hex', all: true});

const asyncIteration = async () => {
	for await (const line of execaPromise) {
		expectType<string>(line);
	}

	for await (const line of execaPromise.iterable()) {
		expectType<string>(line);
	}

	for await (const line of execaPromise.iterable({binary: false})) {
		expectType<string>(line);
	}

	for await (const line of execaPromise.iterable({binary: true})) {
		expectType<Uint8Array>(line);
	}

	for await (const line of execaPromise.iterable({} as {binary: boolean})) {
		expectType<string | Uint8Array>(line);
	}

	for await (const line of execaBufferPromise) {
		expectType<Uint8Array>(line);
	}

	for await (const line of execaBufferPromise.iterable()) {
		expectType<Uint8Array>(line);
	}

	for await (const line of execaBufferPromise.iterable({binary: false})) {
		expectType<Uint8Array>(line);
	}

	for await (const line of execaBufferPromise.iterable({binary: true})) {
		expectType<Uint8Array>(line);
	}

	for await (const line of execaBufferPromise.iterable({} as {binary: boolean})) {
		expectType<Uint8Array>(line);
	}
};

await asyncIteration();

expectType<AsyncIterableIterator<string>>(execaPromise.iterable());
expectType<AsyncIterableIterator<string>>(execaPromise.iterable({binary: false}));
expectType<AsyncIterableIterator<Uint8Array>>(execaPromise.iterable({binary: true}));
expectType<AsyncIterableIterator<string | Uint8Array>>(execaPromise.iterable({} as {binary: boolean}));

expectType<AsyncIterableIterator<Uint8Array>>(execaBufferPromise.iterable());
expectType<AsyncIterableIterator<Uint8Array>>(execaBufferPromise.iterable({binary: false}));
expectType<AsyncIterableIterator<Uint8Array>>(execaBufferPromise.iterable({binary: true}));
expectType<AsyncIterableIterator<Uint8Array>>(execaBufferPromise.iterable({} as {binary: boolean}));

expectType<AsyncIterableIterator<Uint8Array>>(execaHexPromise.iterable());
expectType<AsyncIterableIterator<Uint8Array>>(execaHexPromise.iterable({binary: false}));
expectType<AsyncIterableIterator<Uint8Array>>(execaHexPromise.iterable({binary: true}));
expectType<AsyncIterableIterator<Uint8Array>>(execaHexPromise.iterable({} as {binary: boolean}));

execaPromise.iterable({});
execaPromise.iterable({from: 'stdout'});
execaPromise.iterable({from: 'stderr'});
execaPromise.iterable({from: 'all'});
execaPromise.iterable({from: 'fd3'});
expectError(execaPromise.iterable({from: 'stdin'}));
expectError(execaPromise.iterable({from: 'fd'}));
expectError(execaPromise.iterable({from: 'fdNotANumber'}));
expectError(execaPromise.iterable({to: 'stdin'}));

execaPromise.iterable({binary: false});
expectError(execaPromise.iterable({binary: 'false'}));

execaPromise.iterable({preserveNewlines: false});
expectError(execaPromise.iterable({preserveNewlines: 'false'}));

expectError(execaPromise.iterable('stdout'));
expectError(execaPromise.iterable({other: 'stdout'}));
