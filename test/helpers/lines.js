import {Buffer} from 'node:buffer';

const textEncoder = new TextEncoder();

export const stringsToUint8Arrays = strings => strings.map(string => stringToUint8Arrays(string, true));

export const stringToUint8Arrays = (string, isUint8Array) => isUint8Array
	? textEncoder.encode(string)
	: string;

export const simpleFull = 'aaa\nbbb\nccc';
export const simpleChunks = [simpleFull];
export const simpleFullUint8Array = textEncoder.encode(simpleFull);
export const simpleChunksUint8Array = [simpleFullUint8Array];
const simpleFullBuffer = Buffer.from(simpleFull);
export const simpleFullHex = simpleFullBuffer.toString('hex');
export const simpleChunksBuffer = [simpleFullBuffer];
export const simpleFullUtf16Inverted = simpleFullBuffer.toString('utf16le');
const simpleFullUtf16Buffer = Buffer.from(simpleFull, 'utf16le');
export const simpleFullUtf16Uint8Array = new Uint8Array(simpleFullUtf16Buffer);
export const simpleFullEnd = `${simpleFull}\n`;
const simpleFullEndBuffer = Buffer.from(simpleFullEnd);
export const simpleFullEndUtf16Inverted = simpleFullEndBuffer.toString('utf16le');
export const simpleLines = ['aaa\n', 'bbb\n', 'ccc'];
export const simpleFullEndLines = ['aaa\n', 'bbb\n', 'ccc\n'];
export const noNewlinesFull = 'aaabbbccc';
export const noNewlinesChunks = ['aaa', 'bbb', 'ccc'];
export const complexFull = '\naaa\r\nbbb\n\nccc';
const complexFullBuffer = Buffer.from(complexFull);
const complexFullUtf16Buffer = Buffer.from(complexFull, 'utf16le');
export const complexFullUtf16 = complexFullUtf16Buffer.toString();
export const complexFullUtf16Uint8Array = new Uint8Array(complexFullUtf16Buffer);
export const singleComplexBuffer = [complexFullBuffer];
export const singleComplexUtf16Buffer = [complexFullUtf16Buffer];
export const singleComplexUint8Array = textEncoder.encode(complexFull);
export const singleComplexHex = complexFullBuffer.toString('hex');
export const complexChunksEnd = ['\n', 'aaa\r\n', 'bbb\n', '\n', 'ccc'];
export const complexChunks = ['', 'aaa', 'bbb', '', 'ccc'];
