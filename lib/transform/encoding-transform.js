import {Buffer} from 'node:buffer';
import {StringDecoder} from 'node:string_decoder';
import {getStringEncoding} from '../arguments/encoding-option.js';
import {isUint8Array, bufferToUint8Array} from '../utils/uint-array.js';

/*
When using binary encodings, add an internal generator that converts chunks from `Buffer` to `string` or `Uint8Array`.
Chunks might be Buffer, Uint8Array or strings since:
- `subprocess.stdout|stderr` emits Buffers
- `subprocess.stdin.write()` accepts Buffer, Uint8Array or string
- Previous generators might return Uint8Array or string

However, those are converted to Buffer:
- on writes: `Duplex.writable` `decodeStrings: true` default option
- on reads: `Duplex.readable` `readableEncoding: null` default option
*/
export const getEncodingTransformGenerator = (binary, encoding, skipped) => {
	if (skipped) {
		return;
	}

	if (binary) {
		return {transform: encodingUint8ArrayGenerator.bind(undefined, new TextEncoder())};
	}

	const stringDecoder = new StringDecoder(encoding);
	return {
		transform: encodingStringGenerator.bind(undefined, stringDecoder),
		final: encodingStringFinal.bind(undefined, stringDecoder),
	};
};

const encodingUint8ArrayGenerator = function * (textEncoder, chunk) {
	if (Buffer.isBuffer(chunk)) {
		yield bufferToUint8Array(chunk);
	} else if (typeof chunk === 'string') {
		yield textEncoder.encode(chunk);
	} else {
		yield chunk;
	}
};

const encodingStringGenerator = function * (stringDecoder, chunk) {
	yield isUint8Array(chunk) ? stringDecoder.write(chunk) : chunk;
};

const encodingStringFinal = function * (stringDecoder) {
	const lastChunk = stringDecoder.end();
	if (lastChunk !== '') {
		yield lastChunk;
	}
};

/*
Once the user's transform has run, its string chunks are converted to bytes: by `Transform.push()` with the asynchronous methods, and by `joinToString()` with the synchronous ones. Both use UTF-8, yet the result is then decoded with the `encoding` option, which would corrupt the text when that option is a different text encoding.
Therefore, those chunks are converted using the `encoding` option beforehand.
With the `binary` transform option, they are converted with UTF-8 even when the `encoding` option is another text encoding. Otherwise, with synchronous methods, the next transform would receive the string itself, while with asynchronous methods it receives those UTF-8 bytes decoded with the `encoding` option.
When the `encoding` option is UTF-8, strings round-trip unchanged, so there is nothing to do.
*/
export const getStringToBytesGenerator = (binary, encoding, skipped) => skipped || encoding === 'utf8'
	? undefined
	: {transform: stringToBytesGenerator.bind(undefined, getStringEncoding(binary, encoding))};

const stringToBytesGenerator = function * (stringEncoding, chunk) {
	yield typeof chunk === 'string' ? bufferToUint8Array(Buffer.from(chunk, stringEncoding)) : chunk;
};
