import {type ChildProcess} from 'node:child_process';
import {type Readable, type Writable, type Duplex} from 'node:stream';

type And<First extends boolean, Second extends boolean> = First extends true ? Second : false;

type Or<First extends boolean, Second extends boolean> = First extends true ? true : Second;

type Unless<Condition extends boolean, ThenValue, ElseValue = never> = Condition extends true ? ElseValue : ThenValue;

type AndUnless<Condition extends boolean, ThenValue, ElseValue = unknown> = Condition extends true ? ElseValue : ThenValue;

// When the `stdin`/`stdout`/`stderr`/`stdio` option is set to one of those values, no stream is created
type NoStreamStdioOption =
	| 'ignore'
	| 'inherit'
	| 'ipc'
	| number
	| Readable
	| Writable
	| [NoStreamStdioOption];

type BaseStdioOption<
	IsSync extends boolean = boolean,
	IsArray extends boolean = boolean,
> =
	| 'pipe'
	| undefined
	| Unless<And<IsSync, IsArray>, 'inherit'>
	| Unless<IsArray, 'ignore'>
	| Unless<IsSync, 'overlapped'>;

// @todo Use `string`, `Uint8Array` or `unknown` for both the argument and the return type, based on whether `encoding: 'buffer'` and `objectMode: true` are used.
// See https://github.com/sindresorhus/execa/issues/694
type GeneratorTransform<IsSync extends boolean> = (chunk: unknown) =>
| Unless<IsSync, AsyncGenerator<unknown, void, void>>
| Generator<unknown, void, void>;
type GeneratorFinal<IsSync extends boolean> = () =>
| Unless<IsSync, AsyncGenerator<unknown, void, void>>
| Generator<unknown, void, void>;

type GeneratorTransformFull<IsSync extends boolean> = {
	transform: GeneratorTransform<IsSync>;
	final?: GeneratorFinal<IsSync>;
	binary?: boolean;
	preserveNewlines?: boolean;
	objectMode?: boolean;
};

type DuplexTransform = {
	transform: Duplex;
	objectMode?: boolean;
};

type WebTransform = {
	transform: TransformStream;
	objectMode?: boolean;
};

type CommonStdioOption<
	IsSync extends boolean = boolean,
	IsArray extends boolean = boolean,
> =
	| BaseStdioOption<IsSync, IsArray>
	| URL
	| {file: string}
	| GeneratorTransform<IsSync>
	| GeneratorTransformFull<IsSync>
	| Unless<And<IsSync, IsArray>, number>
	| Unless<Or<IsSync, IsArray>, 'ipc'>
	| Unless<IsSync,
	| DuplexTransform
	| WebTransform
	| TransformStream>;

// Synchronous iterables excluding strings, Uint8Arrays and Arrays
type IterableObject<IsArray extends boolean = boolean> = Iterable<unknown>
& object
& {readonly BYTES_PER_ELEMENT?: never}
& AndUnless<IsArray, {readonly lastIndexOf?: never}>;

type InputStdioOption<
	IsSync extends boolean = boolean,
	IsExtra extends boolean = boolean,
	IsArray extends boolean = boolean,
> =
	| Unless<And<IsSync, IsExtra>, Uint8Array | IterableObject<IsArray>>
	| Unless<And<IsSync, IsArray>, Readable>
	| Unless<IsSync, AsyncIterable<unknown> | ReadableStream>;

type OutputStdioOption<
	IsSync extends boolean = boolean,
	IsArray extends boolean = boolean,
> =
	| Unless<And<IsSync, IsArray>, Writable>
	| Unless<IsSync, WritableStream>;

type StdinSingleOption<
	IsSync extends boolean = boolean,
	IsExtra extends boolean = boolean,
	IsArray extends boolean = boolean,
> =
	| CommonStdioOption<IsSync, IsArray>
	| InputStdioOption<IsSync, IsExtra, IsArray>;

type StdinOptionCommon<
	IsSync extends boolean = boolean,
	IsExtra extends boolean = boolean,
> =
	| StdinSingleOption<IsSync, IsExtra, false>
	| ReadonlyArray<StdinSingleOption<IsSync, IsExtra, true>>;

export type StdinOption = StdinOptionCommon<false, false>;
export type StdinOptionSync = StdinOptionCommon<true, false>;

type StdoutStderrSingleOption<
	IsSync extends boolean = boolean,
	IsArray extends boolean = boolean,
> =
  | CommonStdioOption<IsSync, IsArray>
  | OutputStdioOption<IsSync, IsArray>;

type StdoutStderrOptionCommon<IsSync extends boolean = boolean> =
	| StdoutStderrSingleOption<IsSync, false>
	| ReadonlyArray<StdoutStderrSingleOption<IsSync, true>>;

export type StdoutStderrOption = StdoutStderrOptionCommon<false>;
export type StdoutStderrOptionSync = StdoutStderrOptionCommon<true>;

type StdioExtraOptionCommon<IsSync extends boolean = boolean> =
	| StdinOptionCommon<IsSync, true>
	| StdoutStderrOptionCommon<IsSync>;

type StdioSingleOption<
	IsSync extends boolean = boolean,
	IsExtra extends boolean = boolean,
	IsArray extends boolean = boolean,
> =
	| StdinSingleOption<IsSync, IsExtra, IsArray>
	| StdoutStderrSingleOption<IsSync, IsArray>;

type StdioOptionCommon<IsSync extends boolean = boolean> =
	| StdinOptionCommon<IsSync>
	| StdoutStderrOptionCommon<IsSync>;

export type StdioOption = StdioOptionCommon<false>;
export type StdioOptionSync = StdioOptionCommon<true>;

type StdioOptionsArray<IsSync extends boolean = boolean> = readonly [
	StdinOptionCommon<IsSync, false>,
	StdoutStderrOptionCommon<IsSync>,
	StdoutStderrOptionCommon<IsSync>,
	...ReadonlyArray<StdioExtraOptionCommon<IsSync>>,
];

type StdioOptions<IsSync extends boolean = boolean> = BaseStdioOption<IsSync> | StdioOptionsArray<IsSync>;

type DefaultEncodingOption = 'utf8';
type TextEncodingOption =
  | DefaultEncodingOption
  | 'utf16le';
type BufferEncodingOption = 'buffer';
type BinaryEncodingOption =
  | BufferEncodingOption
  | 'hex'
  | 'base64'
  | 'base64url'
  | 'latin1'
  | 'ascii';
type EncodingOption =
	| TextEncodingOption
	| BinaryEncodingOption
	| undefined;

// Whether `result.stdout|stderr|all` is an array of values due to `objectMode: true`
type IsObjectStream<
	FdNumber extends string,
	OptionsType extends CommonOptions = CommonOptions,
> = IsObjectOutputOptions<StreamOption<FdNumber, OptionsType>>;

type IsObjectOutputOptions<OutputOptions extends StdioOptionCommon> = IsObjectOutputOption<OutputOptions extends readonly StdioSingleOption[]
	? OutputOptions[number]
	: OutputOptions
>;

type IsObjectOutputOption<OutputOption extends StdioSingleOption> = OutputOption extends GeneratorTransformFull<boolean> | WebTransform
	? BooleanObjectMode<OutputOption['objectMode']>
	: OutputOption extends DuplexTransform
		? DuplexObjectMode<OutputOption>
		: false;

type BooleanObjectMode<ObjectModeOption extends boolean | undefined> = ObjectModeOption extends true ? true : false;

type DuplexObjectMode<OutputOption extends DuplexTransform> = OutputOption['objectMode'] extends boolean
	? OutputOption['objectMode']
	: OutputOption['transform']['readableObjectMode'];

// Whether `result.stdout|stderr|all` is `undefined`, excluding the `buffer` option
type IgnoresStreamResult<
	FdNumber extends string,
	OptionsType extends CommonOptions = CommonOptions,
> = IgnoresStdioResult<StreamOption<FdNumber, OptionsType>>;

// Whether `result.stdio[*]` is `undefined`
type IgnoresStdioResult<StdioOptionType extends StdioOptionCommon> = StdioOptionType extends NoStreamStdioOption ? true : false;

