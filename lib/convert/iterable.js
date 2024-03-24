import {getReadable} from '../pipe/validate.js';
import {iterateOnStdout} from './loop.js';

export const createIterable = (subprocess, isBuffer, {
	from,
	binary: binaryOption = false,
	preserveNewlines = false,
} = {}) => {
	const binary = binaryOption || isBuffer;
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
