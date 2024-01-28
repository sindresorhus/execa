import {Buffer} from 'node:buffer';
import process from 'node:process';
import {finished} from 'node:stream/promises';

export const bufferToUint8Array = buffer => new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

export const isUint8Array = value => Object.prototype.toString.call(value) === '[object Uint8Array]' && !Buffer.isBuffer(value);
export const isBinary = value => isUint8Array(value) || Buffer.isBuffer(value);

const textDecoder = new TextDecoder();
export const binaryToString = uint8ArrayOrBuffer => textDecoder.decode(uint8ArrayOrBuffer);

// Like `source.pipe(destination)`, if `source` ends, `destination` ends.
// Like `Stream.pipeline(source, destination)`, if `source` aborts/errors, `destination` aborts.
// Unlike `Stream.pipeline(source, destination)`, if `destination` ends/aborts/errors, `source` does not end/abort/error.
export const pipeStreams = async (source, destination) => {
	source.pipe(destination);

	try {
		await finished(source);
	} catch {
		destination.destroy();
	}
};

export const isStandardStream = stream => STANDARD_STREAMS.includes(stream);
export const STANDARD_STREAMS = [process.stdin, process.stdout, process.stderr];
