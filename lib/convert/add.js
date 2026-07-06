import {initializeConcurrentStreams} from './concurrent.js';
import {createReadable} from './readable.js';
import {createWritable} from './writable.js';
import {createDuplex} from './duplex.js';
import {createReadableStream, createWritableStream, createTransformStream} from './web.js';
import {createIterable} from './iterable.js';

// Add methods to convert the subprocess to a stream or iterable
export const addConvertedStreams = (subprocess, {encoding}) => {
	const concurrentStreams = initializeConcurrentStreams();
	subprocess.readable = createReadable.bind(undefined, {subprocess, concurrentStreams, encoding});
	subprocess.writable = createWritable.bind(undefined, {subprocess, concurrentStreams});
	subprocess.duplex = createDuplex.bind(undefined, {subprocess, concurrentStreams, encoding});
	subprocess.readableStream = createReadableStream.bind(undefined, subprocess);
	subprocess.writableStream = createWritableStream.bind(undefined, subprocess);
	subprocess.transformStream = createTransformStream.bind(undefined, subprocess);
	subprocess.iterable = createIterable.bind(undefined, subprocess, encoding);
	subprocess[Symbol.asyncIterator] = createIterable.bind(undefined, subprocess, encoding, {});
};
