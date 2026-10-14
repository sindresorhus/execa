import type {StdioOptionNormalizedArray} from '../stdio/array.js';
import type {HasIpc} from '../ipc.js';
import type {CommonOptions, Options, StricterOptions} from '../arguments/options.js';
import type {ResultStdioNotAll} from './result-stdout.js';

// `result.stdio`
export type ResultStdioArray<
	IsSync extends boolean,
	OptionsType extends CommonOptions,
> = [
	...MapResultStdio<StdioOptionNormalizedArray<OptionsType>, OptionsType>,
	...ResultIpcStdio<IsSync, OptionsType>,
];

type MapResultStdio<
	StdioOptionsArrayType extends readonly unknown[],
	OptionsType extends CommonOptions,
> = {
	-readonly [FdNumber in keyof StdioOptionsArrayType]: ResultStdioNotAll<
		FdNumber extends string ? FdNumber : string,
		OptionsType
	>
};

// With the `ipc` option, the subprocess' IPC channel adds one last file descriptor, which has no output. Synchronous methods do not support IPC.
type ResultIpcStdio<
	IsSync extends boolean,
	OptionsType extends CommonOptions,
> = IsSync extends true
	? []
	// With an options union, each member enables IPC separately
	: OptionsType extends unknown
		? HasIpc<StricterOptions<OptionsType, Options>> extends true
			? [undefined]
			: []
		: never;

export {};
