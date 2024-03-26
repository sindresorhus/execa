import {Buffer} from 'node:buffer';
import {bufferToUint8Array} from './input.js';

const textEncoder = new TextEncoder();

export const stringsToUint8Arrays = strings => strings.map(string => stringToUint8Arrays(string, true));

export const stringToUint8Arrays = (string, isUint8Array) => isUint8Array
	? textEncoder.encode(string)
	: string;

export const simpleFull = 'aaa\nbbb\nccc';
export const simpleChunks = [simpleFull];
export const simpleFullUint8Array = textEncoder.encode(simpleFull);
export const simpleChunksUint8Array = [simpleFullUint8Array];
export const simpleFullHex = Buffer.from(simpleFull).toString('hex');
export const simpleChunksBuffer = [Buffer.from(simpleFull)];
const simpleFullUtf16Buffer = Buffer.from(simpleFull, 'utf16le');
export const simpleFullUtf16Uint8Array = bufferToUint8Array(simpleFullUtf16Buffer);
export const simpleLines = ['aaa\n', 'bbb\n', 'ccc'];
export const simpleFullEndLines = ['aaa\n', 'bbb\n', 'ccc\n'];
export const noNewlinesFull = 'aaabbbccc';
export const noNewlinesChunks = ['aaa', 'bbb', 'ccc'];
export const complexFull = '\naaa\r\nbbb\n\nccc';
export const singleComplexBuffer = [Buffer.from(complexFull)];
export const singleComplexUint8Array = textEncoder.encode(complexFull);
export const singleComplexHex = Buffer.from(complexFull).toString('hex');
export const singleComplexHexBuffer = Buffer.from(singleComplexHex);
export const singleComplexHexUint8Array = textEncoder.encode(singleComplexHex);
export const complexChunksEnd = ['\n', 'aaa\r\n', 'bbb\n', '\n', 'ccc'];
export const complexChunks = ['', 'aaa', 'bbb', '', 'ccc'];
