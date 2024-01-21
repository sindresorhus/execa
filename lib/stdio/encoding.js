import {StringDecoder} from 'node:string_decoder';
import {Buffer} from 'node:buffer';
import {isUint8Array} from './utils.js';

// Apply the `encoding` option using an implicit generator.
// This encodes the final output of `stdout`/`stderr`.
export const handleStreamsEncoding = (stdioStreams, {encoding}, isSync) => {
	const newStdioStreams = stdioStreams.map(stdioStream => ({...stdioStream, encoding}));
	if (newStdioStreams[0].direction === 'input' || IGNORED_ENCODINGS.has(encoding) || isSync) {
		return newStdioStreams;
	}

	const objectMode = newStdioStreams.findLast(({type}) => type === 'generator')?.value.objectMode === true;
	const encodingEndGenerator = objectMode ? encodingEndObjectGenerator : encodingEndStringGenerator;
	const transform = encodingEndGenerator.bind(undefined, encoding);
	return [
		...newStdioStreams,
		{
			...newStdioStreams[0],
			type: 'generator',
			value: {transform, binary: true, objectMode},
			encoding: 'buffer',
		},
	];
};

// eslint-disable-next-line unicorn/text-encoding-identifier-case
const IGNORED_ENCODINGS = new Set(['utf8', 'utf-8', 'buffer']);

const encodingEndStringGenerator = async function * (encoding, chunks) {
	const stringDecoder = new StringDecoder(encoding);

	for await (const chunk of chunks) {
		yield stringDecoder.write(chunk);
	}

	const lastChunk = stringDecoder.end();
	if (lastChunk !== '') {
		yield lastChunk;
	}
};

const encodingEndObjectGenerator = async function * (encoding, chunks) {
	const stringDecoder = new StringDecoder(encoding);

	for await (const chunk of chunks) {
		yield isUint8Array(chunk) ? stringDecoder.end(chunk) : chunk;
	}
};

/*
When using generators, add an internal generator that converts chunks from `Buffer` to `string` or `Uint8Array`.
This allows generator functions to operate with those types instead.
Chunks might be Buffer, Uint8Array or strings since:
- `childProcess.stdout|stderr` emits Buffers
- `childProcess.stdin.write()` accepts Buffer, Uint8Array or string
- Previous generators might return Uint8Array or string

However, those are converted to Buffer:
- on writes: `Duplex.writable` `decodeStrings: true` default option
- on reads: `Duplex.readable` `readableEncoding: null` default option
*/
export const getEncodingStartGenerator = encoding => encoding === 'buffer'
	? encodingStartBufferGenerator
	: encodingStartStringGenerator;

const encodingStartBufferGenerator = async function * (chunks) {
	const textEncoder = new TextEncoder();

	for await (const chunk of chunks) {
		if (Buffer.isBuffer(chunk)) {
			yield new Uint8Array(chunk);
		} else if (typeof chunk === 'string') {
			yield textEncoder.encode(chunk);
		} else {
			yield chunk;
		}
	}
};

const encodingStartStringGenerator = async function * (chunks) {
	const textDecoder = new TextDecoder();

	for await (const chunk of chunks) {
		yield Buffer.isBuffer(chunk) || isUint8Array(chunk)
			? textDecoder.decode(chunk, {stream: true})
			: chunk;
	}

	const lastChunk = textDecoder.decode();
	if (lastChunk !== '') {
		yield lastChunk;
	}
};
