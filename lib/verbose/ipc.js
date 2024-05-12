import {verboseLog, serializeLogMessage} from './log.js';

// When `verbose` is `'full'`, print IPC messages from the subprocess
export const shouldLogIpc = ({verbose}) => verbose.at(-1) === 'full';

export const logIpcOutput = (message, {verboseId}) => {
	verboseLog(serializeLogMessage(message), verboseId, 'ipc');
};
