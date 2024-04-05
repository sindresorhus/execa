import {Buffer} from 'node:buffer';

const {toString: objectToString} = Object.prototype;

export const isArrayBuffer = value => objectToString.call(value) === '[object ArrayBuffer]';

export const isUint8Array = value => objectToString.call(value) === '[object Uint8Array]' && !Buffer.isBuffer(value);

export const bufferToUint8Array = buffer => new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

const textEncoder = new TextEncoder();
const stringToUint8Array = string => textEncoder.encode(string);

const textDecoder = new TextDecoder();
export const uint8ArrayToString = uint8Array => textDecoder.decode(uint8Array);

export const joinToString = uint8ArraysOrStrings => {
	if (uint8ArraysOrStrings.length === 1 && typeof uint8ArraysOrStrings[0] === 'string') {
		return uint8ArraysOrStrings[0];
	}

	const strings = uint8ArraysToStrings(uint8ArraysOrStrings);
	return strings.join('');
};

const uint8ArraysToStrings = uint8ArraysOrStrings => {
	const decoder = new TextDecoder();
	const strings = uint8ArraysOrStrings.map(uint8ArrayOrString => isUint8Array(uint8ArrayOrString)
		? decoder.decode(uint8ArrayOrString, {stream: true})
		: uint8ArrayOrString);
	const finalString = decoder.decode();
	return finalString === '' ? strings : [...strings, finalString];
};

export const joinToUint8Array = uint8ArraysOrStrings => {
	if (uint8ArraysOrStrings.length === 1 && isUint8Array(uint8ArraysOrStrings[0])) {
		return uint8ArraysOrStrings[0];
	}

	return concatUint8Arrays(stringsToUint8Arrays(uint8ArraysOrStrings));
};

const stringsToUint8Arrays = uint8ArraysOrStrings => uint8ArraysOrStrings.map(uint8ArrayOrString => typeof uint8ArrayOrString === 'string'
	? stringToUint8Array(uint8ArrayOrString)
	: uint8ArrayOrString);

export const concatUint8Arrays = uint8Arrays => {
	const result = new Uint8Array(getJoinLength(uint8Arrays));

	let index = 0;
	for (const uint8Array of uint8Arrays) {
		result.set(uint8Array, index);
		index += uint8Array.length;
	}

	return result;
};

const getJoinLength = uint8Arrays => {
	let joinLength = 0;
	for (const uint8Array of uint8Arrays) {
		joinLength += uint8Array.length;
	}

	return joinLength;
};
