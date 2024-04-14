import type {Readable} from 'node:stream';
import type {Unless} from '../utils';
import type {StdinOptionCommon, StdoutStderrOptionCommon, StdioOptionsProperty} from '../stdio/type';
import type {FdGenericOption} from './specific';
import type {EncodingOption} from './encoding-option';

export type CommonOptions<IsSync extends boolean = boolean> = {
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
	How to setup the subprocess' standard input. This can be:
	- `'pipe'`: Sets `subprocess.stdin` stream.
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
	How to setup the subprocess' standard output. This can be:
	- `'pipe'`: Sets `result.stdout` (as a string or `Uint8Array`) and `subprocess.stdout` (as a stream).
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
	How to setup the subprocess' standard error. This can be:
	- `'pipe'`: Sets `result.stderr` (as a string or `Uint8Array`) and `subprocess.stderr` (as a stream).
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
	readonly stdio?: StdioOptionsProperty<IsSync>;

	/**
	Set `result.stdout`, `result.stderr`, `result.all` and `result.stdio` as arrays of strings, splitting the subprocess' output into lines.

	This cannot be used if the `encoding` option is binary.

	By default, this applies to both `stdout` and `stderr`, but different values can also be passed.

	@default false
	*/
	readonly lines?: FdGenericOption<boolean>;

	/**
	Setting this to `false` resolves the promise with the error instead of rejecting it.

	@default true
	*/
	readonly reject?: boolean;

	/**
	Strip the final [newline character](https://en.wikipedia.org/wiki/Newline) from the output.

	If the `lines` option is true, this applies to each output line instead.

	By default, this applies to both `stdout` and `stderr`, but different values can also be passed.

	@default true
	*/
	readonly stripFinalNewline?: FdGenericOption<boolean>;

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

	When this threshold is hit, the subprocess fails and `error.isMaxBuffer` becomes `true`.

	This is measured:
	- By default: in [characters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length).
	- If the `encoding` option is `'buffer'`: in bytes.
	- If the `lines` option is `true`: in lines.
	- If a transform in object mode is used: in objects.

	By default, this applies to both `stdout` and `stderr`, but different values can also be passed.

	@default 100_000_000
	*/
	readonly maxBuffer?: FdGenericOption<number>;

	/**
	Signal used to terminate the subprocess when:
	- using the `cancelSignal`, `timeout`, `maxBuffer` or `cleanup` option
	- calling `subprocess.kill()` with no arguments

	This can be either a name (like `"SIGTERM"`) or a number (like `9`).

	@default 'SIGTERM'
	*/
	readonly killSignal?: string | number;

	/**
	If the subprocess is terminated but does not exit, forcefully exit it by sending [`SIGKILL`](https://en.wikipedia.org/wiki/Signal_(IPC)#SIGKILL).

	The grace period is 5 seconds by default. This feature can be disabled with `false`.

	This works when the subprocess is terminated by either:
	- the `cancelSignal`, `timeout`, `maxBuffer` or `cleanup` option
	- calling `subprocess.kill()` with no arguments

	This does not work when the subprocess is terminated by either:
	- calling `subprocess.kill()` with an argument
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

	By default, this applies to both `stdout` and `stderr`, but different values can also be passed.

	@default 'none'
	*/
	readonly verbose?: FdGenericOption<'none' | 'short' | 'full'>;

	/**
	Kill the subprocess when the current process exits unless either:
	- the subprocess is `detached`.
	- the current process is terminated abruptly, for example, with `SIGKILL` as opposed to `SIGTERM` or a normal exit.

	@default true
	*/
	readonly cleanup?: Unless<IsSync, boolean>;

	/**
	Whether to return the subprocess' output using the `result.stdout`, `result.stderr`, `result.all` and `result.stdio` properties.

	On failure, the `error.stdout`, `error.stderr`, `error.all` and `error.stdio` properties are used instead.

	When `buffer` is `false`, the output can still be read using the `subprocess.stdout`, `subprocess.stderr`, `subprocess.stdio` and `subprocess.all` streams. If the output is read, this should be done right away to avoid missing any data.

	By default, this applies to both `stdout` and `stderr`, but different values can also be passed.

	@default true
	*/
	readonly buffer?: FdGenericOption<boolean>;

	/**
	Add a `subprocess.all` stream and a `result.all` property. They contain the combined/[interleaved](#ensuring-all-output-is-interleaved) output of the subprocess' `stdout` and `stderr`.

	@default false
	*/
	readonly all?: boolean;

	/**
	Enables exchanging messages with the subprocess using `subprocess.send(message)` and `subprocess.on('message', (message) => {})`.

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
	Prepare subprocess to run independently of the current process. Specific behavior depends on the platform.

	@default false
	*/
	readonly detached?: Unless<IsSync, boolean>;

	/**
	You can abort the subprocess using [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).

	When `AbortController.abort()` is called, `result.isCanceled` becomes `true`.

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

/**
Subprocess options.

Some options are related to the subprocess output: `verbose`, `lines`, `stripFinalNewline`, `buffer`, `maxBuffer`. By default, those options apply to all file descriptors (`stdout`, `stderr`, etc.). A plain object can be passed instead to apply them to only `stdout`, `stderr`, `fd3`, etc.

@example

```
await execa('./run.js', {verbose: 'full'}) // Same value for stdout and stderr
await execa('./run.js', {verbose: {stdout: 'none', stderr: 'full'}}) // Different values
```
*/
export type Options = CommonOptions<false>;

/**
Subprocess options, with synchronous methods.

Some options are related to the subprocess output: `verbose`, `lines`, `stripFinalNewline`, `buffer`, `maxBuffer`. By default, those options apply to all file descriptors (`stdout`, `stderr`, etc.). A plain object can be passed instead to apply them to only `stdout`, `stderr`, `fd3`, etc.

@example

```
execaSync('./run.js', {verbose: 'full'}) // Same value for stdout and stderr
execaSync('./run.js', {verbose: {stdout: 'none', stderr: 'full'}}) // Different values
```
*/
export type SyncOptions = CommonOptions<true>;

export type StricterOptions<
	WideOptions extends CommonOptions,
	StrictOptions extends CommonOptions,
> = WideOptions extends StrictOptions ? WideOptions : StrictOptions;
