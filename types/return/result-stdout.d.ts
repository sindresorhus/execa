import type {BufferEncodingOption, BinaryEncodingOption} from '../arguments/encoding-option';
import type {IsObjectFd} from '../transform/object-mode';
import type {FdSpecificOption} from '../arguments/specific';
import type {CommonOptions} from '../arguments/options';
import type {IgnoresResultOutput} from './ignore';

// `result.stdout|stderr|stdio`
export type ResultStdioNotAll<
	FdNumber extends string,
	OptionsType extends CommonOptions = CommonOptions,
> = ResultStdio<FdNumber, FdNumber, FdNumber, OptionsType>;

// `result.stdout|stderr|stdio|all`
export type ResultStdio<
	MainFdNumber extends string,
	ObjectFdNumber extends string,
	LinesFdNumber extends string,
	OptionsType extends CommonOptions = CommonOptions,
> = ResultStdioProperty<
ObjectFdNumber,
LinesFdNumber,
IgnoresResultOutput<MainFdNumber, OptionsType>,
OptionsType
>;

type ResultStdioProperty<
	ObjectFdNumber extends string,
	LinesFdNumber extends string,
	StreamOutputIgnored extends boolean,
	OptionsType extends CommonOptions = CommonOptions,
> = StreamOutputIgnored extends true
	? undefined
	: ResultStdioItem<
	IsObjectFd<ObjectFdNumber, OptionsType>,
	FdSpecificOption<OptionsType['lines'], LinesFdNumber>,
	OptionsType['encoding']
	>;

type ResultStdioItem<
	IsObjectResult extends boolean,
	LinesOption extends boolean | undefined,
	Encoding extends CommonOptions['encoding'],
> = IsObjectResult extends true ? unknown[]
	: Encoding extends BufferEncodingOption
		? Uint8Array
		: LinesOption extends true
			? Encoding extends BinaryEncodingOption
				? string
				: string[]
			: string;
