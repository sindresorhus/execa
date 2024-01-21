import {Buffer} from 'node:buffer';
import {finished} from 'node:stream/promises';

export const bufferToUint8Array = buffer => new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

export const isUint8Array = value => Object.prototype.toString.call(value) === '[object Uint8Array]' && !Buffer.isBuffer(value);
export const isBinary = value => isUint8Array(value) || Buffer.isBuffer(value);

const textDecoder = new TextDecoder();
export const binaryToString = uint8ArrayOrBuffer => textDecoder.decode(uint8ArrayOrBuffer);

// Like `src.pipe(dest)`, if `src` ends, `dest` ends.
// Like `stream.pipeline(src, dest)`, if `src` aborts/errors, `dest` aborts.
// Unlike `stream.pipeline(src, dest)`, `dest` behavior does not propagate to `src`.
export const pipeline = async (source, destination) => {
	source.pipe(destination);

	try {
		await finished(source);
	} catch {
		destination.destroy();
	}
};
