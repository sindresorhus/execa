import {initializeConcurrentStreams} from './concurrent.js';
import {createReadable} from './readable.js';
import {createWritable} from './writable.js';
import {createDuplex} from './duplex.js';
import {createIterable} from './iterable.js';

export const addConvertedStreams = (subprocess, options) => {
	const concurrentStreams = initializeConcurrentStreams();
	subprocess.readable = createReadable.bind(undefined, {subprocess, concurrentStreams});
	subprocess.writable = createWritable.bind(undefined, {subprocess, concurrentStreams});
	subprocess.duplex = createDuplex.bind(undefined, {subprocess, concurrentStreams});
	subprocess.iterable = createIterable.bind(undefined, subprocess, options);
	subprocess[Symbol.asyncIterator] = createIterable.bind(undefined, subprocess, options, {});
};
