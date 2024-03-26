import {Buffer} from 'node:buffer';

const textEncoder = new TextEncoder();

export const bufferToUint8Array = buffer => new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

export const foobarString = 'foobar';
export const foobarUint8Array = textEncoder.encode('foobar');
export const foobarArrayBuffer = foobarUint8Array.buffer;
export const foobarUint16Array = new Uint16Array(foobarArrayBuffer);
export const foobarBuffer = Buffer.from(foobarString);
const foobarUtf16Buffer = Buffer.from(foobarString, 'utf16le');
export const foobarUtf16Uint8Array = bufferToUint8Array(foobarUtf16Buffer);
export const foobarDataView = new DataView(foobarArrayBuffer);
export const foobarObject = {foo: 'bar'};
export const foobarObjectString = JSON.stringify(foobarObject);
