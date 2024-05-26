import {checkIpcMaxBuffer} from '../io/max-buffer.js';
import {shouldLogIpc, logIpcOutput} from '../verbose/ipc.js';
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
	const buffer = bufferArray.at(-1);
	const maxBuffer = maxBufferArray.at(-1);

	for await (const message of loopOnMessages({
		anyProcess: subprocess,
		channel: subprocess.channel,
		isSubprocess: false,
		ipc,
		shouldAwait: false,
		reference: true,
	})) {
		if (buffer) {
			checkIpcMaxBuffer(subprocess, ipcOutput, maxBuffer);
			ipcOutput.push(message);
		}

		if (isVerbose) {
			logIpcOutput(message, verboseInfo);
		}
	}

	return ipcOutput;
};

export const getBufferedIpcOutput = async (ipcOutputPromise, ipcOutput) => {
	await Promise.allSettled([ipcOutputPromise]);
	return ipcOutput;
};