// Whether `result.stdout|stderr|all` is `undefined`
type IgnoresStreamOutput<
	FdNumber extends string,
	OptionsType extends CommonOptions = CommonOptions,
> = LacksBuffer<OptionsType['buffer']> extends true
	? true
	: IsInputStdioDescriptor<FdNumber, OptionsType> extends true
		? true
		: IgnoresStreamResult<FdNumber, OptionsType>;

type LacksBuffer<BufferOption extends Options['buffer']> = BufferOption extends false ? true : false;

// Whether `result.stdio[FdNumber]` is an input stream
type IsInputStdioDescriptor<
	FdNumber extends string,
	OptionsType extends CommonOptions = CommonOptions,
> = FdNumber extends '0'
	? true
	: IsInputStdio<StdioProperty<FdNumber, OptionsType>>;

// Whether `result.stdio[3+]` is an input stream
type IsInputStdio<StdioOptionType extends StdioOptionCommon> = StdioOptionType extends StdinOptionCommon
	? StdioOptionType extends StdoutStderrOptionCommon
		? false
		: true
	: false;

// `options.stdin|stdout|stderr|stdio`
type StreamOption<
	FdNumber extends string,
	OptionsType extends CommonOptions = CommonOptions,
> = string extends FdNumber ? StdioOptionCommon
	: FdNumber extends keyof StreamOptionsNames
		? StreamOptionsNames[FdNumber] extends keyof OptionsType
			? OptionsType[StreamOptionsNames[FdNumber]] extends undefined
				? StdioProperty<FdNumber, OptionsType>
				: OptionsType[StreamOptionsNames[FdNumber]]
			: StdioProperty<FdNumber, OptionsType>
		: StdioProperty<FdNumber, OptionsType>;

type StreamOptionsNames = ['stdin', 'stdout', 'stderr'];

// `options.stdio[FdNumber]`
type StdioProperty<
	FdNumber extends string,
	OptionsType extends CommonOptions = CommonOptions,
> = StdioOptionProperty<FdNumber, StdioArrayOption<OptionsType>>;

type StdioOptionProperty<
	FdNumber extends string,
	StdioOptionsType extends StdioOptions,
> = string extends FdNumber
	? StdioOptionCommon | undefined
	: StdioOptionsType extends StdioOptionsArray
		? FdNumber extends keyof StdioOptionsType
			? StdioOptionsType[FdNumber]
			: StdioArrayOption extends StdioOptionsType
				? StdioOptionsType[number]
				: undefined
		: undefined;

// Type of `result.stdout|stderr`
type StdioOutput<
	FdNumber extends string,
	OptionsType extends CommonOptions = CommonOptions,
> = StdioOutputResult<FdNumber, IgnoresStreamOutput<FdNumber, OptionsType>, OptionsType>;

type StdioOutputResult<
	FdNumber extends string,
	StreamOutputIgnored extends boolean,
	OptionsType extends CommonOptions = CommonOptions,
> = StreamOutputIgnored extends true
	? undefined
	: StreamEncoding<IsObjectStream<FdNumber, OptionsType>, OptionsType['lines'], OptionsType['encoding']>;

type StreamEncoding<
	IsObjectResult extends boolean,
	LinesOption extends CommonOptions['lines'],
	Encoding extends CommonOptions['encoding'],
> = IsObjectResult extends true ? unknown[]
	: Encoding extends BufferEncodingOption
		? Uint8Array
		: LinesOption extends true
			? Encoding extends BinaryEncodingOption
				? string
				: string[]
			: string;

// Type of `result.all`
type AllOutput<OptionsType extends Options = Options> = AllOutputProperty<OptionsType['all'], OptionsType>;

type AllOutputProperty<
	AllOption extends Options['all'] = Options['all'],
	OptionsType extends Options = Options,
> = AllOption extends true
	? StdioOutput<AllUsesStdout<OptionsType> extends true ? '1' : '2', OptionsType>
	: undefined;

type AllUsesStdout<OptionsType extends Options = Options> = IgnoresStreamOutput<'1', OptionsType> extends true
	? false
	: IgnoresStreamOutput<'2', OptionsType> extends true
		? true
		: IsObjectStream<'2', OptionsType> extends true
			? false
			: IsObjectStream<'1', OptionsType>;

// Type of `result.stdio`
type StdioArrayOutput<OptionsType extends CommonOptions = CommonOptions> = MapStdioOptions<StdioArrayOption<OptionsType>, OptionsType>;

type MapStdioOptions<
	StdioOptionsArrayType extends StdioOptionsArray,
	OptionsType extends CommonOptions = CommonOptions,
> = {
	-readonly [FdNumber in keyof StdioOptionsArrayType]: StdioOutput<
	FdNumber extends string ? FdNumber : string,
	OptionsType
	>
};

// `stdio` option
type StdioArrayOption<OptionsType extends CommonOptions = CommonOptions> = StdioArrayOptionValue<OptionsType['stdio']>;

type StdioArrayOptionValue<StdioOption extends CommonOptions['stdio'] = CommonOptions['stdio']> = StdioOption extends StdioOptionsArray
	? StdioOption
	: StdioOption extends StdinOptionCommon
		? StdioOption extends StdoutStderrOptionCommon
			? readonly [StdioOption, StdioOption, StdioOption]
			: DefaultStdio
		: DefaultStdio;

type DefaultStdio = readonly ['pipe', 'pipe', 'pipe'];

type StricterOptions<
	WideOptions extends CommonOptions,
	StrictOptions extends CommonOptions,
> = WideOptions extends StrictOptions ? WideOptions : StrictOptions;

