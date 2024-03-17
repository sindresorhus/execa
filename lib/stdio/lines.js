import {isBinaryEncoding} from '../encoding.js';
import {willPipeStreams} from './forward.js';

// Split chunks line-wise for streams exposed to users like `subprocess.stdout`.
// Appending a noop transform in object mode is enough to do this, since every non-binary transform iterates line-wise.
export const handleStreamsLines = (stdioStreams, {lines, encoding, stripFinalNewline}, isSync) => shouldSplitLines({stdioStreams, lines, encoding, isSync})
	? [
		...stdioStreams,
		{
			...stdioStreams[0],
			type: 'generator',
			value: {transform: linesEndGenerator, objectMode: true, preserveNewlines: !stripFinalNewline},
		},
	]
	: stdioStreams;

const shouldSplitLines = ({stdioStreams, lines, encoding, isSync}) => stdioStreams[0].direction === 'output'
	&& lines
	&& !isBinaryEncoding(encoding)
	&& !isSync
	&& willPipeStreams(stdioStreams);

const linesEndGenerator = function * (chunk) {
	yield chunk;
};
