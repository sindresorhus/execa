import type {CommonOptions} from '../arguments/options.js';
import type {Intersects} from '../utils.js';
import type {StdioSingleOptionItems, InputStdioOption, AmbiguousStdioOption} from './type.js';
import type {FdStdioArrayOption} from './option.js';

type AnyAmbiguousStdioOption = AmbiguousStdioOption<boolean, false, boolean>;

type InputAmbiguousStdioOption = AnyAmbiguousStdioOption & {
	readonly input: true;
};

type AmbiguousStdioInputValue<StdioOptionType> = StdioOptionType extends AnyAmbiguousStdioOption
	? AmbiguousStdioInputProperty<StdioOptionType>
	: never;

type AmbiguousStdioInputProperty<StdioOptionType> = 'input' extends keyof StdioOptionType
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
	FdNumber extends '1' | '2' ? InputStdioOption : InputStdioOption | InputAmbiguousStdioOption
> extends true
	? true
	: FdNumber extends '1' | '2'
		? false
		: true extends AmbiguousStdioInputValue<StdioOptionType>
			? boolean
			: false;

export {};
