import {once} from 'node:events';
import {Worker} from 'node:worker_threads';
import {execa} from '../../index.js';
import {FIXTURES_DIR_URL} from './fixtures-dir.js';

const WORKER_URL = new URL('worker.js', FIXTURES_DIR_URL);

const runWorker = (nodeFile, args, options) => {
	[args, options] = Array.isArray(args) ? [args, options] : [[], args];
	return new Worker(WORKER_URL, {workerData: {nodeFile, args, options}});
};

// eslint-disable-next-line max-params
const nestedCall = (isWorker, fixtureName, execaMethod, file, args, options, parentOptions) => {
	[args, options = {}, parentOptions = {}] = Array.isArray(args) ? [args, options, parentOptions] : [[], args, options];
	const subprocessOrWorker = execaMethod(fixtureName, [JSON.stringify(options), file, ...args], {...parentOptions, ipc: true});
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

export const nestedWorker = (...args) => nestedCall(true, 'nested.js', runWorker, ...args);
const nestedExeca = (fixtureName, ...args) => nestedCall(false, fixtureName, execa, ...args);
export const nestedExecaAsync = (...args) => nestedExeca('nested.js', ...args);
export const nestedExecaSync = (...args) => nestedExeca('nested-sync.js', ...args);
export const parentWorker = (...args) => nestedWorker(...args).parent;
export const parentExeca = (...args) => nestedExeca(...args).parent;
export const parentExecaAsync = (...args) => nestedExecaAsync(...args).parent;
export const parentExecaSync = (...args) => nestedExecaSync(...args).parent;
