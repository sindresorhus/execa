import type {CommonOptions} from '../arguments/options.js';
import type {StdioOptionNormalizedArray} from './array.js';
import type {StandardStreams, StdioOptionCommon, StdioOptionsArray} from './type.js';

// `options.stdin|stdout|stderr|stdio` for a given file descriptor
export type FdStdioOption<
	FdNumber extends string,
	OptionsType extends CommonOptions,
> = FdNumber extends '0'
	? OptionsType extends CommonOptions
		? WithInputSources<OptionsType, 'input' | 'inputFile', FdStdioOptionProperty<FdNumber, OptionsType>, 'pipe'>
		: never
	: FdStdioOptionProperty<FdNumber, OptionsType>;

// A defined input source overrides the `stdin` option and makes it use a pipe.
// Since each input source can be optional, both values are possible when some of them are.
export type WithInputSources<
	OptionsType extends CommonOptions,
	InputKeys extends string,
	NoInputValue,
	InputValue,
	InputOptions = Pick<OptionsType, Extract<keyof OptionsType, InputKeys>>,
> = InputOptions[keyof InputOptions] extends undefined
	? NoInputValue
	: {[Key in keyof InputOptions]: undefined} extends InputOptions
		? NoInputValue | InputValue
		: InputValue;

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
> = FdStdioArrayOptionProperty<FdNumber, StdioOptionNormalizedArray<OptionsType>>;

type FdStdioArrayOptionProperty<
	FdNumber extends string,
	StdioOptionsType,
> = string extends FdNumber
	? StdioOptionCommon | undefined
	: StdioOptionsType extends StdioOptionsArray
		? FdNumber extends keyof StdioOptionsType
			? StdioOptionsType[FdNumber]
			: StdioOptionNormalizedArray<CommonOptions> extends StdioOptionsType
				? StdioOptionsType[number]
				: undefined
		: undefined;

export {};
