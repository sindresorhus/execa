import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
	SPECIAL_DUPLICATE_TYPES_SYNC,
	SPECIAL_DUPLICATE_TYPES,
	FORBID_DUPLICATE_TYPES,
	TYPE_TO_MESSAGE,
} from './type.js';

// `{file: './output.txt'}` and a `file:` URL are two ways to target the same file, so both must be compared together
const isFileType = type => SPECIAL_DUPLICATE_TYPES_SYNC.has(type);

// The file that a `filePath` or `fileUrl` stdio item targets, as an absolute path
export const getFileTarget = ({type, value}) => type === 'filePath'
	? resolve(value.file)
	: fileURLToPath(value);

// Duplicates in the same file descriptor is most likely an error.
// However, this can be useful with generators.
export const filterDuplicates = stdioItems => stdioItems.filter((stdioItemOne, indexOne) =>
	stdioItems.every((stdioItemTwo, indexTwo) => !hasSameValueAndDirection(stdioItemOne, stdioItemTwo)
		|| indexOne >= indexTwo
		|| stdioItemOne.type === 'generator'
		|| stdioItemOne.type === 'asyncGenerator'));

const hasSameValueAndDirection = (stdioItemOne, stdioItemTwo) => stdioItemOne.value === stdioItemTwo.value
	&& stdioItemOne.direction === stdioItemTwo.direction;

// Check if two file descriptors are sharing the same target.
// For example `{stdout: {file: './output.txt'}, stderr: {file: './output.txt'}}`.
// The same applies to two items of a single file descriptor, e.g. `{stdout: [{file: './output.txt'}, {file: './output.txt'}]}`.
export const getDuplicateStream = ({stdioItem: {type, value, optionName}, direction, fileDescriptors, isSync}) => {
	const otherStdioItems = getOtherStdioItems(fileDescriptors, type);
	if (otherStdioItems.length === 0) {
		return;
	}

	if (isSync) {
		validateDuplicateStreamSync({
			otherStdioItems,
			type,
			value,
			optionName,
			direction,
		});
		return;
	}

	if (SPECIAL_DUPLICATE_TYPES.has(type)) {
		return getDuplicateStreamInstance({
			otherStdioItems,
			type,
			value,
			optionName,
			direction,
		});
	}

	if (FORBID_DUPLICATE_TYPES.has(type)) {
		validateDuplicateTransform({
			otherStdioItems,
			type,
			value,
			optionName,
		});
	}
};

// Values shared by multiple file descriptors, including the other items of the file descriptor currently being built
const getOtherStdioItems = (fileDescriptors, type) => fileDescriptors
	.flatMap(({direction, stdioItems}) => stdioItems
		.map(stdioItem => ({...stdioItem, direction})),
	)
	.filter(stdioItem => isSameDuplicateType(stdioItem.type, type));

// A `filePath` and a `fileUrl` are compared together, since they can target the same file
const isSameDuplicateType = (otherType, type) => otherType === type || (isFileType(otherType) && isFileType(type));

// With `execaSync()`, do not allow setting a file path both in input and output
const validateDuplicateStreamSync = ({otherStdioItems, type, value, optionName, direction}) => {
	if (SPECIAL_DUPLICATE_TYPES_SYNC.has(type)) {
		getDuplicateStreamInstance({
			otherStdioItems,
			type,
			value,
			optionName,
			direction,
		});
	}
};

// When two file descriptors share the file or stream, we need to re-use the same underlying stream.
// Otherwise, the stream would be closed twice when piping ends.
// This is only an issue with output file descriptors.
// This is not a problem with generator functions since those create a new instance for each file descriptor.
// We also forbid input and output file descriptors sharing the same file or stream, since that does not make sense.
const getDuplicateStreamInstance = ({otherStdioItems, type, value, optionName, direction}) => {
	const duplicateStdioItems = otherStdioItems.filter(stdioItem => hasSameValue(stdioItem, type, value));
	if (duplicateStdioItems.length === 0) {
		return;
	}

	const differentStdioItem = duplicateStdioItems.find(stdioItem => stdioItem.direction !== direction);
	throwOnDuplicateStream(differentStdioItem, optionName, type);

	// Output streams must be re-used so they are not closed twice.
	// Web streams must be re-used in the input direction too, since they cannot be converted twice: reading one locks it.
	return direction === 'output' || type === 'webStream' ? duplicateStdioItems[0].stream : undefined;
};

// `type` and `value` are the current item's, `otherStdioItem` is the other one
const hasSameValue = (otherStdioItem, type, value) => isFileType(otherStdioItem.type)
	? getFileTarget(otherStdioItem) === getFileTarget({type, value})
	: otherStdioItem.value === value;

// We do not allow two file descriptors to share the same Duplex or TransformStream.
// This is because those are set directly to `subprocess.std*`.
// For example, this could result in `subprocess.stdout` and `subprocess.stderr` being the same value.
// This means reading from either would get data from both stdout and stderr.
const validateDuplicateTransform = ({otherStdioItems, type, value, optionName}) => {
	const duplicateStdioItem = otherStdioItems.find(({value: {transform}}) => transform === value.transform);
	throwOnDuplicateStream(duplicateStdioItem, optionName, type);
};

const throwOnDuplicateStream = (stdioItem, optionName, type) => {
	if (stdioItem !== undefined) {
		throw new TypeError(`The \`${stdioItem.optionName}\` and \`${optionName}\` options must not target ${TYPE_TO_MESSAGE[type]} that is the same.`);
	}
};
