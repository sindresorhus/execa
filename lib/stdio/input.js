import {isStream as isNodeStream} from 'is-stream';

// Override the `stdin` option with the `input` option
export const handleInputOption = (stdioStream, input) => {
	if (input === undefined || stdioStream.index !== 0) {
		return stdioStream;
	}

	const optionName = 'input';
	validateInputOption(stdioStream.value, optionName);
	const type = isNodeStream(input) ? 'nodeStream' : 'stringOrBuffer';
	return {...stdioStream, value: input, type, optionName};
};

// Override the `stdin` option with the `inputFile` option
export const handleInputFileOption = (stdioStream, inputFile, input) => {
	if (inputFile === undefined || stdioStream.index !== 0) {
		return stdioStream;
	}

	if (input !== undefined) {
		throw new TypeError('The `input` and `inputFile` options cannot be both set.');
	}

	const optionName = 'inputFile';
	validateInputOption(stdioStream.value, optionName);
	return {...stdioStream, value: inputFile, type: 'filePath', optionName};
};

const validateInputOption = (value, optionName) => {
	if (!CAN_USE_INPUT.has(value)) {
		throw new TypeError(`The \`${optionName}\` and \`stdin\` options cannot be both set.`);
	}
};

const CAN_USE_INPUT = new Set([undefined, null, 'overlapped', 'pipe']);
