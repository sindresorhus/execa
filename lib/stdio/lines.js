import {MaxBufferError} from 'get-stream';
import stripFinalNewlineFunction from 'strip-final-newline';

// Split chunks line-wise for streams exposed to users like `subprocess.stdout`.
// Appending a noop transform in object mode is enough to do this, since every non-binary transform iterates line-wise.
export const handleStreamsLines = ({options: {lines, stripFinalNewline, maxBuffer}, isSync, direction, optionName, objectMode, outputLines}) => shouldSplitLines({lines, isSync, direction, objectMode})
	? [{
		type: 'generator',
		value: {transform: linesEndGenerator.bind(undefined, {outputLines, stripFinalNewline, maxBuffer}), preserveNewlines: true},
		optionName,
	}]
	: [];

const shouldSplitLines = ({lines, isSync, direction, objectMode}) => direction === 'output'
	&& lines
	&& !objectMode
	&& !isSync;

const linesEndGenerator = function * ({outputLines, stripFinalNewline, maxBuffer}, line) {
	if (outputLines.length >= maxBuffer) {
		const error = new MaxBufferError();
		error.bufferedData = outputLines;
		throw error;
	}

	const strippedLine = stripFinalNewline ? stripFinalNewlineFunction(line) : line;
	outputLines.push(strippedLine);

	yield line;
};
