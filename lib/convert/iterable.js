import {BINARY_ENCODINGS} from '../arguments/encoding-option.js';
import {getFromStream} from '../arguments/fd-options.js';
import {iterateOnSubprocessStream} from '../io/iterate.js';
import {copyOptions} from '../utils/options.js';

// Convert the subprocess to an async iterable
export const createIterable = (subprocess, encoding, options) => {
	const {from, binary: binaryOption = false, preserveNewlines = false} = copyOptions(options);
	const binary = binaryOption || BINARY_ENCODINGS.has(encoding);
	const subprocessStdout = getFromStream(subprocess, from);
	const onStdoutData = iterateOnSubprocessStream({
		subprocessStdout,
		subprocess,
		binary,
		shouldEncode: true,
		encoding,
		preserveNewlines,
	});
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
