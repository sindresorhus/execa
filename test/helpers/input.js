import {Buffer} from 'node:buffer';

const textEncoder = new TextEncoder();

export const foobarString = 'foobar';
export const foobarArray = ['foo', 'bar'];
export const foobarUint8Array = textEncoder.encode(foobarString);
export const foobarArrayBuffer = foobarUint8Array.buffer;
export const foobarUint16Array = new Uint16Array(foobarArrayBuffer);
export const foobarBuffer = Buffer.from(foobarString);
const foobarUtf16Buffer = Buffer.from(foobarString, 'utf16le');
export const foobarUtf16Uint8Array = new Uint8Array(foobarUtf16Buffer);
export const foobarDataView = new DataView(foobarArrayBuffer);
export const foobarHex = foobarBuffer.toString('hex');
export const foobarUppercase = foobarString.toUpperCase();
export const foobarUppercaseUint8Array = textEncoder.encode(foobarUppercase);
export const foobarUppercaseHex = Buffer.from(foobarUppercase).toString('hex');
export const foobarObject = {foo: 'bar'};
export const foobarObjectString = JSON.stringify(foobarObject);
