import {serialize} from 'node:v8';
import {sendMessage} from './send.js';

// Validate the `ipcInput` option
export const validateIpcInputOption = ({ipcInput, ipc, serialization}) => {
	if (ipcInput === undefined) {
		return;
	}

	if (!ipc) {
		throw new Error('The `ipcInput` option cannot be set unless the `ipc` option is `true`.');
	}

	// An invalid `serialization` option is reported by `node:child_process` when spawning, like when `ipcInput` is not used
	validateIpcInput[serialization]?.(ipcInput);
};

const validateAdvancedInput = ipcInput => {
	try {
		serialize(ipcInput);
	} catch (error) {
		throw new Error('The `ipcInput` option is not serializable with a structured clone.', {cause: error});
	}
};

const validateJsonInput = ipcInput => {
	try {
		// `JSON.stringify()` returns `undefined` instead of throwing for values it cannot represent, such as functions and symbols
		if (JSON.stringify(ipcInput) === undefined) {
			throw new TypeError('The value cannot be represented as JSON.');
		}
	} catch (error) {
		throw new Error('The `ipcInput` option is not serializable with JSON.', {cause: error});
	}
};

const validateIpcInput = {
	__proto__: null,
	advanced: validateAdvancedInput,
	json: validateJsonInput,
};

// When the `ipcInput` option is set, it is sent as an initial IPC message to the subprocess
export const sendIpcInput = async (subprocess, ipcInput, ipc) => {
	if (ipcInput === undefined) {
		return;
	}

	await sendMessage({
		anyProcess: subprocess,
		channel: subprocess.channel,
		isSubprocess: false,
		ipc,
	}, ipcInput);
};
