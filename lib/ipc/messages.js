import {shouldLogIpc, logIpcMessage} from '../verbose/ipc.js';
import {loopOnMessages} from './get-each.js';

// Iterate through IPC messages sent by the subprocess
export const waitForIpcMessages = async (subprocess, ipc, verboseInfo) => {
	if (!ipc || !shouldLogIpc(verboseInfo)) {
		return;
	}

	for await (const message of loopOnMessages({
		anyProcess: subprocess,
		isSubprocess: false,
		ipc,
		shouldAwait: false,
	})) {
		logIpcMessage(message, verboseInfo);
	}
};
