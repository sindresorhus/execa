import {StringDecoder} from 'node:string_decoder';

// Apply the `encoding` option using an implicit generator.
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
