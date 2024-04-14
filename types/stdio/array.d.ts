import type {CommonOptions} from '../arguments/options';
import type {StdinOptionCommon, StdoutStderrOptionCommon, StdioOptionsArray} from './type';

// `options.stdio`, normalized as an array
export type StdioOptionNormalizedArray<OptionsType extends CommonOptions = CommonOptions> = StdioOptionNormalized<OptionsType['stdio']>;

type StdioOptionNormalized<StdioOption extends CommonOptions['stdio'] = CommonOptions['stdio']> = StdioOption extends StdioOptionsArray
	? StdioOption
	: StdioOption extends StdinOptionCommon
		? StdioOption extends StdoutStderrOptionCommon
			? readonly [StdioOption, StdioOption, StdioOption]
			: DefaultStdioOption
		: DefaultStdioOption;

// `options.stdio` default value
type DefaultStdioOption = readonly ['pipe', 'pipe', 'pipe'];
