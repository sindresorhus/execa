import type {ChildProcess} from 'node:child_process';
import type {SignalConstants} from 'node:os';
import type {Readable, Writable, Duplex} from 'node:stream';
import type {ReadableStream, WritableStream, ReadableWritablePair} from 'node:stream/web';
import type {Options} from '../arguments/options.js';
import type {Result} from '../return/result.js';
import type {PipableSubprocess} from '../pipe.js';
import type {
	ReadableOptions,
	WritableOptions,
	DuplexOptions,
	SubprocessAsyncIterable,
} from '../convert.js';
import type {IpcMethods, HasIpc} from '../ipc.js';
import type {SubprocessStdioStream} from './stdout.js';
import type {SubprocessStdioArray} from './stdio.js';
import type {SubprocessAll} from './all.js';

// Read-side iteration, stream conversion and `all` methods.
// These are shared between a subprocess and the return value of `subprocess.pipe()`, which forwards them from its destination subprocess.
// `writable()`, `duplex()`, `writableStream()` and `transformStream()` are not included: they write to `stdin`, which the pipe already feeds from its source.
export type SubprocessResultMethods<OptionsType extends Options = Options> = {
	/**
	Stream combining/interleaving `subprocess.stdout` and `subprocess.stderr`.

	This requires the `all` option to be `true`.

	This is `undefined` if `stdout` and `stderr` options are set to `'inherit'`, `'ignore'`, `Writable` or `integer`, or if the `buffer` option is `false`.
	*/
	all: SubprocessAll<OptionsType>;

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
	Converts the subprocess to a readable [web stream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream).
	*/
	readableStream(readableOptions?: ReadableOptions): ReadableStream;
};

type ExecaCustomSubprocess<OptionsType extends Options> =
	& IpcMethods<HasIpc<OptionsType>, OptionsType['serialization']>
	& PipableSubprocess
	& SubprocessResultMethods<OptionsType>
	& {
		/**
		Process identifier ([PID](https://en.wikipedia.org/wiki/Process_identifier)).

		This is `undefined` if the subprocess failed to spawn.
		*/
		pid?: number;

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
		kill(signal?: keyof SignalConstants | number, error?: Error): boolean;
		kill(error?: Error): boolean;

		/**
		Converts the subprocess to a writable stream.
		*/
		writable(writableOptions?: WritableOptions): Writable;

		/**
		Converts the subprocess to a duplex stream.
		*/
		duplex(duplexOptions?: DuplexOptions): Duplex;

		/**
		Converts the subprocess to a writable [web stream](https://developer.mozilla.org/en-US/docs/Web/API/WritableStream).
		*/
		writableStream(writableOptions?: WritableOptions): WritableStream;

		/**
		Converts the subprocess to a [`{readable, writable}`](https://developer.mozilla.org/en-US/docs/Web/API/TransformStream) pair of web streams.
		*/
		transformStream(duplexOptions?: DuplexOptions): ReadableWritablePair;

		/**
		Underlying Node.js [`ChildProcess`](https://nodejs.org/api/child_process.html#class-childprocess) instance.

		This is an escape hatch for Node.js-specific APIs not documented by Execa, such as `.on()`, `.send()`, `.disconnect()`, `.ref()` or `.unref()`.
		*/
		nodeChildProcess: ChildProcess;
	};

/**
Subprocess with Execa-specific methods and properties. It is also a `Promise` either resolving with its successful `result`, or rejecting with its `error`.
*/
export type Subprocess<OptionsType extends Options = Options> =
	& ExecaCustomSubprocess<OptionsType>
	& Promise<Result<OptionsType>>;

/**
The return value of all asynchronous methods is both:
- the subprocess with Execa-specific methods and properties.
- a `Promise` either resolving with its successful `result`, or rejecting with its `error`.
*/
export type ResultPromise<OptionsType extends Options = Options> =
	Subprocess<OptionsType>;

export {};
