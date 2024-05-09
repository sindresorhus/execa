import type {CommonOptions} from '../arguments/options.js';
import type {StdinOptionCommon, StdoutStderrOptionCommon, StdioOptionCommon} from './type.js';
import type {FdStdioArrayOption} from './option.js';

// Whether `result.stdio[FdNumber]` is an input stream
export type IsInputFd<
	FdNumber extends string,
	OptionsType extends CommonOptions = CommonOptions,
> = FdNumber extends '0'
	? true
	: IsInputDescriptor<FdStdioArrayOption<FdNumber, OptionsType>>;

// Whether `result.stdio[3+]` is an input stream
type IsInputDescriptor<StdioOptionType extends StdioOptionCommon> = StdioOptionType extends StdinOptionCommon
	? StdioOptionType extends StdoutStderrOptionCommon
		? false
		: true
	: false;
