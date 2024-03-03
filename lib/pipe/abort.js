import {aborted} from 'node:util';
import {createNonCommandError} from './throw.js';

export const unpipeOnAbort = (unpipeSignal, ...args) => unpipeSignal === undefined
	? []
	: [unpipeOnSignalAbort(unpipeSignal, ...args)];

const unpipeOnSignalAbort = async (unpipeSignal, {sourceStream, mergedStream, stdioStreamsGroups, sourceOptions, startTime}) => {
	await aborted(unpipeSignal, sourceStream);
	await mergedStream.remove(sourceStream);
	const error = new Error('Pipe cancelled by `unpipeSignal` option.');
	throw createNonCommandError({error, stdioStreamsGroups, sourceOptions, startTime});
};
