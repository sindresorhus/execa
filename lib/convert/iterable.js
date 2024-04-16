import {BINARY_ENCODINGS} from '../arguments/encoding.js';
import {getReadable} from './fd-options.js';
import {iterateOnSubprocessStream} from './loop.js';

export const createIterable = (subprocess, encoding, {
	from,
	binary: binaryOption = false,
	preserveNewlines = false,
} = {}) => {
	const binary = binaryOption || BINARY_ENCODINGS.has(encoding);
	const subprocessStdout = getReadable(subprocess, from);
	const onStdoutData = iterateOnSubprocessStream({subprocessStdout, subprocess, binary, shouldEncode: true, encoding, preserveNewlines});
	return iterateOnStdoutData(onStdoutData, subprocessStdout, subprocess);
};

const iterateOnStdoutData = async function * (onStdoutData, subprocessStdout, subprocess) {
	try {
		yield * onStdoutData;
	} finally {
		if (subprocessStdout.readable) {
			subprocessStdout.destroy();
		}

		await subprocess;
	}
};
