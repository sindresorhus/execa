import {DiscardedError} from '../return/cause.js';
import {isMaxBufferSync} from '../stream/max-buffer.js';

export const waitForSuccessfulExit = async exitPromise => {
	const [exitCode, signal] = await exitPromise;

	if (!isSubprocessErrorExit(exitCode, signal) && isFailedExit(exitCode, signal)) {
		throw new DiscardedError();
	}

	return [exitCode, signal];
};

export const getSyncExitResult = ({error, status: exitCode, signal, output}, {maxBuffer}) => {
	const resultError = getResultError(error, exitCode, signal);
	const timedOut = resultError?.code === 'ETIMEDOUT';
	const isMaxBuffer = isMaxBufferSync(resultError, output, maxBuffer);
	return {resultError, exitCode, signal, timedOut, isMaxBuffer};
};

const getResultError = (error, exitCode, signal) => {
	if (error !== undefined) {
		return error;
	}

	return isFailedExit(exitCode, signal) ? new DiscardedError() : undefined;
};

const isSubprocessErrorExit = (exitCode, signal) => exitCode === undefined && signal === undefined;
const isFailedExit = (exitCode, signal) => exitCode !== 0 || signal !== null;
