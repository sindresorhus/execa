import {verboseLog, serializeLogMessage} from './log.js';
import {isFullVerbose} from './info.js';

// When `verbose` is `'full'`, print IPC messages from the subprocess
export const shouldLogIpc = verboseInfo => isFullVerbose(verboseInfo, 'ipc');

export const logIpcOutput = (message, verboseInfo) => {
	const logMessage = serializeLogMessage(message);
	verboseLog({
		type: 'ipc',
		logMessage,
		verboseInfo,
	});
};
