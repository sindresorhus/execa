import process from 'node:process';
import {promisify} from 'node:util';
import {sendMessage} from './send.js';
import {getOneMessage} from './get-one.js';
import {getEachMessage} from './get-each.js';
import {exchangeMessage} from './exchange.js';

// Add promise-based IPC methods in current process
export const addIpcMethods = (subprocess, {ipc}) => {
	Object.assign(subprocess, getIpcMethods(subprocess, false, ipc));
};

// Get promise-based IPC in the subprocess
export const getIpcExport = () => getIpcMethods(process, true, process.channel !== undefined);

// Retrieve the `ipc` shared by both the current process and the subprocess
const getIpcMethods = (anyProcess, isSubprocess, ipc) => {
	const anyProcessSend = anyProcess.send === undefined
		? undefined
		: promisify(anyProcess.send.bind(anyProcess));
	return {
		sendMessage: sendMessage.bind(undefined, {
			anyProcess,
			anyProcessSend,
			isSubprocess,
			ipc,
		}),
		getOneMessage: getOneMessage.bind(undefined, {anyProcess, isSubprocess, ipc}),
		getEachMessage: getEachMessage.bind(undefined, {anyProcess, isSubprocess, ipc}),
		exchangeMessage: exchangeMessage.bind(undefined, {
			anyProcess,
			anyProcessSend,
			isSubprocess,
			ipc,
		}),
	};
};
