import type {StdioOptionNormalizedArray} from '../stdio/array';
import type {StdioOptionsArray} from '../stdio/type';
import type {Options} from '../arguments/options';
import type {SubprocessStdioStream} from './stdout';

// `subprocess.stdio`
export type SubprocessStdioArray<OptionsType extends Options = Options> = MapStdioStreams<StdioOptionNormalizedArray<OptionsType>, OptionsType>;

// We cannot use mapped types because it must be compatible with Node.js `ChildProcess["stdio"]` which uses a tuple with exactly 5 items
type MapStdioStreams<
	StdioOptionsArrayType extends StdioOptionsArray,
	OptionsType extends Options = Options,
> = [
	SubprocessStdioStream<'0', OptionsType>,
	SubprocessStdioStream<'1', OptionsType>,
	SubprocessStdioStream<'2', OptionsType>,
	'3' extends keyof StdioOptionsArrayType ? SubprocessStdioStream<'3', OptionsType> : never,
	'4' extends keyof StdioOptionsArrayType ? SubprocessStdioStream<'4', OptionsType> : never,
];
