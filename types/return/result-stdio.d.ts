import type {StdioOptionNormalizedArray} from '../stdio/array.js';
import type {HasIpc} from '../ipc.js';
import type {CommonOptions, Options, StricterOptions} from '../arguments/options.js';
import type {ResultStdioNotAll} from './result-stdout.js';

// `result.stdio`
// With the `ipc` option, the subprocess' IPC channel adds one last file descriptor, which has no output
export type ResultStdioArray<OptionsType extends CommonOptions> = MapResultStdio<StdioOptionNormalizedArray<OptionsType>, OptionsType>;

type MapResultStdio<
	StdioOptionsArrayType extends readonly unknown[],
	OptionsType extends CommonOptions,
> = [
	...{
		-readonly [FdNumber in keyof StdioOptionsArrayType]: ResultStdioNotAll<
			FdNumber extends string ? FdNumber : string,
			OptionsType
		>
	},
	...(HasIpc<StricterOptions<OptionsType, Options>> extends true ? [undefined] : []),
];

export {};
