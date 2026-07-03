import type {CommonOptions} from '../arguments/options.js';
import type {Intersects} from '../utils.js';
import type {StdioSingleOptionItems, InputStdioOption, NativePipeStdioOption} from './type.js';
import type {FdStdioArrayOption} from './option.js';

type AnyNativePipeStdioOption = NativePipeStdioOption<boolean, false>;

type InputNativePipeStdioOption = AnyNativePipeStdioOption & {
	readonly input: true;
};

type NativePipeInputValue<StdioOptionType> = StdioOptionType extends AnyNativePipeStdioOption
	? NativePipeInputProperty<StdioOptionType>
	: never;

type NativePipeInputProperty<StdioOptionType> = 'input' extends keyof StdioOptionType
	? StdioOptionType extends {readonly input?: infer Input} ? Input : never
	: never;

// Whether `result.stdio[FdNumber]` is an input stream
export type IsInputFd<
	FdNumber extends string,
	OptionsType extends CommonOptions,
> = FdNumber extends '0'
	? true
	: IsInputFdOption<
		FdNumber,
		StdioSingleOptionItems<FdStdioArrayOption<FdNumber, OptionsType>>
	>;

type IsInputFdOption<
	FdNumber extends string,
	StdioOptionType,
> = Intersects<
	StdioOptionType,
	FdNumber extends '1' | '2' ? InputStdioOption : InputStdioOption | InputNativePipeStdioOption
> extends true
	? true
	: FdNumber extends '1' | '2'
		? false
		: true extends NativePipeInputValue<StdioOptionType>
			? boolean
			: false;

export {};
