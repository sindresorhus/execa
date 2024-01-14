import {Buffer} from 'node:buffer';

const textEncoder = new TextEncoder();

export const foobarString = 'foobar';
export const foobarUint8Array = textEncoder.encode('foobar');
export const foobarArrayBuffer = foobarUint8Array.buffer;
export const foobarUint16Array = new Uint16Array(foobarArrayBuffer);
export const foobarBuffer = Buffer.from(foobarString);
export const foobarDataView = new DataView(foobarArrayBuffer);
export const foobarObject = {foo: 'bar'};
export const foobarObjectString = JSON.stringify(foobarObject);