type CommonOptions<IsSync extends boolean = boolean> = {
	/**
	Prefer locally installed binaries when looking for a binary to execute.

	If you `$ npm install foo`, you can then `execa('foo')`.

	@default `true` with `$`, `false` otherwise
	*/
	readonly preferLocal?: boolean;

	/**
	Preferred path to find locally installed binaries in (use with `preferLocal`).

	@default process.cwd()
	*/
	readonly localDir?: string | URL;

	/**
	If `true`, runs with Node.js. The first argument must be a Node.js file.

	@default `true` with `execaNode()`, `false` otherwise
	*/
	readonly node?: boolean;

	/**
	Path to the Node.js executable.

	For example, this can be used together with [`get-node`](https://github.com/ehmicky/get-node) to run a specific Node.js version.

	Requires the `node` option to be `true`.

	@default [`process.execPath`](https://nodejs.org/api/process.html#process_process_execpath) (current Node.js executable)
	*/
	readonly nodePath?: string | URL;

	/**
	List of [CLI options](https://nodejs.org/api/cli.html#cli_options) passed to the Node.js executable.

	Requires the `node` option to be `true`.

	@default [`process.execArgv`](https://nodejs.org/api/process.html#process_process_execargv) (current Node.js CLI options)
	*/
	readonly nodeOptions?: readonly string[];

	/**
	Write some input to the subprocess' `stdin`.

	See also the `inputFile` and `stdin` options.
	*/
	readonly input?: string | Uint8Array | Readable;

	/**
	Use a file as input to the subprocess' `stdin`.

	See also the `input` and `stdin` options.
	*/
	readonly inputFile?: string | URL;

	/**
	[How to setup](https://nodejs.org/api/child_process.html#child_process_options_stdio) the subprocess' standard input. This can be:
	- `'pipe'`: Sets [`subprocess.stdin`](https://nodejs.org/api/child_process.html#subprocessstdin) stream.
	- `'overlapped'`: Like `'pipe'` but asynchronous on Windows.
	- `'ignore'`: Do not use `stdin`.
	- `'inherit'`: Re-use the current process' `stdin`.
	- an integer: Re-use a specific file descriptor from the current process.
	- a Node.js `Readable` stream.
	- `{ file: 'path' }` object.
	- a file URL.
	- a web [`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream).
	- an [`Iterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterable_protocol) or an [`AsyncIterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_async_iterator_and_async_iterable_protocols)
	- an `Uint8Array`.

	This can be an [array of values](https://github.com/sindresorhus/execa#redirect-stdinstdoutstderr-to-multiple-destinations) such as `['inherit', 'pipe']` or `[filePath, 'pipe']`.

	This can also be a generator function or a [`Duplex`](https://nodejs.org/api/stream.html#class-streamduplex) or a [web `TransformStream`](https://developer.mozilla.org/en-US/docs/Web/API/TransformStream) to transform the input. [Learn more.](https://github.com/sindresorhus/execa/tree/main/docs/transform.md)

	@default `inherit` with `$`, `pipe` otherwise
	*/
	readonly stdin?: StdinOptionCommon<IsSync>;

	/**
	[How to setup](https://nodejs.org/api/child_process.html#child_process_options_stdio) the subprocess' standard output. This can be:
	- `'pipe'`: Sets `subprocessResult.stdout` (as a string or `Uint8Array`) and [`subprocess.stdout`](https://nodejs.org/api/child_process.html#subprocessstdout) (as a stream).
	- `'overlapped'`: Like `'pipe'` but asynchronous on Windows.
	- `'ignore'`: Do not use `stdout`.
	- `'inherit'`: Re-use the current process' `stdout`.
	- an integer: Re-use a specific file descriptor from the current process.
	- a Node.js `Writable` stream.
	- `{ file: 'path' }` object.
	- a file URL.
	- a web [`WritableStream`](https://developer.mozilla.org/en-US/docs/Web/API/WritableStream).

	This can be an [array of values](https://github.com/sindresorhus/execa#redirect-stdinstdoutstderr-to-multiple-destinations) such as `['inherit', 'pipe']` or `[filePath, 'pipe']`.

	This can also be a generator function or a [`Duplex`](https://nodejs.org/api/stream.html#class-streamduplex) or a [web `TransformStream`](https://developer.mozilla.org/en-US/docs/Web/API/TransformStream) to transform the output. [Learn more.](https://github.com/sindresorhus/execa/tree/main/docs/transform.md)

	@default 'pipe'
	*/
	readonly stdout?: StdoutStderrOptionCommon<IsSync>;

	/**
	[How to setup](https://nodejs.org/api/child_process.html#child_process_options_stdio) the subprocess' standard error. This can be:
	- `'pipe'`: Sets `subprocessResult.stderr` (as a string or `Uint8Array`) and [`subprocess.stderr`](https://nodejs.org/api/child_process.html#subprocessstderr) (as a stream).
	- `'overlapped'`: Like `'pipe'` but asynchronous on Windows.
	- `'ignore'`: Do not use `stderr`.
	- `'inherit'`: Re-use the current process' `stderr`.
	- an integer: Re-use a specific file descriptor from the current process.
	- a Node.js `Writable` stream.
	- `{ file: 'path' }` object.
	- a file URL.
	- a web [`WritableStream`](https://developer.mozilla.org/en-US/docs/Web/API/WritableStream).

	This can be an [array of values](https://github.com/sindresorhus/execa#redirect-stdinstdoutstderr-to-multiple-destinations) such as `['inherit', 'pipe']` or `[filePath, 'pipe']`.

	This can also be a generator function or a [`Duplex`](https://nodejs.org/api/stream.html#class-streamduplex) or a [web `TransformStream`](https://developer.mozilla.org/en-US/docs/Web/API/TransformStream) to transform the output. [Learn more.](https://github.com/sindresorhus/execa/tree/main/docs/transform.md)

	@default 'pipe'
	*/
	readonly stderr?: StdoutStderrOptionCommon<IsSync>;

	/**
	Like the `stdin`, `stdout` and `stderr` options but for all file descriptors at once. For example, `{stdio: ['ignore', 'pipe', 'pipe']}` is the same as `{stdin: 'ignore', stdout: 'pipe', stderr: 'pipe'}`.

	A single string can be used as a shortcut. For example, `{stdio: 'pipe'}` is the same as `{stdin: 'pipe', stdout: 'pipe', stderr: 'pipe'}`.

	The array can have more than 3 items, to create additional file descriptors beyond `stdin`/`stdout`/`stderr`. For example, `{stdio: ['pipe', 'pipe', 'pipe', 'pipe']}` sets a fourth file descriptor.

	@default 'pipe'
	*/
	readonly stdio?: StdioOptions<IsSync>;

	/**
	Set `result.stdout`, `result.stderr`, `result.all` and `result.stdio` as arrays of strings, splitting the subprocess' output into lines.

	This cannot be used if the `encoding` option is binary.

	@default false
	*/
	readonly lines?: Unless<IsSync, boolean>;

	/**
	Setting this to `false` resolves the promise with the error instead of rejecting it.

	@default true
	*/
	readonly reject?: boolean;

	/**
	Strip the final [newline character](https://en.wikipedia.org/wiki/Newline) from the output.

	If the `lines` option is true, this applies to each output line instead.

	@default true
	*/
	readonly stripFinalNewline?: boolean;

	/**
	If `true`, the subprocess uses both the `env` option and the current process' environment variables ([`process.env`](https://nodejs.org/api/process.html#processenv)).
	If `false`, only the `env` option is used, not `process.env`.

	@default true
	*/
	readonly extendEnv?: boolean;

	/**
	Current working directory of the subprocess.

	This is also used to resolve the `nodePath` option when it is a relative path.

	@default process.cwd()
	*/
	readonly cwd?: string | URL;

	/**
	Environment key-value pairs.

	Unless the `extendEnv` option is `false`, the subprocess also uses the current process' environment variables ([`process.env`](https://nodejs.org/api/process.html#processenv)).

	@default process.env
	*/
	readonly env?: NodeJS.ProcessEnv;

	/**
	Explicitly set the value of `argv[0]` sent to the subprocess. This will be set to `command` or `file` if not specified.
	*/
	readonly argv0?: string;

	/**
	Sets the user identity of the subprocess.
	*/
	readonly uid?: number;

	/**
	Sets the group identity of the subprocess.
	*/
	readonly gid?: number;

	/**
	If `true`, runs `command` inside of a shell. Uses `/bin/sh` on UNIX and `cmd.exe` on Windows. A different shell can be specified as a string. The shell should understand the `-c` switch on UNIX or `/d /s /c` on Windows.

	We recommend against using this option since it is:
	- not cross-platform, encouraging shell-specific syntax.
	- slower, because of the additional shell interpretation.
	- unsafe, potentially allowing command injection.

	@default false
	*/
	readonly shell?: boolean | string | URL;

	/**
	If the subprocess outputs text, specifies its character encoding, either `'utf8'` or `'utf16le'`.

	If it outputs binary data instead, this should be either:
	- `'buffer'`: returns the binary output as an `Uint8Array`.
	- `'hex'`, `'base64'`, `'base64url'`, [`'latin1'`](https://nodejs.org/api/buffer.html#buffers-and-character-encodings) or [`'ascii'`](https://nodejs.org/api/buffer.html#buffers-and-character-encodings): encodes the binary output as a string.

	The output is available with `result.stdout`, `result.stderr` and `result.stdio`.

	@default 'utf8'
	*/
	readonly encoding?: EncodingOption;

	/**
	If `timeout` is greater than `0`, the subprocess will be terminated if it runs for longer than that amount of milliseconds.

	@default 0
	*/
	readonly timeout?: number;

	/**
	Largest amount of data allowed on `stdout`, `stderr` and `stdio`.

	This is measured:
	- By default: in [characters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length).
	- If the `encoding` option is `'buffer'`: in bytes.
	- If the `lines` option is `true`: in lines.
	- If a transform in object mode is used: in objects.

	@default 100_000_000
	*/
	readonly maxBuffer?: number;

	/**
	Signal used to terminate the subprocess when:
	- using the `cancelSignal`, `timeout`, `maxBuffer` or `cleanup` option
	- calling [`subprocess.kill()`](https://nodejs.org/api/child_process.html#subprocesskillsignal) with no arguments

	This can be either a name (like `"SIGTERM"`) or a number (like `9`).

	@default 'SIGTERM'
	*/
	readonly killSignal?: string | number;

	/**
	If the subprocess is terminated but does not exit, forcefully exit it by sending [`SIGKILL`](https://en.wikipedia.org/wiki/Signal_(IPC)#SIGKILL).

	The grace period is 5 seconds by default. This feature can be disabled with `false`.

	This works when the subprocess is terminated by either:
	- the `cancelSignal`, `timeout`, `maxBuffer` or `cleanup` option
	- calling [`subprocess.kill()`](https://nodejs.org/api/child_process.html#subprocesskillsignal) with no arguments

	This does not work when the subprocess is terminated by either:
	- calling [`subprocess.kill()`](https://nodejs.org/api/child_process.html#subprocesskillsignal) with an argument
	- calling [`process.kill(subprocess.pid)`](https://nodejs.org/api/process.html#processkillpid-signal)
	- sending a termination signal from another process

	Also, this does not work on Windows, because Windows [doesn't support signals](https://nodejs.org/api/process.html#process_signal_events): `SIGKILL` and `SIGTERM` both terminate the subprocess immediately. Other packages (such as [`taskkill`](https://github.com/sindresorhus/taskkill)) can be used to achieve fail-safe termination on Windows.

	@default 5000
	*/
	forceKillAfterDelay?: Unless<IsSync, number | false>;

	/**
	If `true`, no quoting or escaping of arguments is done on Windows. Ignored on other platforms. This is set to `true` automatically when the `shell` option is `true`.

	@default false
	*/
	readonly windowsVerbatimArguments?: boolean;

	/**
	On Windows, do not create a new console window. Please note this also prevents `CTRL-C` [from working](https://github.com/nodejs/node/issues/29837) on Windows.

	@default true
	*/
	readonly windowsHide?: boolean;

	/**
	If `verbose` is `'short'` or `'full'`, prints each command on `stderr` before executing it. When the command completes, prints its duration and (if it failed) its error.

	If `verbose` is `'full'`, the command's `stdout` and `stderr` are printed too, unless either:
	- the `stdout`/`stderr` option is `ignore` or `inherit`.
	- the `stdout`/`stderr` is redirected to [a stream](https://nodejs.org/api/stream.html#readablepipedestination-options), a file, a file descriptor, or another subprocess.
	- the `encoding` option is binary.

	This can also be set to `'full'` by setting the `NODE_DEBUG=execa` environment variable in the current process.

	@default 'none'
	*/
	readonly verbose?: 'none' | 'short' | 'full';

	/**
	Kill the subprocess when the current process exits unless either:
	- the subprocess is [`detached`](https://nodejs.org/api/child_process.html#child_process_options_detached)
	- the current process is terminated abruptly, for example, with `SIGKILL` as opposed to `SIGTERM` or a normal exit

	@default true
	*/
	readonly cleanup?: Unless<IsSync, boolean>;

	/**
	Whether to return the subprocess' output using the `result.stdout`, `result.stderr`, `result.all` and `result.stdio` properties.

	On failure, the `error.stdout`, `error.stderr`, `error.all` and `error.stdio` properties are used instead.

	When `buffer` is `false`, the output can still be read using the `subprocess.stdout`, `subprocess.stderr`, `subprocess.stdio` and `subprocess.all` streams. If the output is read, this should be done right away to avoid missing any data.

	@default true
	*/
	readonly buffer?: Unless<IsSync, boolean>;

	/**
	Add an `.all` property on the promise and the resolved value. The property contains the output of the subprocess with `stdout` and `stderr` interleaved.

	@default false
	*/
	readonly all?: Unless<IsSync, boolean>;

	/**
	Enables exchanging messages with the subprocess using [`subprocess.send(value)`](https://nodejs.org/api/child_process.html#subprocesssendmessage-sendhandle-options-callback) and [`subprocess.on('message', (value) => {})`](https://nodejs.org/api/child_process.html#event-message).

	@default `true` if the `node` option is enabled, `false` otherwise
	*/
	readonly ipc?: Unless<IsSync, boolean>;

	/**
	Specify the kind of serialization used for sending messages between subprocesses when using the `ipc` option:
	- `json`: Uses `JSON.stringify()` and `JSON.parse()`.
	- `advanced`: Uses [`v8.serialize()`](https://nodejs.org/api/v8.html#v8_v8_serialize_value)

	[More info.](https://nodejs.org/api/child_process.html#child_process_advanced_serialization)

	@default 'advanced'
	*/
	readonly serialization?: Unless<IsSync, 'json' | 'advanced'>;

	/**
	Prepare subprocess to run independently of the current process. Specific behavior [depends on the platform](https://nodejs.org/api/child_process.html#child_process_options_detached).

	@default false
	*/
	readonly detached?: Unless<IsSync, boolean>;

	/**
	You can abort the subprocess using [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).

	When `AbortController.abort()` is called, `.isCanceled` becomes `true`.

	@example
	```
	import {execa} from 'execa';

	const abortController = new AbortController();
	const subprocess = execa('node', [], {cancelSignal: abortController.signal});

	setTimeout(() => {
		abortController.abort();
	}, 1000);

	try {
		await subprocess;
	} catch (error) {
		console.log(error.isTerminated); // true
		console.log(error.isCanceled); // true
	}
	```
	*/
	readonly cancelSignal?: Unless<IsSync, AbortSignal>;
};

