import {Buffer} from 'node:buffer';
import {isUint8Array} from '../utils.js';

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
