import {isStream as isNodeStream} from 'is-stream';

// Append the `stdin` option with the `input` and `inputFile` options
export const handleInputOptions = ({input, inputFile}) => [
	handleInputOption(input),
	handleInputFileOption(inputFile),
].filter(Boolean);

const handleInputOption = input => input && {
	type: isNodeStream(input) ? 'nodeStream' : 'stringOrBuffer',
	value: input,
	optionName: 'input',
	index: 0,
};

const handleInputFileOption = inputFile => inputFile && {
	type: 'filePath',
	value: inputFile,
	optionName: 'inputFile',
	index: 0,
};
