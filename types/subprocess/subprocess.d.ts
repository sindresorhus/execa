import type {ChildProcess} from 'node:child_process';
import type {Readable, Writable, Duplex} from 'node:stream';
import type {StdioOptionsArray} from '../stdio/type';
import type {Options} from '../arguments/options';
import type {ExecaResult} from '../return/result';
import type {PipableSubprocess} from '../pipe';
import type {
	ReadableOptions,
	WritableOptions,
	DuplexOptions,
	SubprocessAsyncIterable,
} from '../convert';
import type {SubprocessStdioStream} from './stdout';
import type {SubprocessStdioArray} from './stdio';
import type {SubprocessAll} from './all';

type HasIpc<OptionsType extends Options> = OptionsType['ipc'] extends true
	? true
	: OptionsType['stdio'] extends StdioOptionsArray
		? 'ipc' extends OptionsType['stdio'][number] ? true : false
		: false;

export type ExecaResultPromise<OptionsType extends Options = Options> = {
	/**
	Process identifier ([PID](https://en.wikipedia.org/wiki/Process_identifier)).

	This is `undefined` if the subprocess failed to spawn.
	*/
	pid?: number;

	/**
	Send a `message` to the subprocess. The type of `message` depends on the `serialization` option.
	The subprocess receives it as a [`message` event](https://nodejs.org/api/process.html#event-message).

	This returns `true` on success.

	This requires the `ipc` option to be `true`.

	[More info.](https://nodejs.org/api/child_process.html#subprocesssendmessage-sendhandle-options-callback)
	*/
	send: HasIpc<OptionsType> extends true ? ChildProcess['send'] : undefined;

	/**
	The subprocess [`stdin`](https://en.wikipedia.org/wiki/Standard_streams#Standard_input_(stdin)) as a stream.

	This is `null` if the `stdin` option is set to `'inherit'`, `'ignore'`, `Readable` or `integer`.
	*/
	stdin: SubprocessStdioStream<'0', OptionsType>;

	/**
	The subprocess [`stdout`](https://en.wikipedia.org/wiki/Standard_streams#Standard_output_(stdout)) as a stream.

	This is `null` if the `stdout` option is set to `'inherit'`, `'ignore'`, `Writable` or `integer`, or if the `buffer` option is `false`.
	*/
	stdout: SubprocessStdioStream<'1', OptionsType>;

	/**
	The subprocess [`stderr`](https://en.wikipedia.org/wiki/Standard_streams#Standard_error_(stderr)) as a stream.

	This is `null` if the `stderr` option is set to `'inherit'`, `'ignore'`, `Writable` or `integer`, or if the `buffer` option is `false`.
	*/
	stderr: SubprocessStdioStream<'2', OptionsType>;

	/**
	Stream combining/interleaving `subprocess.stdout` and `subprocess.stderr`.

	This requires the `all` option to be `true`.

	This is `undefined` if `stdout` and `stderr` options are set to `'inherit'`, `'ignore'`, `Writable` or `integer`, or if the `buffer` option is `false`.
	*/
	all: SubprocessAll<OptionsType>;

	/**
	The subprocess `stdin`, `stdout`, `stderr` and other files descriptors as an array of streams.

	Each array item is `null` if the corresponding `stdin`, `stdout`, `stderr` or `stdio` option is set to `'inherit'`, `'ignore'`, `Stream` or `integer`, or if the `buffer` option is `false`.
	*/
	stdio: SubprocessStdioArray<OptionsType>;

	/**
	Sends a [signal](https://nodejs.org/api/os.html#signal-constants) to the subprocess. The default signal is the `killSignal` option. `killSignal` defaults to `SIGTERM`, which terminates the subprocess.

	This returns `false` when the signal could not be sent, for example when the subprocess has already exited.

	When an error is passed as argument, it is set to the subprocess' `error.cause`. The subprocess is then terminated with the default signal. This does not emit the [`error` event](https://nodejs.org/api/child_process.html#event-error).

	[More info.](https://nodejs.org/api/child_process.html#subprocesskillsignal)
	*/
	kill(signal: Parameters<ChildProcess['kill']>[0], error?: Error): ReturnType<ChildProcess['kill']>;
	kill(error?: Error): ReturnType<ChildProcess['kill']>;

	/**
	Subprocesses are [async iterables](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator). They iterate over each output line.
	*/
	[Symbol.asyncIterator](): SubprocessAsyncIterable<undefined, OptionsType['encoding']>;

	/**
	Same as `subprocess[Symbol.asyncIterator]` except options can be provided.
	*/
	iterable<IterableOptions extends ReadableOptions = {}>(readableOptions?: IterableOptions): SubprocessAsyncIterable<IterableOptions['binary'], OptionsType['encoding']>;

	/**
	Converts the subprocess to a readable stream.
	*/
	readable(readableOptions?: ReadableOptions): Readable;

	/**
	Converts the subprocess to a writable stream.
	*/
	writable(writableOptions?: WritableOptions): Writable;

	/**
	Converts the subprocess to a duplex stream.
	*/
	duplex(duplexOptions?: DuplexOptions): Duplex;
} & PipableSubprocess;

export type ExecaSubprocess<OptionsType extends Options = Options> = Omit<ChildProcess, keyof ExecaResultPromise<OptionsType>> &
ExecaResultPromise<OptionsType> &
Promise<ExecaResult<OptionsType>>;
