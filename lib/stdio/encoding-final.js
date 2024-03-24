import {StringDecoder} from 'node:string_decoder';

// Apply the `encoding` option using an implicit generator.
// This encodes the final output of `stdout`/`stderr`.
export const handleStreamsEncoding = ({options: {encoding}, isSync, direction, optionName, objectMode}) => {
	if (!shouldEncodeOutput({encoding, isSync, direction, objectMode})) {
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

const shouldEncodeOutput = ({encoding, isSync, direction, objectMode}) => direction === 'output'
	&& encoding !== 'utf8'
	&& encoding !== 'buffer'
	&& !isSync
	&& !objectMode;

const encodingStringGenerator = function * (stringDecoder, chunk) {
	yield stringDecoder.write(chunk);
};

const encodingStringFinal = function * (stringDecoder) {
	const lastChunk = stringDecoder.end();
	if (lastChunk !== '') {
		yield lastChunk;
	}
};
