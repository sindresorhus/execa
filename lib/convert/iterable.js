import {getReadable} from '../pipe/validate.js';
import {iterateOnStdout} from './loop.js';

export const createIterable = (subprocess, useBinaryEncoding, {
	from,
	binary: binaryOption = false,
	preserveNewlines = false,
} = {}) => {
	const binary = binaryOption || useBinaryEncoding;
	const subprocessStdout = getReadable(subprocess, from);
	const onStdoutData = iterateOnStdout({subprocessStdout, subprocess, binary, preserveNewlines, isStream: false});
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
