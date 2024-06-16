import {once} from 'node:events';
import {Worker} from 'node:worker_threads';
import {execa} from '../../index.js';
import {FIXTURES_DIRECTORY_URL} from './fixtures-directory.js';

const WORKER_URL = new URL('worker.js', FIXTURES_DIRECTORY_URL);

// Like `execa(file, commandArguments, options)` but spawns inside another parent process.
// This is useful when testing logic where Execa modifies the global state.
// For example, when it prints to the console, with the `verbose` option.
// The parent process calls `execa(options.parentFixture, parentOptions)`
// When `options.isSync` is `true`, `execaSync()` is called instead.
// When `options.worker` is `true`, the whole flow happens inside a Worker.
export const nestedSubprocess = async (file, commandArguments, options, parentOptions) => {
	const result = await nestedInstance(file, commandArguments, options, parentOptions);
	const nestedResult = result.ipcOutput[0];
	return {...result, nestedResult};
};

export const nestedInstance = (file, commandArguments, options, parentOptions) => {
	[commandArguments, options = {}, parentOptions = {}] = Array.isArray(commandArguments)
		? [commandArguments, options, parentOptions]
		: [[], commandArguments, options];
	const {
		parentFixture = 'nested.js',
		worker = false,
		isSync = false,
		optionsFixture,
		optionsInput = {},
		...otherOptions
	} = options;
	const normalizedArguments = {
		parentFixture,
		parentOptions,
		isSync,
		file,
		commandArguments,
		options: otherOptions,
		optionsFixture,
		optionsInput,
	};
	return worker
		? spawnWorker(normalizedArguments)
		: spawnParentProcess(normalizedArguments);
};

const spawnWorker = async workerData => {
	const worker = new Worker(WORKER_URL, {workerData});
	const [result] = await once(worker, 'message');
	if (result instanceof Error) {
		throw result;
	}

	return result;
};

export const spawnParentProcess = ({parentFixture, parentOptions, ...ipcInput}) => execa(parentFixture, {...parentOptions, ipcInput});
