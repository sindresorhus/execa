import {StringDecoder} from 'node:string_decoder';
import {isUint8Array} from '../utils.js';
import {willPipeStreams} from './forward.js';

// Apply the `encoding` option using an implicit generator.
// This encodes the final output of `stdout`/`stderr`.
export const handleStreamsEncoding = (stdioStreams, {encoding}, isSync) => {
	const newStdioStreams = stdioStreams.map(stdioStream => ({...stdioStream, encoding}));
	if (!shouldEncodeOutput(newStdioStreams, encoding, isSync)) {
		return newStdioStreams;
	}

	const objectMode = newStdioStreams.findLast(({type}) => type === 'generator')?.value.objectMode === true;
	const stringDecoder = new StringDecoder(encoding);
	const generator = objectMode
		? {
			transform: encodingObjectGenerator.bind(undefined, stringDecoder),
		}
		: {
			transform: encodingStringGenerator.bind(undefined, stringDecoder),
			final: encodingStringFinal.bind(undefined, stringDecoder),
		};
	return [
		...newStdioStreams,
		{
			...newStdioStreams[0],
			type: 'generator',
			value: {...generator, binary: true, objectMode},
			encoding: 'buffer',
		},
	];
};

const shouldEncodeOutput = (stdioStreams, encoding, isSync) => stdioStreams[0].direction === 'output'
	&& !IGNORED_ENCODINGS.has(encoding)
	&& !isSync
	&& willPipeStreams(stdioStreams);

// eslint-disable-next-line unicorn/text-encoding-identifier-case
const IGNORED_ENCODINGS = new Set(['utf8', 'utf-8', 'buffer']);

const encodingStringGenerator = function * (stringDecoder, chunk) {
	yield stringDecoder.write(chunk);
};

const encodingStringFinal = function * (stringDecoder) {
	const lastChunk = stringDecoder.end();
	if (lastChunk !== '') {
		yield lastChunk;
	}
};

const encodingObjectGenerator = function * (stringDecoder, chunk) {
	yield isUint8Array(chunk) ? stringDecoder.end(chunk) : chunk;
};
