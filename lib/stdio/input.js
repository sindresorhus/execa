import {isReadableStream} from 'is-stream';
import {isUint8Array} from './utils.js';

// Append the `stdin` option with the `input` and `inputFile` options
export const handleInputOptions = ({input, inputFile}) => [
	handleInputOption(input),
	handleInputFileOption(inputFile),
].filter(Boolean);

const handleInputOption = input => input === undefined ? undefined : {
	type: getType(input),
	value: input,
	optionName: 'input',
	index: 0,
};

const getType = input => {
	if (isReadableStream(input)) {
		return 'nodeStream';
	}

	if (typeof input === 'string') {
		return 'string';
	}

	if (isUint8Array(input)) {
		return 'uint8Array';
	}

	throw new Error('The `input` option must be a string, a Uint8Array or a Node.js Readable stream.');
};

const handleInputFileOption = inputFile => inputFile === undefined ? undefined : {
	type: 'filePath',
	value: inputFile,
	optionName: 'inputFile',
	index: 0,
};
