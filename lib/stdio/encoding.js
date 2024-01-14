import {StringDecoder} from 'node:string_decoder';

// Apply the `encoding` option using an implicit generator.
// This encodes the final output of `stdout`/`stderr`.
export const handleStreamsEncoding = (stdioStreams, {encoding}, isSync) => {
	if (stdioStreams[0].direction === 'input' || IGNORED_ENCODINGS.has(encoding) || isSync) {
		return stdioStreams.map(stdioStream => ({...stdioStream, encoding}));
	}

	const value = encodingEndGenerator.bind(undefined, encoding);
	return [...stdioStreams, {...stdioStreams[0], type: 'generator', value, encoding: 'buffer'}];
};

// eslint-disable-next-line unicorn/text-encoding-identifier-case
const IGNORED_ENCODINGS = new Set(['utf8', 'utf-8', 'buffer']);

const encodingEndGenerator = async function * (encoding, chunks) {
	const stringDecoder = new StringDecoder(encoding);

	for await (const chunk of chunks) {
		yield stringDecoder.write(chunk);
	}

	const lastChunk = stringDecoder.end();
	if (lastChunk !== '') {
		yield lastChunk;
	}
};

/*
When using generators, add an internal generator that converts chunks from `Buffer` to `string` or `Uint8Array`.
This allows generator functions to operate with those types instead.
Chunks might be Buffer, Uint8Array or strings since:
- `childProcess.stdout|stderr` emits Buffers
- `childProcess.stdin.write()` accepts Buffer, Uint8Array or string
- Previous generators might return Uint8Array or string

However, those are converted to Buffer:
- on writes: `Duplex.writable` `decodeStrings: true` default option
- on reads: `Duplex.readable` `readableEncoding: null` default option
*/
export const getEncodingStartGenerator = encoding => encoding === 'buffer'
	? encodingStartBufferGenerator
	: encodingStartStringGenerator;

const encodingStartBufferGenerator = async function * (chunks) {
	for await (const chunk of chunks) {
		yield new Uint8Array(chunk);
	}
};

const encodingStartStringGenerator = async function * (chunks) {
	const textDecoder = new TextDecoder();

	for await (const chunk of chunks) {
		yield textDecoder.decode(chunk, {stream: true});
	}

	const lastChunk = textDecoder.decode();
	if (lastChunk !== '') {
		yield lastChunk;
	}
};
