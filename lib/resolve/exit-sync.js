import {DiscardedError} from '../return/final-error.js';
import {handleMaxBufferSync} from '../io/max-buffer.js';
import {isFailedExit} from './exit-async.js';

// Retrieve exit code, signal name and error information, with synchronous methods
export const getExitResultSync = ({error, status: exitCode, signal, output}, {maxBuffer, buffer}) => {
	const initialError = getResultError(error, exitCode, signal);
	const isTimedOut = initialError?.code === 'ETIMEDOUT';
	// A file descriptor over its `maxBuffer` does not stop the subprocess, so the timeout that did is reported instead. That file descriptor is still truncated.
	const {resultError, isMaxBuffer} = isTimedOut
		? {resultError: initialError, isMaxBuffer: false}
		: handleMaxBufferSync({
			resultError: initialError,
			output,
			maxBuffer,
			buffer,
		});
	return {
		resultError,
		exitCode,
		signal,
		timedOut: isTimedOut,
		isMaxBuffer,
	};
};

const getResultError = (error, exitCode, signal) => {
	if (error !== undefined) {
		return error;
	}

	return isFailedExit(exitCode, signal) ? new DiscardedError() : undefined;
};
