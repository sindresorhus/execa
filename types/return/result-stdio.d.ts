import type {StdioOptionsArray} from '../stdio/type';
import type {StdioOptionNormalizedArray} from '../stdio/array';
import type {CommonOptions} from '../arguments/options';
import type {ResultStdioNotAll} from './result-stdout';

// `result.stdio`
export type ResultStdioArray<OptionsType extends CommonOptions = CommonOptions> =
	MapResultStdio<StdioOptionNormalizedArray<OptionsType>, OptionsType>;

type MapResultStdio<
	StdioOptionsArrayType extends StdioOptionsArray,
	OptionsType extends CommonOptions = CommonOptions,
> = {
	-readonly [FdNumber in keyof StdioOptionsArrayType]: ResultStdioNotAll<
	FdNumber extends string ? FdNumber : string,
	OptionsType
	>
};
