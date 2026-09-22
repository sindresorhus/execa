import process from 'node:process';

export const isStandardStream = stream => STANDARD_STREAMS.includes(stream);
export const STANDARD_STREAMS = [process.stdin, process.stdout, process.stderr];
export const STANDARD_STREAMS_ALIASES = ['stdin', 'stdout', 'stderr'];
export const getStreamName = fdNumber => STANDARD_STREAMS_ALIASES[fdNumber] ?? `stdio[${fdNumber}]`;

// `subprocess.all` is created by Execa itself, which then pipes `stdout`/`stderr` into it.
// `verbose` needs to tell that pipe apart from a user pipe, which it disables.
const allStreamSymbol = Symbol('execa.allStream');
export const setAllStream = stream => Object.assign(stream, {[allStreamSymbol]: true});
export const isAllStream = stream => stream?.[allStreamSymbol] === true;
