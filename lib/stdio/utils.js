import {Buffer} from 'node:buffer';
import {finished} from 'node:stream/promises';

export const bufferToUint8Array = buffer => new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

export const isUint8Array = value => Object.prototype.toString.call(value) === '[object Uint8Array]' && !Buffer.isBuffer(value);
export const isBinary = value => isUint8Array(value) || Buffer.isBuffer(value);

const textDecoder = new TextDecoder();
export const binaryToString = uint8ArrayOrBuffer => textDecoder.decode(uint8ArrayOrBuffer);

// Like `source.pipe(destination)`, if `source` ends, `destination` ends.
// Like `stream.pipeline(source, destination)`, if `source` aborts/errors, `destination` aborts.
// Unlike `stream.pipeline(source, destination)`, `destination` behavior does not propagate to `source`.
export const pipeline = async (source, destination) => {
	source.pipe(destination);

	try {
		await finished(source);
	} catch {
		destination.destroy();
	}
};
