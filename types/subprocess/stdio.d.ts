import type {Readable, Writable} from 'node:stream';
import type {StdioOptionNormalizedArray} from '../stdio/array.js';
import type {HasIpc} from '../ipc.js';
import type {Options} from '../arguments/options.js';
import type {SubprocessStdioStream} from './stdout.js';

// `subprocess.stdio`
export type SubprocessStdioArray<OptionsType extends Options> = MapStdioStreams<StdioOptionNormalizedArray<OptionsType>, OptionsType>;

// File descriptors beyond `stderr` are only present when the `stdio` option is an array with more items.
// The subprocess' IPC channel, if any, is set as the last file descriptor by Node.js itself.
// Since any `Subprocess` can be passed where the default one is expected, the list is kept open-ended.
type MapStdioStreams<
	StdioOptionsArrayType extends readonly unknown[],
	OptionsType extends Options,
> = [
	...{
		-readonly [FdNumber in keyof StdioOptionsArrayType]: SubprocessStdioStream<FdNumber extends string ? FdNumber : string, OptionsType>
	},
	...(HasIpc<OptionsType> extends true ? [null] : []),
	...Array<Readable | Writable | null>,
];

export {};
