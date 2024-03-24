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
export const simpleChunksBuffer = [Buffer.from(simpleFull)];
export const simpleLines = ['aaa\n', 'bbb\n', 'ccc'];
export const simpleFullEndLines = ['aaa\n', 'bbb\n', 'ccc\n'];
export const noNewlinesFull = 'aaabbbccc';
export const noNewlinesChunks = ['aaa', 'bbb', 'ccc'];
export const complexFull = '\naaa\r\nbbb\n\nccc';
export const singleComplexBuffer = [Buffer.from(complexFull)];
export const singleComplexUint8Array = textEncoder.encode(complexFull);
export const complexChunksEnd = ['\n', 'aaa\r\n', 'bbb\n', '\n', 'ccc'];
export const complexChunks = ['', 'aaa', 'bbb', '', 'ccc'];
