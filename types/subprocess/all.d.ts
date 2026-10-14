import type {Readable} from 'node:stream';
import type {IgnoresSubprocessOutput} from '../return/ignore.js';
import type {Options} from '../arguments/options.js';
import type {And} from '../utils.js';

// `subprocess.all`
export type SubprocessAll<OptionsType extends Options> = OptionsType extends unknown
	? AllStream<AllIgnored<OptionsType['all'], OptionsType>>
	: never;

type AllStream<IsIgnored> = IsIgnored extends true ? undefined : Readable;

type AllIgnored<
	AllOption,
	OptionsType extends Options,
> = AllOption extends true
	? And<IgnoresSubprocessOutput<'1', OptionsType>, IgnoresSubprocessOutput<'2', OptionsType>>
	: true;

export {};
