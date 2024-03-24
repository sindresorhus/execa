import {initializeConcurrentStreams} from './concurrent.js';
import {createReadable} from './readable.js';
import {createWritable} from './writable.js';
import {createDuplex} from './duplex.js';
import {createIterable} from './iterable.js';

export const addConvertedStreams = (subprocess, {encoding}) => {
	const concurrentStreams = initializeConcurrentStreams();
	const isBuffer = encoding === 'buffer';
	subprocess.readable = createReadable.bind(undefined, {subprocess, concurrentStreams, isBuffer});
	subprocess.writable = createWritable.bind(undefined, {subprocess, concurrentStreams});
	subprocess.duplex = createDuplex.bind(undefined, {subprocess, concurrentStreams, isBuffer});
	subprocess.iterable = createIterable.bind(undefined, subprocess, isBuffer);
	subprocess[Symbol.asyncIterator] = createIterable.bind(undefined, subprocess, isBuffer, {});
};
