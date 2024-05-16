import {once} from 'node:events';
import {validateIpcOption, validateConnection} from './validation.js';

// Like `[sub]process.once('message')` but promise-based
export const getOneMessage = ({anyProcess, isSubprocess, ipc}) => {
	const methodName = 'getOneMessage';
	validateIpcOption(methodName, isSubprocess, ipc);
	validateConnection(methodName, isSubprocess, anyProcess.channel !== null);

	return onceMessage(anyProcess);
};

const onceMessage = async anyProcess => {
	const [message] = await once(anyProcess, 'message');
	return message;
};
