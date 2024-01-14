// Split chunks line-wise
export const getLinesGenerator = (encoding, binary) => {
	if (binary) {
		return;
	}

	return encoding === 'buffer' ? linesUint8ArrayGenerator : linesStringGenerator;
};

const linesUint8ArrayGenerator = async function * (chunks) {
	yield * linesGenerator(chunks, new Uint8Array(0), 0x0A, concatUint8Array);
};

const concatUint8Array = (firstChunk, secondChunk) => {
	const chunk = new Uint8Array(firstChunk.length + secondChunk.length);
	chunk.set(firstChunk, 0);
	chunk.set(secondChunk, firstChunk.length);
	return chunk;
};

const linesStringGenerator = async function * (chunks) {
	yield * linesGenerator(chunks, '', '\n', concatString);
};

const concatString = (firstChunk, secondChunk) => `${firstChunk}${secondChunk}`;

// This imperative logic is much faster than using `String.split()` and uses very low memory.
// Also, it allows sharing it with `Uint8Array`.
const linesGenerator = async function * (chunks, emptyValue, newline, concat) {
	let previousChunks = emptyValue;

	for await (const chunk of chunks) {
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