export type Options = CommonOptions<false>;
export type SyncOptions = CommonOptions<true>;

declare abstract class CommonResult<
	IsSync extends boolean = boolean,
	OptionsType extends CommonOptions = CommonOptions,
> {
	/**
	The file and arguments that were run, for logging purposes.

	This is not escaped and should not be executed directly as a subprocess, including using `execa()` or `execaCommand()`.
	*/
	command: string;

	/**
	Same as `command` but escaped.

	Unlike `command`, control characters are escaped, which makes it safe to print in a terminal.

	This can also be copied and pasted into a shell, for debugging purposes.
	Since the escaping is fairly basic, this should not be executed directly as a subprocess, including using `execa()` or `execaCommand()`.
	*/
	escapedCommand: string;

	/**
	The numeric exit code of the subprocess that was run.

	This is `undefined` when the subprocess could not be spawned or was terminated by a signal.
	*/
	exitCode?: number;

	/**
	The output of the subprocess on `stdout`.

	This is `undefined` if the `stdout` option is set to only [`'inherit'`, `'ignore'`, `Stream` or `integer`](https://nodejs.org/api/child_process.html#child_process_options_stdio). This is an array if the `lines` option is `true`, or if the `stdout` option is a transform in object mode.
	*/
	stdout: StdioOutput<'1', OptionsType>;

	/**
	The output of the subprocess on `stderr`.

	This is `undefined` if the `stderr` option is set to only [`'inherit'`, `'ignore'`, `Stream` or `integer`](https://nodejs.org/api/child_process.html#child_process_options_stdio). This is an array if the `lines` option is `true`, or if the `stderr` option is a transform in object mode.
	*/
	stderr: StdioOutput<'2', OptionsType>;

	/**
	The output of the subprocess on `stdin`, `stdout`, `stderr` and other file descriptors.

	Items are `undefined` when their corresponding `stdio` option is set to only [`'inherit'`, `'ignore'`, `Stream` or `integer`](https://nodejs.org/api/child_process.html#child_process_options_stdio). Items are arrays when their corresponding `stdio` option is a transform in object mode.
	*/
	stdio: StdioArrayOutput<OptionsType>;

	/**
	Whether the subprocess failed to run.
	*/
	failed: boolean;

	/**
	Whether the subprocess timed out.
	*/
	timedOut: boolean;

	/**
	Whether the subprocess was terminated by a signal (like `SIGTERM`) sent by either:
	- The current process.
	- Another process. This case is [not supported on Windows](https://nodejs.org/api/process.html#signal-events).
	*/
	isTerminated: boolean;

	/**
	The name of the signal (like `SIGTERM`) that terminated the subprocess, sent by either:
	- The current process.
	- Another process. This case is [not supported on Windows](https://nodejs.org/api/process.html#signal-events).

	If a signal terminated the subprocess, this property is defined and included in the error message. Otherwise it is `undefined`.
	*/
	signal?: string;

	/**
	A human-friendly description of the signal that was used to terminate the subprocess. For example, `Floating point arithmetic error`.

	If a signal terminated the subprocess, this property is defined and included in the error message. Otherwise it is `undefined`. It is also `undefined` when the signal is very uncommon which should seldomly happen.
	*/
	signalDescription?: string;

	/**
	The current directory in which the command was run.
	*/
	cwd: string;

	/**
	Duration of the subprocess, in milliseconds.
	*/
	durationMs: number;

	/**
	Whether the subprocess was canceled using the `cancelSignal` option.
	*/
	isCanceled: boolean;

	/**
	The output of the subprocess with `stdout` and `stderr` interleaved.

	This is `undefined` if either:
	- the `all` option is `false` (default value)
	- both `stdout` and `stderr` options are set to [`'inherit'`, `'ignore'`, `Stream` or `integer`](https://nodejs.org/api/child_process.html#child_process_options_stdio)

	This is an array if the `lines` option is `true`, or if either the `stdout` or `stderr` option is a transform in object mode.
	*/
	all: Unless<IsSync, AllOutput<OptionsType>>;

	/**
	Results of the other subprocesses that were piped into this subprocess. This is useful to inspect a series of subprocesses piped with each other.

	This array is initially empty and is populated each time the `.pipe()` method resolves.
	*/
	pipedFrom: Unless<IsSync, ExecaResult[], []>;

	/**
	Error message when the subprocess failed to run. In addition to the underlying error message, it also contains some information related to why the subprocess errored.

	The subprocess `stderr`, `stdout` and other file descriptors' output are appended to the end, separated with newlines and not interleaved.
	*/
	message?: string;

	/**
	This is the same as the `message` property except it does not include the subprocess `stdout`/`stderr`/`stdio`.
	*/
	shortMessage?: string;

	/**
	Original error message. This is the same as the `message` property excluding the subprocess `stdout`/`stderr`/`stdio` and some additional information added by Execa.

	This exists only if the subprocess exited due to an `error` event or a timeout.
	*/
	originalMessage?: string;

	/**
	Underlying error, if there is one. For example, this is set by `.kill(error)`.

	This is usually an `Error` instance.
	*/
	cause?: unknown;

	/**
	Node.js-specific [error code](https://nodejs.org/api/errors.html#errorcode), when available.
	*/
	code?: string;

	// We cannot `extend Error` because `message` must be optional. So we copy its types here.
	readonly name?: Error['name'];
	stack?: Error['stack'];
}

