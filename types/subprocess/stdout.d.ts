import type {Readable, Writable} from 'node:stream';
import type {IsInputFd} from '../stdio/direction';
import type {IgnoresSubprocessOutput} from '../return/ignore';
import type {Options} from '../arguments/options';

// `subprocess.stdin|stdout|stderr|stdio`
export type SubprocessStdioStream<
	FdNumber extends string,
	OptionsType extends Options = Options,
> = SubprocessStream<FdNumber, IgnoresSubprocessOutput<FdNumber, OptionsType>, OptionsType>;

type SubprocessStream<
	FdNumber extends string,
	StreamResultIgnored extends boolean,
	OptionsType extends Options = Options,
> = StreamResultIgnored extends true
	? null
	: InputOutputStream<IsInputFd<FdNumber, OptionsType>>;

type InputOutputStream<IsInput extends boolean> = IsInput extends true
	? Writable
	: Readable;
