import {Buffer} from 'node:buffer';

export const isSimpleEncoding = encoding => isBufferEncoding(encoding) || DEFAULT_ENCODING.has(encoding.toLowerCase());

// eslint-disable-next-line unicorn/text-encoding-identifier-case
const DEFAULT_ENCODING = new Set(['utf8', 'utf-8']);

export const isBufferEncoding = encoding => encoding === null || encoding.toLowerCase() === 'buffer';

export const isBinaryEncoding = encoding => isBufferEncoding(encoding) || BINARY_ENCODINGS.has(encoding.toLowerCase());

const BINARY_ENCODINGS = new Set(['hex', 'base64', 'base64url', 'latin1', 'binary', 'ascii']);

export const bufferToUint8Array = buffer => new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

export const isUint8Array = value => Object.prototype.toString.call(value) === '[object Uint8Array]' && !Buffer.isBuffer(value);

const textDecoder = new TextDecoder();
export const uint8ArrayToString = uint8Array => textDecoder.decode(uint8Array);