type CommonResultInstance<
	IsSync extends boolean = boolean,
	OptionsType extends CommonOptions = CommonOptions,
> = InstanceType<typeof CommonResult<IsSync, OptionsType>>;

type SuccessResult<
	IsSync extends boolean = boolean,
	OptionsType extends CommonOptions = CommonOptions,
> = CommonResultInstance<IsSync, OptionsType> & OmitErrorIfReject<OptionsType['reject']>;

type OmitErrorIfReject<RejectOption extends CommonOptions['reject']> = RejectOption extends false
	? {}
	: {[ErrorProperty in ErrorProperties]: never};

type ErrorProperties =
  | 'name'
  | 'message'
  | 'stack'
  | 'cause'
  | 'shortMessage'
  | 'originalMessage'
  | 'code';

/**
Result of a subprocess execution.

When the subprocess fails, it is rejected with an `ExecaError` instead.
*/
export type ExecaResult<OptionsType extends Options = Options> = SuccessResult<false, OptionsType>;

/**
Result of a subprocess execution.

When the subprocess fails, it is rejected with an `ExecaError` instead.
*/
export type ExecaSyncResult<OptionsType extends SyncOptions = SyncOptions> = SuccessResult<true, OptionsType>;

declare abstract class CommonError<
	IsSync extends boolean = boolean,
	OptionsType extends CommonOptions = CommonOptions,
> extends CommonResult<IsSync, OptionsType> {
	readonly name: NonNullable<CommonResult['name']>;
	message: NonNullable<CommonResult['message']>;
	stack: NonNullable<CommonResult['stack']>;
	shortMessage: NonNullable<CommonResult['shortMessage']>;
	originalMessage: NonNullable<CommonResult['originalMessage']>;
}

/**
Exception thrown when the subprocess fails, either:
- its exit code is not `0`
- it was terminated with a signal, including `.kill()`
- timing out
- being canceled
- there's not enough memory or there are already too many subprocesses

This has the same shape as successful results, with a few additional properties.
*/
export class ExecaError<OptionsType extends Options = Options> extends CommonError<false, OptionsType> {
	readonly name: 'ExecaError';
}

/**
Exception thrown when the subprocess fails, either:
- its exit code is not `0`
- it was terminated with a signal, including `.kill()`
- timing out
- being canceled
- there's not enough memory or there are already too many subprocesses

This has the same shape as successful results, with a few additional properties.
*/
export class ExecaSyncError<OptionsType extends SyncOptions = SyncOptions> extends CommonError<true, OptionsType> {
	readonly name: 'ExecaSyncError';
}

type StreamUnlessIgnored<
	FdNumber extends string,
	OptionsType extends Options = Options,
> = SubprocessStream<FdNumber, IgnoresStreamResult<FdNumber, OptionsType>, OptionsType>;

type SubprocessStream<
	FdNumber extends string,
	StreamResultIgnored extends boolean,
	OptionsType extends Options = Options,
> = StreamResultIgnored extends true
	? null
	: InputOutputStream<IsInputStdioDescriptor<FdNumber, OptionsType>>;

type InputOutputStream<IsInput extends boolean> = IsInput extends true
	? Writable
	: Readable;

type AllStream<OptionsType extends Options = Options> = AllStreamProperty<OptionsType['all'], OptionsType>;

type AllStreamProperty<
	AllOption extends Options['all'] = Options['all'],
	OptionsType extends Options = Options,
> = AllOption extends true
	? AllIfStdout<IgnoresStreamResult<'1', OptionsType>, OptionsType>
	: undefined;

type AllIfStdout<
	StdoutResultIgnored extends boolean,
	OptionsType extends Options = Options,
> = StdoutResultIgnored extends true
	? AllIfStderr<IgnoresStreamResult<'2', OptionsType>>
	: Readable;

type AllIfStderr<StderrResultIgnored extends boolean> = StderrResultIgnored extends true
	? undefined
	: Readable;

type FileDescriptorOption = `fd${number}`;
type FromOption = 'stdout' | 'stderr' | 'all' | FileDescriptorOption;
type ToOption = 'stdin' | FileDescriptorOption;

type PipeOptions = {
	/**
	Which stream to pipe from the source subprocess. A file descriptor like `"fd3"` can also be passed.

	`"all"` pipes both `stdout` and `stderr`. This requires the `all` option to be `true`.
	*/
	readonly from?: FromOption;

	/**
	Which stream to pipe to the destination subprocess. A file descriptor like `"fd3"` can also be passed.
	*/
	readonly to?: ToOption;

	/**
	Unpipe the subprocess when the signal aborts.

	The `.pipe()` method will be rejected with a cancellation error.
	*/
	readonly unpipeSignal?: AbortSignal;
};

