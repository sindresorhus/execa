import {BINARY_ENCODINGS} from '../arguments/encoding.js';

// Split chunks line-wise for streams exposed to users like `subprocess.stdout`.
// Appending a noop transform in object mode is enough to do this, since every non-binary transform iterates line-wise.
export const handleStreamsLines = ({options: {lines, encoding, stripFinalNewline}, isSync, direction, optionName}) => shouldSplitLines({lines, encoding, isSync, direction})
	? [{
		type: 'generator',
		value: {transform: linesEndGenerator, objectMode: true, preserveNewlines: !stripFinalNewline},
		optionName,
	}]
	: [];

const shouldSplitLines = ({lines, encoding, isSync, direction}) => direction === 'output'
	&& lines
	&& !BINARY_ENCODINGS.has(encoding)
	&& !isSync;

const linesEndGenerator = function * (chunk) {
	yield chunk;
};
