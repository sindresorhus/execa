import {Buffer} from 'node:buffer';

export const bufferToUint8Array = buffer => new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

export const isUint8Array = value => Object.prototype.toString.call(value) === '[object Uint8Array]' && !Buffer.isBuffer(value);
export const isBinary = value => isUint8Array(value) || Buffer.isBuffer(value);

const textDecoder = new TextDecoder();
export const binaryToString = uint8ArrayOrBuffer => textDecoder.decode(uint8ArrayOrBuffer);