type PipableSubprocess = {
	/**
	[Pipe](https://nodejs.org/api/stream.html#readablepipedestination-options) the subprocess' `stdout` to a second Execa subprocess' `stdin`. This resolves with that second subprocess' result. If either subprocess is rejected, this is rejected with that subprocess' error instead.

	This follows the same syntax as `execa(file, arguments?, options?)` except both regular options and pipe-specific options can be specified.

	This can be called multiple times to chain a series of subprocesses.

	Multiple subprocesses can be piped to the same subprocess. Conversely, the same subprocess can be piped to multiple other subprocesses.
	*/
	pipe<OptionsType extends Options & PipeOptions = {}>(
		file: string | URL,
		arguments?: readonly string[],
		options?: OptionsType,
	): Promise<ExecaResult<OptionsType>> & PipableSubprocess;
	pipe<OptionsType extends Options & PipeOptions = {}>(
		file: string | URL,
		options?: OptionsType,
	): Promise<ExecaResult<OptionsType>> & PipableSubprocess;

	/**
	Like `.pipe(file, arguments?, options?)` but using a `command` template string instead. This follows the same syntax as `$`.
	*/
	pipe(templates: TemplateStringsArray, ...expressions: readonly TemplateExpression[]):
	Promise<ExecaResult<{}>> & PipableSubprocess;
	pipe<OptionsType extends Options & PipeOptions = {}>(options: OptionsType):
	(templates: TemplateStringsArray, ...expressions: readonly TemplateExpression[])
	=> Promise<ExecaResult<OptionsType>> & PipableSubprocess;

	/**
	Like `.pipe(file, arguments?, options?)` but using the return value of another `execa()` call instead.

	This is the most advanced method to pipe subprocesses. It is useful in specific cases, such as piping multiple subprocesses to the same subprocess.
	*/
	pipe<Destination extends ExecaSubprocess>(destination: Destination, options?: PipeOptions):
	Promise<Awaited<Destination>> & PipableSubprocess;
};

type ReadableOptions = {
	/**
	Which stream to read from the subprocess. A file descriptor like `"fd3"` can also be passed.

	`"all"` reads both `stdout` and `stderr`. This requires the `all` option to be `true`.

	@default 'stdout'
	*/
	readonly from?: FromOption;

	/**
	If `false`, the stream iterates over lines. Each line is a string. Also, the stream is in [object mode](https://nodejs.org/api/stream.html#object-mode).

	If `true`, the stream iterates over arbitrary chunks of data. Each line is an `Uint8Array` (with `.iterable()`) or a [`Buffer`](https://nodejs.org/api/buffer.html#class-buffer) (otherwise).

	This is always `true` when the `encoding` option is binary.

	@default `false` with `.iterable()`, `true` otherwise
	*/
	readonly binary?: boolean;

	/**
	If both this option and the `binary` option is `false`, newlines are stripped from each line.

	@default `false` with `.iterable()`, `true` otherwise
	*/
	readonly preserveNewlines?: boolean;
};

type WritableOptions = {
	/**
	Which stream to write to the subprocess. A file descriptor like `"fd3"` can also be passed.

	@default 'stdin'
	*/
	readonly to?: ToOption;
};

type DuplexOptions = ReadableOptions & WritableOptions;

type SubprocessAsyncIterable<
	BinaryOption extends boolean | undefined,
	EncodingOption extends Options['encoding'],
> = AsyncIterableIterator<
EncodingOption extends BinaryEncodingOption
	? Uint8Array
	: BinaryOption extends true
		? Uint8Array
		: string
>;

export type ExecaResultPromise<OptionsType extends Options = Options> = {
	stdin: StreamUnlessIgnored<'0', OptionsType>;

	stdout: StreamUnlessIgnored<'1', OptionsType>;

	stderr: StreamUnlessIgnored<'2', OptionsType>;

	/**
	Stream combining/interleaving [`stdout`](https://nodejs.org/api/child_process.html#child_process_subprocess_stdout) and [`stderr`](https://nodejs.org/api/child_process.html#child_process_subprocess_stderr).

	This is `undefined` if either:
	- the `all` option is `false` (the default value)
	- both `stdout` and `stderr` options are set to [`'inherit'`, `'ignore'`, `Stream` or `integer`](https://nodejs.org/api/child_process.html#child_process_options_stdio)
	*/
	all: AllStream<OptionsType>;

	catch<ResultType = never>(
		onRejected?: (reason: ExecaError<OptionsType>) => ResultType | PromiseLike<ResultType>
	): Promise<ExecaResult<OptionsType> | ResultType>;

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

	The iteration waits for the subprocess to end. It throws if the subprocess fails. This means you do not need to `await` the subprocess' promise.
	*/
	[Symbol.asyncIterator](): SubprocessAsyncIterable<undefined, OptionsType['encoding']>;

	/**
	Same as `subprocess[Symbol.asyncIterator]` except options can be provided.
	*/
	iterable<IterableOptions extends ReadableOptions = {}>(readableOptions?: IterableOptions): SubprocessAsyncIterable<IterableOptions['binary'], OptionsType['encoding']>;

	/**
	Converts the subprocess to a readable stream.

	Unlike [`subprocess.stdout`](https://nodejs.org/api/child_process.html#subprocessstdout), the stream waits for the subprocess to end and emits an [`error`](https://nodejs.org/api/stream.html#event-error) event if the subprocess fails. This means you do not need to `await` the subprocess' promise. On the other hand, you do need to handle to the stream `error` event. This can be done by using [`await finished(stream)`](https://nodejs.org/api/stream.html#streamfinishedstream-options), [`await pipeline(..., stream)`](https://nodejs.org/api/stream.html#streampipelinesource-transforms-destination-options) or [`await text(stream)`](https://nodejs.org/api/webstreams.html#streamconsumerstextstream) which throw an exception when the stream errors.

	Before using this method, please first consider the `stdin`/`stdout`/`stderr`/`stdio` options, `subprocess.pipe()` or `subprocess.iterable()`.
	*/
	readable(readableOptions?: ReadableOptions): Readable;

	/**
	Converts the subprocess to a writable stream.

	Unlike [`subprocess.stdin`](https://nodejs.org/api/child_process.html#subprocessstdin), the stream waits for the subprocess to end and emits an [`error`](https://nodejs.org/api/stream.html#event-error) event if the subprocess fails. This means you do not need to `await` the subprocess' promise. On the other hand, you do need to handle to the stream `error` event. This can be done by using [`await finished(stream)`](https://nodejs.org/api/stream.html#streamfinishedstream-options) or [`await pipeline(stream, ...)`](https://nodejs.org/api/stream.html#streampipelinesource-transforms-destination-options) which throw an exception when the stream errors.

	Before using this method, please first consider the `stdin`/`stdout`/`stderr`/`stdio` options or `subprocess.pipe()`.
	*/
	writable(writableOptions?: WritableOptions): Writable;

	/**
	Converts the subprocess to a duplex stream.

	The stream waits for the subprocess to end and emits an [`error`](https://nodejs.org/api/stream.html#event-error) event if the subprocess fails. This means you do not need to `await` the subprocess' promise. On the other hand, you do need to handle to the stream `error` event. This can be done by using [`await finished(stream)`](https://nodejs.org/api/stream.html#streamfinishedstream-options), [`await pipeline(..., stream, ...)`](https://nodejs.org/api/stream.html#streampipelinesource-transforms-destination-options) or [`await text(stream)`](https://nodejs.org/api/webstreams.html#streamconsumerstextstream) which throw an exception when the stream errors.

	Before using this method, please first consider the `stdin`/`stdout`/`stderr`/`stdio` options, `subprocess.pipe()` or `subprocess.iterable()`.
	*/
	duplex(duplexOptions?: DuplexOptions): Duplex;
} & PipableSubprocess;

export type ExecaSubprocess<OptionsType extends Options = Options> = ChildProcess &
ExecaResultPromise<OptionsType> &
Promise<ExecaResult<OptionsType>>;

type TemplateExpression = string | number | CommonResultInstance
| ReadonlyArray<string | number | CommonResultInstance>;

type TemplateString = readonly [TemplateStringsArray, ...readonly TemplateExpression[]];
type SimpleTemplateString = readonly [TemplateStringsArray, string?];

type Execa<OptionsType extends Options> = {
	<NewOptionsType extends Options = {}>(options: NewOptionsType): Execa<OptionsType & NewOptionsType>;

	(...templateString: TemplateString): ExecaSubprocess<OptionsType>;

	<NewOptionsType extends Options = {}>(
		file: string | URL,
		arguments?: readonly string[],
		options?: NewOptionsType,
	): ExecaSubprocess<OptionsType & NewOptionsType>;

	<NewOptionsType extends Options = {}>(
		file: string | URL,
		options?: NewOptionsType,
	): ExecaSubprocess<OptionsType & NewOptionsType>;
};

