import type {CommonOptions} from '../arguments/options.js';
import type {StdioOptionNormalizedArray} from './array.js';
import type {
	StandardStreams,
	StdioOptionCommon,
	StdioOptionsArray,
	StdioOptionsProperty,
} from './type.js';

// `options.stdin|stdout|stderr|stdio` for a given file descriptor
export type FdStdioOption<
	FdNumber extends string,
	OptionsType extends CommonOptions,
> = Extract<FdStdioOptionProperty<FdNumber, OptionsType>, StdioOptionCommon>;

type FdStdioOptionProperty<
	FdNumber extends string,
	OptionsType extends CommonOptions,
> = string extends FdNumber ? StdioOptionCommon
	: FdNumber extends keyof StandardStreams
		? StandardStreams[FdNumber] extends keyof OptionsType
			? OptionsType[StandardStreams[FdNumber]] extends undefined
				? FdStdioArrayOption<FdNumber, OptionsType>
				: OptionsType[StandardStreams[FdNumber]]
			: FdStdioArrayOption<FdNumber, OptionsType>
		: FdStdioArrayOption<FdNumber, OptionsType>;

// `options.stdio[FdNumber]`, excluding `options.stdin|stdout|stderr`
export type FdStdioArrayOption<
	FdNumber extends string,
	OptionsType extends CommonOptions,
> = Extract<FdStdioArrayOptionProperty<FdNumber, StdioOptionNormalizedArray<OptionsType>>, StdioOptionCommon>;

type FdStdioArrayOptionProperty<
	FdNumber extends string,
	StdioOptionsType extends StdioOptionsProperty,
> = string extends FdNumber
	? StdioOptionCommon | undefined
	: StdioOptionsType extends StdioOptionsArray
		? FdNumber extends keyof StdioOptionsType
			? StdioOptionsType[FdNumber]
			: StdioOptionNormalizedArray<CommonOptions> extends StdioOptionsType
				? StdioOptionsType[number]
				: undefined
		: undefined;
