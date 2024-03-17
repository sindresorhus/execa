import {ChildProcess} from 'node:child_process';
import {addAbortListener} from 'node:events';
import process from 'node:process';

export const isStandardStream = stream => STANDARD_STREAMS.includes(stream);
export const STANDARD_STREAMS = [process.stdin, process.stdout, process.stderr];
export const STANDARD_STREAMS_ALIASES = ['stdin', 'stdout', 'stderr'];

export const incrementMaxListeners = (eventEmitter, maxListenersIncrement, signal) => {
	const maxListeners = eventEmitter.getMaxListeners();
	if (maxListeners === 0 || maxListeners === Number.POSITIVE_INFINITY) {
		return;
	}

	eventEmitter.setMaxListeners(maxListeners + maxListenersIncrement);
	addAbortListener(signal, () => {
		eventEmitter.setMaxListeners(eventEmitter.getMaxListeners() - maxListenersIncrement);
	});
};

export const isSubprocess = value => value instanceof ChildProcess;
