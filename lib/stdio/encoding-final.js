import {StringDecoder} from 'node:string_decoder';
import {willPipeStreams} from './forward.js';

// Apply the `encoding` option using an implicit generator.
// This encodes the final output of `stdout`/`stderr`.
export const handleStreamsEncoding = (stdioStreams, {encoding}, isSync) => {
	const newStdioStreams = stdioStreams.map(stdioStream => ({...stdioStream, encoding}));
	if (!shouldEncodeOutput(newStdioStreams, encoding, isSync)) {
		return newStdioStreams;
	}

	const lastObjectStdioStream = newStdioStreams.findLast(({type, value}) => type === 'generator' && value.objectMode !== undefined);
	const writableObjectMode = lastObjectStdioStream !== undefined && lastObjectStdioStream.value.objectMode;
	if (writableObjectMode) {
		return newStdioStreams;
	}

	const stringDecoder = new StringDecoder(encoding);
	return [
		...newStdioStreams,
		{
			...newStdioStreams[0],
			type: 'generator',
			value: {
				transform: encodingStringGenerator.bind(undefined, stringDecoder),
				final: encodingStringFinal.bind(undefined, stringDecoder),
				binary: true,
			},
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
