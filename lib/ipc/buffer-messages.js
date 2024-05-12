import {checkIpcMaxBuffer} from '../io/max-buffer.js';
import {shouldLogIpc, logIpcMessage} from '../verbose/ipc.js';
import {loopOnMessages} from './get-each.js';

// Iterate through IPC messages sent by the subprocess
export const waitForIpcMessages = async ({
	subprocess,
	buffer: bufferArray,
	maxBuffer: maxBufferArray,
	ipc,
	ipcMessages,
	verboseInfo,
}) => {
	if (!ipc) {
		return ipcMessages;
	}

	const isVerbose = shouldLogIpc(verboseInfo);
	const buffer = bufferArray.at(-1);
	const maxBuffer = maxBufferArray.at(-1);

	if (!isVerbose && !buffer) {
		return ipcMessages;
	}

	for await (const message of loopOnMessages({
		anyProcess: subprocess,
		isSubprocess: false,
		ipc,
		shouldAwait: false,
	})) {
		if (buffer) {
			checkIpcMaxBuffer(subprocess, ipcMessages, maxBuffer);
			ipcMessages.push(message);
		}

		if (isVerbose) {
			logIpcMessage(message, verboseInfo);
		}
	}

	return ipcMessages;
};