/**
Executes a command using `file ...arguments`.

Arguments are automatically escaped. They can contain any character, including spaces, tabs and newlines.

When `command` is a template string, it includes both the `file` and its `arguments`.

The `command` template string can inject any `${value}` with the following types: string, number, `subprocess` or an array of those types. For example: `` execa`echo one ${'two'} ${3} ${['four', 'five']}` ``. For `${subprocess}`, the subprocess's `stdout` is used.

When `command` is a template string, arguments can contain any character, but spaces, tabs and newlines must use `${}` like `` execa`echo ${'has space'}` ``.

The `command` template string can use multiple lines and indentation.

`execa(options)` can be used to return a new instance of Execa but with different default `options`. Consecutive calls are merged to previous ones. This allows setting global options or sharing options between multiple commands.

@param file - The program/script to execute, as a string or file URL
@param arguments - Arguments to pass to `file` on execution.
@returns An `ExecaSubprocess` that is both:
- a `Promise` resolving or rejecting with a `subprocessResult`.
- a [`child_process` instance](https://nodejs.org/api/child_process.html#child_process_class_childprocess) with some additional methods and properties.
@throws A `subprocessResult` error

@example <caption>Promise interface</caption>
```
import {execa} from 'execa';

const {stdout} = await execa('echo', ['unicorns']);
console.log(stdout);
//=> 'unicorns'
```

@example <caption>Global/shared options</caption>
```
import {execa as execa_} from 'execa';

const execa = execa_({verbose: 'full'});

await execa('echo', ['unicorns']);
//=> 'unicorns'
```

@example <caption>Template string interface</caption>

```
import {execa} from 'execa';

const arg = 'unicorns';
const {stdout} = await execa`echo ${arg} & rainbows!`;
console.log(stdout);
//=> 'unicorns & rainbows!'
```

@example <caption>Template string multiple arguments</caption>

```
import {execa} from 'execa';

const args = ['unicorns', '&', 'rainbows!'];
const {stdout} = await execa`echo ${args}`;
console.log(stdout);
//=> 'unicorns & rainbows!'
```

@example <caption>Template string with options</caption>

```
import {execa} from 'execa';

await execa({verbose: 'full'})`echo unicorns`;
//=> 'unicorns'
```

@example <caption>Redirect output to a file</caption>
```
import {execa} from 'execa';

// Similar to `echo unicorns > stdout.txt` in Bash
await execa('echo', ['unicorns'], {stdout: {file: 'stdout.txt'}});

// Similar to `echo unicorns 2> stdout.txt` in Bash
await execa('echo', ['unicorns'], {stderr: {file: 'stderr.txt'}});

// Similar to `echo unicorns &> stdout.txt` in Bash
await execa('echo', ['unicorns'], {stdout: {file: 'all.txt'}, stderr: {file: 'all.txt'}});
```

@example <caption>Redirect input from a file</caption>
```
import {execa} from 'execa';

// Similar to `cat < stdin.txt` in Bash
const {stdout} = await execa('cat', {inputFile: 'stdin.txt'});
console.log(stdout);
//=> 'unicorns'
```

@example <caption>Save and pipe output from a subprocess</caption>
```
import {execa} from 'execa';

const {stdout} = await execa('echo', ['unicorns'], {stdout: ['pipe', 'inherit']});
// Prints `unicorns`
console.log(stdout);
// Also returns 'unicorns'
```

@example <caption>Pipe multiple subprocesses</caption>
```
import {execa} from 'execa';

// Similar to `echo unicorns | cat` in Bash
const {stdout} = await execa('echo', ['unicorns']).pipe(execa('cat'));
console.log(stdout);
//=> 'unicorns'
```

@example <caption>Pipe with template strings</caption>
```
import {execa} from 'execa';

await execa`npm run build`
	.pipe`sort`
	.pipe`head -n2`;
```

@example <caption>Iterate over output lines</caption>
```
import {execa} from 'execa';

for await (const line of execa`npm run build`)) {
	if (line.includes('ERROR')) {
		console.log(line);
	}
}
```

@example <caption>Handling errors</caption>
```
import {execa} from 'execa';

// Catching an error
try {
	await execa('unknown', ['command']);
} catch (error) {
	console.log(error);
	/*
	ExecaError: Command failed with ENOENT: unknown command
	spawn unknown ENOENT
			at ...
			at ... {
		shortMessage: 'Command failed with ENOENT: unknown command\nspawn unknown ENOENT',
		originalMessage: 'spawn unknown ENOENT',
		command: 'unknown command',
		escapedCommand: 'unknown command',
		cwd: '/path/to/cwd',
		durationMs: 28.217566,
		failed: true,
		timedOut: false,
		isCanceled: false,
		isTerminated: false,
		code: 'ENOENT',
		stdout: '',
		stderr: '',
		stdio: [undefined, '', ''],
		pipedFrom: []
		[cause]: Error: spawn unknown ENOENT
				at ...
				at ... {
			errno: -2,
			code: 'ENOENT',
			syscall: 'spawn unknown',
			path: 'unknown',
			spawnargs: [ 'command' ]
		}
	}
	\*\/
}
```
*/
declare const execa: Execa<{}>;

type ExecaSync<OptionsType extends SyncOptions> = {
	<NewOptionsType extends SyncOptions = {}>(options: NewOptionsType): ExecaSync<OptionsType & NewOptionsType>;

	(...templateString: TemplateString): ExecaSyncResult<OptionsType>;

	<NewOptionsType extends SyncOptions = {}>(
		file: string | URL,
		arguments?: readonly string[],
		options?: NewOptionsType,
	): ExecaSyncResult<OptionsType & NewOptionsType>;

	<NewOptionsType extends SyncOptions = {}>(
		file: string | URL,
		options?: NewOptionsType,
	): ExecaSyncResult<OptionsType & NewOptionsType>;
};

/**
Same as `execa()` but synchronous.

Returns or throws a `subprocessResult`. The `subprocess` is not returned: its methods and properties are not available. This includes [`.kill()`](https://nodejs.org/api/child_process.html#subprocesskillsignal), [`.pid`](https://nodejs.org/api/child_process.html#subprocesspid), `.pipe()`, `.iterable()`, `.readable()`, `.writable()`, `.duplex()` and the [`.stdin`/`.stdout`/`.stderr`](https://nodejs.org/api/child_process.html#subprocessstdout) streams.

Cannot use the following options: `all`, `cleanup`, `buffer`, `detached`, `ipc`, `serialization`, `cancelSignal`, `forceKillAfterDelay`, `lines` and `verbose: 'full'`. Also, the `stdin`, `stdout`, `stderr` and `stdio` options cannot be a `['pipe', 'inherit']` array, [`'overlapped'`](https://nodejs.org/api/child_process.html#optionsstdio), an async iterable, an async transform, a `Duplex`, or a web stream. Node.js streams must have a file descriptor unless the `input` option is used.

@param file - The program/script to execute, as a string or file URL
@param arguments - Arguments to pass to `file` on execution.
@returns A `subprocessResult` object
@throws A `subprocessResult` error

@example <caption>Promise interface</caption>
```
import {execa} from 'execa';

const {stdout} = execaSync('echo', ['unicorns']);
console.log(stdout);
//=> 'unicorns'
```

@example <caption>Redirect input from a file</caption>
```
import {execa} from 'execa';

// Similar to `cat < stdin.txt` in Bash
const {stdout} = execaSync('cat', {inputFile: 'stdin.txt'});
console.log(stdout);
//=> 'unicorns'
```

@example <caption>Handling errors</caption>
```
import {execa} from 'execa';

// Catching an error
try {
	execaSync('unknown', ['command']);
} catch (error) {
	console.log(error);
	/*
	{
		message: 'Command failed with ENOENT: unknown command\nspawnSync unknown ENOENT',
		errno: -2,
		code: 'ENOENT',
		syscall: 'spawnSync unknown',
		path: 'unknown',
		spawnargs: ['command'],
		shortMessage: 'Command failed with ENOENT: unknown command\nspawnSync unknown ENOENT',
		originalMessage: 'spawnSync unknown ENOENT',
		command: 'unknown command',
		escapedCommand: 'unknown command',
		cwd: '/path/to/cwd',
		failed: true,
		timedOut: false,
		isCanceled: false,
		isTerminated: false,
		stdio: [],
		pipedFrom: []
	}
	\*\/
}
```
*/
declare const execaSync: ExecaSync<{}>;

