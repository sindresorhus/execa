import {once} from 'node:events';
import {Worker} from 'node:worker_threads';
import {execa} from '../../index.js';
import {FIXTURES_DIRECTORY_URL} from './fixtures-directory.js';

const WORKER_URL = new URL('worker.js', FIXTURES_DIRECTORY_URL);

const runWorker = (nodeFile, commandArguments, options) => {
	[commandArguments, options] = Array.isArray(commandArguments)
		? [commandArguments, options]
		: [[], commandArguments];
	return new Worker(WORKER_URL, {workerData: {nodeFile, commandArguments, options}});
};

// eslint-disable-next-line max-params
const nestedCall = (isWorker, fixtureName, execaMethod, file, commandArguments, options, parentOptions) => {
	[commandArguments, options = {}, parentOptions = {}] = Array.isArray(commandArguments)
		? [commandArguments, options, parentOptions]
		: [[], commandArguments, options];
	const subprocessOrWorker = execaMethod(fixtureName, [JSON.stringify(options), file, ...commandArguments], {...parentOptions, ipc: true});
	const onMessage = once(subprocessOrWorker, 'message');
	const promise = getNestedResult(onMessage);
	promise.parent = isWorker ? getParentResult(onMessage) : subprocessOrWorker;
	return promise;
};

const getNestedResult = async onMessage => {
	const {result} = await getMessage(onMessage);
	return result;
};

const getParentResult = async onMessage => {
	const {parentResult} = await getMessage(onMessage);
	return parentResult;
};

const getMessage = async onMessage => {
	const [{error, parentError = error, result, parentResult}] = await onMessage;
	if (parentError) {
		throw parentError;
	}

	return {result, parentResult};
};

export const nestedWorker = (...commandArguments) => nestedCall(true, 'nested.js', runWorker, ...commandArguments);
const nestedExeca = (fixtureName, ...commandArguments) => nestedCall(false, fixtureName, execa, ...commandArguments);
export const nestedExecaAsync = (...commandArguments) => nestedExeca('nested.js', ...commandArguments);
export const nestedExecaSync = (...commandArguments) => nestedExeca('nested-sync.js', ...commandArguments);
export const parentWorker = (...commandArguments) => nestedWorker(...commandArguments).parent;
export const parentExeca = (...commandArguments) => nestedExeca(...commandArguments).parent;
export const parentExecaAsync = (...commandArguments) => nestedExecaAsync(...commandArguments).parent;
export const parentExecaSync = (...commandArguments) => nestedExecaSync(...commandArguments).parent;
