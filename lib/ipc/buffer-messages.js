import {checkIpcMaxBuffer} from '../io/max-buffer.js';
import {shouldLogIpc, logIpcOutput} from '../verbose/ipc.js';
import {getFdSpecificValue} from '../arguments/specific.js';
import {loopOnMessages} from './get-each.js';

// Iterate through IPC messages sent by the subprocess
export const waitForIpcOutput = async ({
	subprocess,
	buffer: bufferArray,
	maxBuffer: maxBufferArray,
	ipc,
	ipcOutput,
	verboseInfo,
}) => {
	if (!ipc) {
		return ipcOutput;
	}

	const isVerbose = shouldLogIpc(verboseInfo);
	const buffer = getFdSpecificValue(bufferArray, 'ipc');
	const maxBuffer = getFdSpecificValue(maxBufferArray, 'ipc');
	// A throwing `verbose` function must not prevent the following messages from being buffered
	const logErrors = [];

	for await (const message of loopOnMessages({
		anyProcess: subprocess,
		channel: subprocess.channel,
		isSubprocess: false,
		ipc,
		shouldAwait: false,
		reference: true,
	})) {
		if (buffer) {
			checkIpcMaxBuffer(ipcOutput, maxBuffer);
			ipcOutput.push(message);
		}

		if (isVerbose) {
			try {
				logIpcOutput(message, verboseInfo);
			} catch (error) {
				logErrors.push(error);
			}
		}
	}

	if (logErrors.length > 0) {
		throw logErrors[0];
	}

	return ipcOutput;
};

export const getBufferedIpcOutput = async (ipcOutputPromise, ipcOutput) => {
	await Promise.allSettled([ipcOutputPromise]);
	return ipcOutput;
};
