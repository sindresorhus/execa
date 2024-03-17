import {BINARY_ENCODINGS} from '../arguments/encoding.js';
import {initializeConcurrentStreams} from './concurrent.js';
import {createReadable} from './readable.js';
import {createWritable} from './writable.js';
import {createDuplex} from './duplex.js';
import {createIterable} from './iterable.js';

export const addConvertedStreams = (subprocess, {encoding}) => {
	const concurrentStreams = initializeConcurrentStreams();
	const useBinaryEncoding = BINARY_ENCODINGS.has(encoding);
	subprocess.readable = createReadable.bind(undefined, {subprocess, concurrentStreams, useBinaryEncoding});
	subprocess.writable = createWritable.bind(undefined, {subprocess, concurrentStreams});
	subprocess.duplex = createDuplex.bind(undefined, {subprocess, concurrentStreams, useBinaryEncoding});
	subprocess.iterable = createIterable.bind(undefined, subprocess, useBinaryEncoding);
	subprocess[Symbol.asyncIterator] = createIterable.bind(undefined, subprocess, useBinaryEncoding, {});
};
