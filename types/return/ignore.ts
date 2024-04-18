import type {NoStreamStdioOption, StdioOptionCommon} from '../stdio/type';
import type {IsInputFd} from '../stdio/direction';
import type {FdStdioOption} from '../stdio/option';
import type {FdSpecificOption} from '../arguments/specific';
import type {CommonOptions} from '../arguments/options';

// Whether `result.stdin|stdout|stderr|all|stdio[*]` is `undefined`
export type IgnoresResultOutput<
	FdNumber extends string,
	OptionsType extends CommonOptions = CommonOptions,
> = FdSpecificOption<OptionsType['buffer'], FdNumber> extends false
	? true
	: IsInputFd<FdNumber, OptionsType> extends true
		? true
		: IgnoresSubprocessOutput<FdNumber, OptionsType>;

// Whether `subprocess.stdout|stderr|all` is `undefined|null`
export type IgnoresSubprocessOutput<
	FdNumber extends string,
	OptionsType extends CommonOptions = CommonOptions,
> = IgnoresOutput<FdNumber, FdStdioOption<FdNumber, OptionsType>>;

type IgnoresOutput<
	FdNumber extends string,
	StdioOptionType extends StdioOptionCommon,
> = StdioOptionType extends NoStreamStdioOption<FdNumber> ? true : false;
