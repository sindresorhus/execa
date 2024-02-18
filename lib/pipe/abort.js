import {aborted} from 'node:util';
import {createNonCommandError} from './validate.js';

export const unpipeOnAbort = (signal, ...args) => signal === undefined
	? []
	: [unpipeOnSignalAbort(signal, ...args)];

const unpipeOnSignalAbort = async (signal, sourceStream, mergedStream, {stdioStreamsGroups, options}) => {
	await aborted(signal, sourceStream);
	await mergedStream.remove(sourceStream);
	const error = new Error('Pipe cancelled by `signal` option.');
	throw createNonCommandError({error, stdioStreamsGroups, options});
};
