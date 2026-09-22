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
	if (allStdioItems.length === 0) {
		return;
	}

	if (fdNumber !== 0) {
		const [{type, optionName}] = allStdioItems;
		throw new TypeError(`Only the \`stdin\` option, not \`${optionName}\`, can be ${TYPE_TO_MESSAGE[type]} with synchronous methods.`);
	}

	// All input sources are merged into a single list of chunks, like asynchronous methods merge input streams, so that transforms receive a single stream of data: line splitting spans all sources and `final` runs only once.
	// Files are read lazily, so that a read failure is reported like any other early error
	const chunks = allStdioItems.flatMap(({contents}) => typeof contents === 'function' ? contents() : contents);
	options.input = applyInputGeneratorsSync(chunks, stdioItems, options.encoding);
};

const applyInputGeneratorsSync = (chunks, stdioItems, encoding) => {
	// Input transforms use UTF-8 with text encodings, since those only apply to the output
	const newContents = runGeneratorsSync(chunks, stdioItems, getInputEncoding(encoding), true);
	validateSerializable(newContents);
	return joinToUint8Array(newContents);
};

const validateSerializable = newContents => {
	const invalidItem = newContents.find(item => typeof item !== 'string' && !isUint8Array(item));
	if (invalidItem !== undefined) {
		throw new TypeError(`The \`stdin\` option is invalid: when passing objects as input, a transform must be used to serialize them to strings or Uint8Arrays: ${invalidItem}.`);
	}
};
