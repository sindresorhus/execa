import {DiscardedError} from '../return/cause.js';

export const waitForSuccessfulExit = async exitPromise => {
	const [exitCode, signal] = await exitPromise;

	if (!isSubprocessErrorExit(exitCode, signal) && isFailedExit(exitCode, signal)) {
		throw new DiscardedError();
	}

	return [exitCode, signal];
};

export const getSyncExitResult = ({error, status: exitCode, signal}) => ({
	resultError: getSyncError(error, exitCode, signal),
	exitCode,
	signal,
});

const getSyncError = (error, exitCode, signal) => {
	if (error !== undefined) {
		return error;
	}

	return isFailedExit(exitCode, signal) ? new DiscardedError() : undefined;
};

const isSubprocessErrorExit = (exitCode, signal) => exitCode === undefined && signal === undefined;
const isFailedExit = (exitCode, signal) => exitCode !== 0 || signal !== null;
