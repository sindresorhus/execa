import {MaxBufferError} from 'get-stream';
import stripFinalNewlineFunction from 'strip-final-newline';

// Split chunks line-wise for streams exposed to users like `subprocess.stdout`.
// Appending a noop transform in object mode is enough to do this, since every non-binary transform iterates line-wise.
export const handleStreamsLines = ({options: {lines, stripFinalNewline, maxBuffer}, isSync, direction, optionName, objectMode, outputLines}) => shouldSplitLines(lines, direction, objectMode)
	? [{
		type: 'generator',
		value: {transform: linesEndGenerator.bind(undefined, {outputLines, stripFinalNewline, maxBuffer, isSync}), preserveNewlines: true},
		optionName,
	}]
	: [];

const shouldSplitLines = (lines, direction, objectMode) => direction === 'output'
	&& lines
	&& !objectMode;

const linesEndGenerator = function * ({outputLines, stripFinalNewline, maxBuffer, isSync}, line) {
	if (!isSync && outputLines.length >= maxBuffer) {
		const error = new MaxBufferError();
		error.bufferedData = outputLines;
		throw error;
	}

	const strippedLine = stripFinalNewline ? stripFinalNewlineFunction(line) : line;
	outputLines.push(strippedLine);

	yield line;
};
