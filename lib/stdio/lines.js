import {isUint8Array} from './utils.js';
import {willPipeStreams} from './pipe.js';

// Split chunks line-wise for streams exposed to users like `childProcess.stdout`.
// Appending a noop transform in object mode is enough to do this, since every non-binary transform iterates line-wise.
export const handleStreamsLines = (stdioStreams, {lines}, isSync) => shouldSplitLines(stdioStreams, lines, isSync)
	? [
		...stdioStreams,
		{
			...stdioStreams[0],
			type: 'generator',
			value: {transform: linesEndGenerator, objectMode: true},
		},
	]
	: stdioStreams;

const shouldSplitLines = (stdioStreams, lines, isSync) => stdioStreams[0].direction === 'output'
	&& lines
	&& !isSync
	&& willPipeStreams(stdioStreams);

const linesEndGenerator = async function * (chunks) {
	yield * chunks;
};

// Split chunks line-wise for generators passed to the `std*` options
export const getLinesGenerator = (encoding, binary) => {
	if (binary) {
		return;
	}

	return encoding === 'buffer' ? linesUint8ArrayGenerator : linesStringGenerator;
};

const linesUint8ArrayGenerator = async function * (chunks) {
	yield * linesGenerator({
		chunks,
		emptyValue: new Uint8Array(0),
		newline: 0x0A,
		concat: concatUint8Array,
		isValidType: isUint8Array,
	});
};

const concatUint8Array = (firstChunk, secondChunk) => {
	const chunk = new Uint8Array(firstChunk.length + secondChunk.length);
	chunk.set(firstChunk, 0);
	chunk.set(secondChunk, firstChunk.length);
	return chunk;
};

const linesStringGenerator = async function * (chunks) {
	yield * linesGenerator({
		chunks,
		emptyValue: '',
		newline: '\n',
		concat: concatString,
		isValidType: isString,
	});
};

const concatString = (firstChunk, secondChunk) => `${firstChunk}${secondChunk}`;
const isString = chunk => typeof chunk === 'string';

// This imperative logic is much faster than using `String.split()` and uses very low memory.
// Also, it allows sharing it with `Uint8Array`.
const linesGenerator = async function * ({chunks, emptyValue, newline, concat, isValidType}) {
	let previousChunks = emptyValue;

	for await (const chunk of chunks) {
		if (!isValidType(chunk)) {
			yield chunk;
			continue;
		}

		let start = -1;

		for (let end = 0; end < chunk.length; end += 1) {
			if (chunk[end] === newline) {
				let line = chunk.slice(start + 1, end + 1);

				if (previousChunks.length > 0) {
					line = concat(previousChunks, line);
					previousChunks = emptyValue;
				}

				yield line;
				start = end;
			}
		}

		if (start !== chunk.length - 1) {
			previousChunks = concat(previousChunks, chunk.slice(start + 1));
		}
	}

	if (previousChunks.length > 0) {
		yield previousChunks;
	}
};
