import {aborted} from 'node:util';
import {createNonCommandError} from './throw.js';

export const unpipeOnAbort = (unpipeSignal, unpipeContext) => unpipeSignal === undefined
	? []
	: [unpipeOnSignalAbort(unpipeSignal, unpipeContext)];

const unpipeOnSignalAbort = async (unpipeSignal, {sourceStream, mergedStream, fileDescriptors, sourceOptions, startTime}) => {
	await aborted(unpipeSignal, sourceStream);
	await mergedStream.remove(sourceStream);
	const error = new Error('Pipe cancelled by `unpipeSignal` option.');
	throw createNonCommandError({
		error,
		fileDescriptors,
		sourceOptions,
		startTime,
	});
};
