import {expectType, expectError} from 'tsd';
import {execa} from '../../index.js';

const subprocess = execa('unicorns');
const bufferSubprocess = execa('unicorns', {encoding: 'buffer', all: true});
const hexSubprocess = execa('unicorns', {encoding: 'hex', all: true});

const asyncIteration = async () => {
	for await (const line of subprocess) {
		expectType<string>(line);
	}

	for await (const line of subprocess.iterable()) {
		expectType<string>(line);
	}

	for await (const line of subprocess.iterable({binary: false})) {
		expectType<string>(line);
	}

	for await (const line of subprocess.iterable({binary: true})) {
		expectType<Uint8Array>(line);
	}

	for await (const line of subprocess.iterable({} as {binary: boolean})) {
		expectType<string | Uint8Array>(line);
	}

	for await (const line of bufferSubprocess) {
		expectType<Uint8Array>(line);
	}

	for await (const line of bufferSubprocess.iterable()) {
		expectType<Uint8Array>(line);
	}

	for await (const line of bufferSubprocess.iterable({binary: false})) {
		expectType<Uint8Array>(line);
	}

	for await (const line of bufferSubprocess.iterable({binary: true})) {
		expectType<Uint8Array>(line);
	}

	for await (const line of bufferSubprocess.iterable({} as {binary: boolean})) {
		expectType<Uint8Array>(line);
	}
};

await asyncIteration();

expectType<AsyncIterableIterator<string>>(subprocess.iterable());
expectType<AsyncIterableIterator<string>>(subprocess.iterable({binary: false}));
expectType<AsyncIterableIterator<Uint8Array>>(subprocess.iterable({binary: true}));
expectType<AsyncIterableIterator<string | Uint8Array>>(subprocess.iterable({} as {binary: boolean}));

expectType<AsyncIterableIterator<Uint8Array>>(bufferSubprocess.iterable());
expectType<AsyncIterableIterator<Uint8Array>>(bufferSubprocess.iterable({binary: false}));
expectType<AsyncIterableIterator<Uint8Array>>(bufferSubprocess.iterable({binary: true}));
expectType<AsyncIterableIterator<Uint8Array>>(bufferSubprocess.iterable({} as {binary: boolean}));

expectType<AsyncIterableIterator<Uint8Array>>(hexSubprocess.iterable());
expectType<AsyncIterableIterator<Uint8Array>>(hexSubprocess.iterable({binary: false}));
expectType<AsyncIterableIterator<Uint8Array>>(hexSubprocess.iterable({binary: true}));
expectType<AsyncIterableIterator<Uint8Array>>(hexSubprocess.iterable({} as {binary: boolean}));

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
