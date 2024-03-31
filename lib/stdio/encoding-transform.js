import {Buffer} from 'node:buffer';
import {isUint8Array} from './uint-array.js';

/*
When using generators, add an internal generator that converts chunks from `Buffer` to `string` or `Uint8Array`.
This allows generator functions to operate with those types instead.
Chunks might be Buffer, Uint8Array or strings since:
- `subprocess.stdout|stderr` emits Buffers
- `subprocess.stdin.write()` accepts Buffer, Uint8Array or string
- Previous generators might return Uint8Array or string

However, those are converted to Buffer:
- on writes: `Duplex.writable` `decodeStrings: true` default option
- on reads: `Duplex.readable` `readableEncoding: null` default option
*/
export const getEncodingTransformGenerator = (binary, writableObjectMode, forceEncoding) => {
	if (writableObjectMode && !forceEncoding) {
		return;
	}

	if (binary) {
		return {transform: encodingUint8ArrayGenerator.bind(undefined, new TextEncoder())};
	}

	const textDecoder = new TextDecoder();
	return {
		transform: encodingStringGenerator.bind(undefined, textDecoder),
		final: encodingStringFinal.bind(undefined, textDecoder),
	};
};

const encodingUint8ArrayGenerator = function * (textEncoder, chunk) {
	if (Buffer.isBuffer(chunk)) {
		yield new Uint8Array(chunk);
	} else if (typeof chunk === 'string') {
		yield textEncoder.encode(chunk);
	} else {
		yield chunk;
	}
};

const encodingStringGenerator = function * (textDecoder, chunk) {
	yield Buffer.isBuffer(chunk) || isUint8Array(chunk)
		? textDecoder.decode(chunk, {stream: true})
		: chunk;
};

const encodingStringFinal = function * (textDecoder) {
	const lastChunk = textDecoder.decode();
	if (lastChunk !== '') {
		yield lastChunk;
	}
};
