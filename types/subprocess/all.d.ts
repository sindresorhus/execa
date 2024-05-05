import type {Readable} from 'node:stream';
import type {IgnoresSubprocessOutput} from '../return/ignore.js';
import type {Options} from '../arguments/options.js';

// `subprocess.all`
export type SubprocessAll<OptionsType extends Options = Options> = AllStream<OptionsType['all'], OptionsType>;

type AllStream<
	AllOption extends Options['all'] = Options['all'],
	OptionsType extends Options = Options,
> = AllOption extends true
	? AllIfStdout<IgnoresSubprocessOutput<'1', OptionsType>, OptionsType>
	: undefined;

type AllIfStdout<
	StdoutResultIgnored extends boolean,
	OptionsType extends Options = Options,
> = StdoutResultIgnored extends true
	? AllIfStderr<IgnoresSubprocessOutput<'2', OptionsType>>
	: Readable;

type AllIfStderr<StderrResultIgnored extends boolean> = StderrResultIgnored extends true
	? undefined
	: Readable;
