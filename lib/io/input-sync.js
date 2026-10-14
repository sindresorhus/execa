import {runGeneratorsSync} from '../transform/generator.js';
import {joinToUint8Array, isUint8Array} from '../utils/uint-array.js';
import {TYPE_TO_MESSAGE} from '../stdio/type.js';
import {getInputEncoding} from '../arguments/encoding-option.js';

// Apply `stdin`/`input`/`inputFile` options, before spawning, in sync mode, by converting it to the `input` option
export const addInputOptionsSync = (fileDescriptors, options) => {
	for (const fdNumber of getInputFdNumbers(fileDescriptors)) {
		addInputOptionSync(fileDescriptors, fdNumber, options);
	}
};

const getInputFdNumbers = fileDescriptors => new Set(Object.entries(fileDescriptors)
	.filter(([, {direction}]) => direction === 'input')
	.map(([fdNumber]) => Number(fdNumber)));

const addInputOptionSync = (fileDescriptors, fdNumber, options) => {
	const {stdioItems} = fileDescriptors[fdNumber];
	const allStdioItems = stdioItems.filter(({contents}) => contents !== undefined);
	// Even without an input source, generators must run so that `final` can produce input or report errors.
	if (allStdioItems.length === 0 && stdioItems.every(({type}) => type !== 'generator')) {
		return;
	}

	if (fdNumber !== 0) {
		const [{type, optionName}] = allStdioItems;
		throw new TypeError(`Only the \`stdin\` option, not \`${optionName}\`, can be ${TYPE_TO_MESSAGE[type]} with synchronous methods.`);
	}

	// All input sources are merged into a single list of chunks, like asynchronous methods merge input streams, so that transforms receive a single stream of data: line splitting spans all sources and `final` runs only once.
	// Files and iterables are read lazily, so that a read failure is reported like any other early error
	const chunks = allStdioItems.flatMap(({type, contents}) => getChunks(type, typeof contents === 'function' ? contents() : contents));
	options.input = applyInputGeneratorsSync(chunks, stdioItems, options.encoding);
};

// Like with asynchronous methods, an empty input is not passed as a chunk, otherwise binary transforms, which do not split lines, would run on it.
// Iterables are left as is, since each of their items is a chunk.
const getChunks = (type, chunks) => type === 'iterable' ? chunks : chunks.filter(chunk => chunk.length > 0);

const applyInputGeneratorsSync = (chunks, stdioItems, encoding) => {
	// Input transforms use UTF-8 with text encodings, since those only apply to the output
	const newContents = runGeneratorsSync(chunks, stdioItems, getInputEncoding(encoding), true);
	validateSerializable(newContents);
	return joinToUint8Array(newContents);
};

const validateSerializable = newContents => {
	const invalidItem = newContents.find(item => !isSerializableInput(item));
	if (invalidItem !== undefined) {
		throwOnSerializableInput('stdin', invalidItem);
	}
};

// Values written to the subprocess, which is not in object mode
export const isSerializableInput = item => typeof item === 'string' || isUint8Array(item);

export const throwOnSerializableInput = (optionName, invalidItem) => {
	throw new TypeError(`The \`${optionName}\` option is invalid: when passing objects as input, a transform must be used to serialize them to strings or Uint8Arrays: ${invalidItem}.`);
};
