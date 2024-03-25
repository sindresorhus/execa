import {StringDecoder} from 'node:string_decoder';

// Apply the `encoding` option using an implicit generator.
// This encodes the final output of `stdout`/`stderr`.
export const handleStreamsEncoding = ({stdioItems, options: {encoding}, isSync, direction, optionName}) => {
	if (!shouldEncodeOutput({stdioItems, encoding, isSync, direction})) {
		return [];
	}

	const stringDecoder = new StringDecoder(encoding);
	return [{
		type: 'generator',
		value: {
			transform: encodingStringGenerator.bind(undefined, stringDecoder),
			final: encodingStringFinal.bind(undefined, stringDecoder),
			binary: true,
		},
		optionName,
	}];
};

const shouldEncodeOutput = ({stdioItems, encoding, isSync, direction}) => direction === 'output'
	&& encoding !== 'utf8'
	&& encoding !== 'buffer'
	&& !isSync
	&& !isWritableObjectMode(stdioItems);

const isWritableObjectMode = stdioItems => {
	const lastObjectStdioItem = stdioItems.findLast(({type, value}) => type === 'generator' && value.objectMode !== undefined);
	return lastObjectStdioItem !== undefined && lastObjectStdioItem.value.objectMode;
};

const encodingStringGenerator = function * (stringDecoder, chunk) {
	yield stringDecoder.write(chunk);
};

const encodingStringFinal = function * (stringDecoder) {
	const lastChunk = stringDecoder.end();
	if (lastChunk !== '') {
		yield lastChunk;
	}
};