type ExecaCommand<OptionsType extends Options> = {
	<NewOptionsType extends Options = {}>(options: NewOptionsType): ExecaCommand<OptionsType & NewOptionsType>;

	(...templateString: SimpleTemplateString): ExecaSubprocess<OptionsType>;

	<NewOptionsType extends Options = {}>(
		command: string,
		options?: NewOptionsType,
	): ExecaSubprocess<OptionsType & NewOptionsType>;
};

/**
`execa` with the template string syntax allows the `file` or the `arguments` to be user-defined (by injecting them with `${}`). However, if _both_ the `file` and the `arguments` are user-defined, _and_ those are supplied as a single string, then `execaCommand(command)` must be used instead.

This is only intended for very specific cases, such as a REPL. This should be avoided otherwise.

Just like `execa()`, this can bind options. It can also be run synchronously using `execaCommandSync()`.

Arguments are automatically escaped. They can contain any character, but spaces must be escaped with a backslash like `execaCommand('echo has\\ space')`.

@param command - The program/script to execute and its arguments.
@returns An `ExecaSubprocess` that is both:
- a `Promise` resolving or rejecting with a `subprocessResult`.
- a [`child_process` instance](https://nodejs.org/api/child_process.html#child_process_class_childprocess) with some additional methods and properties.
@throws A `subprocessResult` error

@example
```
import {execaCommand} from 'execa';

const {stdout} = await execaCommand('echo unicorns');
console.log(stdout);
//=> 'unicorns'
```
*/
declare const execaCommand: ExecaCommand<{}>;

type ExecaCommandSync<OptionsType extends SyncOptions> = {
	<NewOptionsType extends SyncOptions = {}>(options: NewOptionsType): ExecaCommandSync<OptionsType & NewOptionsType>;

	(...templateString: SimpleTemplateString): ExecaSyncResult<OptionsType>;

	<NewOptionsType extends SyncOptions = {}>(
		command: string,
		options?: NewOptionsType,
	): ExecaSyncResult<OptionsType & NewOptionsType>;
};

/**
Same as `execaCommand()` but synchronous.

Returns or throws a `subprocessResult`. The `subprocess` is not returned: its methods and properties are not available. This includes [`.kill()`](https://nodejs.org/api/child_process.html#subprocesskillsignal), [`.pid`](https://nodejs.org/api/child_process.html#subprocesspid), `.pipe()`, `.iterable()`, `.readable()`, `.writable()`, `.duplex()` and the [`.stdin`/`.stdout`/`.stderr`](https://nodejs.org/api/child_process.html#subprocessstdout) streams.

Cannot use the following options: `all`, `cleanup`, `buffer`, `detached`, `ipc`, `serialization`, `cancelSignal`, `forceKillAfterDelay`, `lines` and `verbose: 'full'`. Also, the `stdin`, `stdout`, `stderr` and `stdio` options cannot be a `['pipe', 'inherit']` array, [`'overlapped'`](https://nodejs.org/api/child_process.html#optionsstdio), an async iterable, an async transform, a `Duplex`, or a web stream. Node.js streams must have a file descriptor unless the `input` option is used.

@param command - The program/script to execute and its arguments.
@returns A `subprocessResult` object
@throws A `subprocessResult` error

@example
```
import {execaCommandSync} from 'execa';

const {stdout} = execaCommandSync('echo unicorns');
console.log(stdout);
//=> 'unicorns'
```
*/
declare const execaCommandSync: ExecaCommandSync<{}>;

type ExecaScriptCommon<OptionsType extends CommonOptions> = {
	<NewOptionsType extends CommonOptions = {}>(options: NewOptionsType): ExecaScript<OptionsType & NewOptionsType>;

	(...templateString: TemplateString): ExecaSubprocess<StricterOptions<OptionsType, Options>>;

	<NewOptionsType extends Options = {}>(
		file: string | URL,
		arguments?: readonly string[],
		options?: NewOptionsType,
	): ExecaSubprocess<OptionsType & NewOptionsType>;

	<NewOptionsType extends Options = {}>(
		file: string | URL,
		options?: NewOptionsType,
	): ExecaSubprocess<OptionsType & NewOptionsType>;
};

type ExecaScriptSync<OptionsType extends CommonOptions> = {
	<NewOptionsType extends SyncOptions = {}>(options: NewOptionsType): ExecaScriptSync<OptionsType & NewOptionsType>;

	(...templateString: TemplateString): ExecaSyncResult<StricterOptions<OptionsType, SyncOptions>>;

	<NewOptionsType extends SyncOptions = {}>(
		file: string | URL,
		arguments?: readonly string[],
		options?: NewOptionsType,
	): ExecaSyncResult<OptionsType & NewOptionsType>;

	<NewOptionsType extends SyncOptions = {}>(
		file: string | URL,
		options?: NewOptionsType,
	): ExecaSyncResult<OptionsType & NewOptionsType>;
};

type ExecaScript<OptionsType extends CommonOptions> = {
	sync: ExecaScriptSync<OptionsType>;
	s: ExecaScriptSync<OptionsType>;
} & ExecaScriptCommon<OptionsType>;

/**
Same as `execa()` but using the `stdin: 'inherit'` and `preferLocal: true` options.

Just like `execa()`, this can use the template string syntax or bind options. It can also be run synchronously using `$.sync()` or `$.s()`.

This is the preferred method when executing multiple commands in a script file.

@returns An `ExecaSubprocess` that is both:
	- a `Promise` resolving or rejecting with a `subprocessResult`.
	- a [`child_process` instance](https://nodejs.org/api/child_process.html#child_process_class_childprocess) with some additional methods and properties.
@throws A `subprocessResult` error

@example <caption>Basic</caption>
```
import {$} from 'execa';

const branch = await $`git branch --show-current`;
await $`dep deploy --branch=${branch}`;
```

@example <caption>Verbose mode</caption>
```
> node file.js
unicorns
rainbows

> NODE_DEBUG=execa node file.js
[19:49:00.360] [0] $ echo unicorns
unicorns
[19:49:00.383] [0] √ (done in 23ms)
[19:49:00.383] [1] $ echo rainbows
rainbows
[19:49:00.404] [1] √ (done in 21ms)
```
*/
export const $: ExecaScript<{}>;

type ExecaNode<OptionsType extends Options> = {
	<NewOptionsType extends Options = {}>(options: NewOptionsType): ExecaNode<OptionsType & NewOptionsType>;

	(...templateString: TemplateString): ExecaSubprocess<OptionsType>;

	<NewOptionsType extends Options = {}>(
		scriptPath: string | URL,
		arguments?: readonly string[],
		options?: NewOptionsType,
	): ExecaSubprocess<OptionsType & NewOptionsType>;

	<NewOptionsType extends Options = {}>(
		scriptPath: string | URL,
		options?: NewOptionsType,
	): ExecaSubprocess<OptionsType & NewOptionsType>;
};

/**
Same as `execa()` but using the `node: true` option.
Executes a Node.js file using `node scriptPath ...arguments`.

Just like `execa()`, this can use the template string syntax or bind options.

This is the preferred method when executing Node.js files.

@param scriptPath - Node.js script to execute, as a string or file URL
@param arguments - Arguments to pass to `scriptPath` on execution.
@returns An `ExecaSubprocess` that is both:
- a `Promise` resolving or rejecting with a `subprocessResult`.
- a [`child_process` instance](https://nodejs.org/api/child_process.html#child_process_class_childprocess) with some additional methods and properties.
@throws A `subprocessResult` error

@example
```
import {execaNode} from 'execa';

await execaNode('scriptPath', ['argument']);
```
*/
export const execaNode: ExecaNode<{}>;
