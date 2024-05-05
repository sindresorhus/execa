import type {StdioSingleOption, StdioOptionCommon} from '../stdio/type';
import type {FdStdioOption} from '../stdio/option';
import type {CommonOptions} from '../arguments/options';
import type {DuplexTransform} from './normalize';

// Whether a file descriptor is in object mode
// I.e. whether `result.stdout|stderr|stdio|all` is an array of `unknown` due to `objectMode: true`
export type IsObjectFd<
	FdNumber extends string,
	OptionsType extends CommonOptions = CommonOptions,
> = IsObjectStdioOption<FdStdioOption<FdNumber, OptionsType>>;

type IsObjectStdioOption<StdioOptionType extends StdioOptionCommon> = IsObjectStdioSingleOption<StdioOptionType extends readonly StdioSingleOption[]
	? StdioOptionType[number]
	: StdioOptionType
>;

type IsObjectStdioSingleOption<StdioSingleOptionType extends StdioSingleOption> = StdioSingleOptionType extends {objectMode?: boolean}
	? BooleanObjectMode<StdioSingleOptionType['objectMode']>
	: StdioSingleOptionType extends DuplexTransform
		? StdioSingleOptionType['transform']['readableObjectMode']
		: false;

type BooleanObjectMode<ObjectModeOption extends boolean | undefined> = ObjectModeOption extends true ? true : false;
