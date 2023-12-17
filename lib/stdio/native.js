import process from 'node:process';
import {isStream as isNodeStream} from 'is-stream';

// When we use multiple `stdio` values for the same streams, we pass 'pipe' to `child_process.spawn()`.
// We then emulate the piping done by core Node.js.
// To do so, we transform the following values:
//  - Node.js streams are marked as `type: nodeStream`
//  - 'inherit' becomes `process.stdin|stdout|stderr`
//  - any file descriptor integer becomes `process.stdio[index]`
// All of the above transformations tell Execa to perform manual piping.
export const handleNativeStream = (stdioStream, isStdioArray) => {
	const {type, value, index, optionName} = stdioStream;

	if (!isStdioArray || type !== 'native') {
		return stdioStream;
	}

	if (value === 'inherit') {
		return {...stdioStream, type: 'nodeStream', value: getStandardStream(index, value, optionName)};
	}

	if (typeof value === 'number') {
		return {...stdioStream, type: 'nodeStream', value: getStandardStream(value, value, optionName)};
	}

	if (isNodeStream(value)) {
		return {...stdioStream, type: 'nodeStream'};
	}

	return stdioStream;
};

// Node.js does not allow to easily retrieve file descriptors beyond stdin/stdout/stderr as streams
const getStandardStream = (index, value, optionName) => {
	const standardStream = STANDARD_STREAMS[index];

	if (standardStream === undefined) {
		throw new TypeError(`The \`${optionName}: ${value}\` option is invalid: no such standard stream.`);
	}

	return standardStream;
};

const STANDARD_STREAMS = [process.stdin, process.stdout, process.stderr];
