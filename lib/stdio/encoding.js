import {StringDecoder} from 'node:string_decoder';
import {Buffer} from 'node:buffer';
import {isUint8Array} from './utils.js';
import {willPipeStreams} from './pipe.js';

// Apply the `encoding` option using an implicit generator.
// This encodes the final output of `stdout`/`stderr`.
export const handleStreamsEncoding = (stdioStreams, {encoding}, isSync) => {
	const newStdioStreams = stdioStreams.map(stdioStream => ({...stdioStream, encoding}));
	if (!shouldEncodeOutput(newStdioStreams, encoding, isSync)) {
		return newStdioStreams;
	}

	const objectMode = newStdioStreams.findLast(({type}) => type === 'generator')?.value.objectMode === true;
	const stringDecoder = new StringDecoder(encoding);
	const generator = objectMode
		? {
			transform: encodingEndObjectGenerator.bind(undefined, stringDecoder),
		}
		: {
			transform: encodingEndStringGenerator.bind(undefined, stringDecoder),
			final: encodingEndStringFinal.bind(undefined, stringDecoder),
		};
	return [
		...newStdioStreams,
		{
			...newStdioStreams[0],
			type: 'generator',
			value: {...generator, binary: true, objectMode},
			encoding: 'buffer',
		},
	];
};

const shouldEncodeOutput = (stdioStreams, encoding, isSync) => stdioStreams[0].direction === 'output'
	&& !IGNORED_ENCODINGS.has(encoding)
	&& !isSync
	&& willPipeStreams(stdioStreams);

// eslint-disable-next-line unicorn/text-encoding-identifier-case
const IGNORED_ENCODINGS = new Set(['utf8', 'utf-8', 'buffer']);

const encodingEndStringGenerator = function * (stringDecoder, chunk) {
	yield stringDecoder.write(chunk);
};

const encodingEndStringFinal = function * (stringDecoder) {
	const lastChunk = stringDecoder.end();
	if (lastChunk !== '') {
		yield lastChunk;
	}
};

const encodingEndObjectGenerator = function * (stringDecoder, chunk) {
	yield isUint8Array(chunk) ? stringDecoder.end(chunk) : chunk;
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
export const getEncodingStartGenerator = encoding => {
	if (encoding === 'buffer') {
		return {transform: encodingStartBufferGenerator.bind(undefined, new TextEncoder())};
	}

	const textDecoder = new TextDecoder();
	return {
		transform: encodingStartStringGenerator.bind(undefined, textDecoder),
		final: encodingStartStringFinal.bind(undefined, textDecoder),
	};
};

const encodingStartBufferGenerator = function * (textEncoder, chunk) {
	if (Buffer.isBuffer(chunk)) {
		yield new Uint8Array(chunk);
	} else if (typeof chunk === 'string') {
		yield textEncoder.encode(chunk);
	} else {
		yield chunk;
	}
};

const encodingStartStringGenerator = function * (textDecoder, chunk) {
	yield Buffer.isBuffer(chunk) || isUint8Array(chunk)
		? textDecoder.decode(chunk, {stream: true})
		: chunk;
};

const encodingStartStringFinal = function * (textDecoder) {
	const lastChunk = textDecoder.decode();
	if (lastChunk !== '') {
		yield lastChunk;
	}
};
