import {isStream as isNodeStream} from 'is-stream';
import {STANDARD_STREAMS} from '../utils.js';

// When we use multiple `stdio` values for the same streams, we pass 'pipe' to `child_process.spawn()`.
// We then emulate the piping done by core Node.js.
// To do so, we transform the following values:
//  - Node.js streams are marked as `type: nodeStream`
//  - 'inherit' becomes `process.stdin|stdout|stderr`
//  - any file descriptor integer becomes `process.stdio[fdNumber]`
// All of the above transformations tell Execa to perform manual piping.
export const handleNativeStream = (stdioStream, isStdioArray) => {
	const {type, value, fdNumber, optionName} = stdioStream;

	if (!isStdioArray || type !== 'native') {
		return stdioStream;
	}

	if (value === 'inherit') {
		return {...stdioStream, type: 'nodeStream', value: getStandardStream(fdNumber, value, optionName)};
	}

	if (typeof value === 'number') {
		return {...stdioStream, type: 'nodeStream', value: getStandardStream(value, value, optionName)};
	}

	if (isNodeStream(value, {checkOpen: false})) {
		return {...stdioStream, type: 'nodeStream'};
	}

	return stdioStream;
};

// Node.js does not allow to easily retrieve file descriptors beyond stdin/stdout/stderr as streams.
//  - `fs.createReadStream()`/`fs.createWriteStream()` with the `fd` option do not work with character devices that use blocking reads/writes (such as interactive TTYs).
//  - Using a TCP `Socket` would work but be rather complex to implement.
// Since this is an edge case, we simply throw an error message.
// See https://github.com/sindresorhus/execa/pull/643#discussion_r1435905707
const getStandardStream = (fdNumber, value, optionName) => {
	const standardStream = STANDARD_STREAMS[fdNumber];

	if (standardStream === undefined) {
		throw new TypeError(`The \`${optionName}: ${value}\` option is invalid: no such standard stream.`);
	}

	return standardStream;
};
