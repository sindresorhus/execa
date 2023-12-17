import {type ChildProcess} from 'node:child_process';
import {type Stream, type Readable, type Writable} from 'node:stream';

export type StdioOption =
	| 'pipe'
	| 'overlapped'
	| 'ipc'
	| 'ignore'
	| 'inherit'
	| Stream
	| number
	| undefined;

export type StdinOption =
	| StdioOption
	| Iterable<string | Uint8Array>
	| AsyncIterable<string | Uint8Array>
	| URL
	| string
	| ReadableStream;

export type StdoutStderrOption =
	| StdioOption
	| URL
	| string
	| WritableStream;

type EncodingOption =
  | 'utf8'
  // eslint-disable-next-line unicorn/text-encoding-identifier-case
  | 'utf-8'
  | 'utf16le'
  | 'utf-16le'
  | 'ucs2'
  | 'ucs-2'
  | 'latin1'
  | 'binary'
  | 'ascii'
  | 'hex'
  | 'base64'
  | 'base64url'
  | 'buffer'
  | undefined;
type DefaultEncodingOption = 'utf8';
type BufferEncodingOption = 'buffer';

type GetStdoutStderrType<EncodingType extends EncodingOption> =
  EncodingType extends DefaultEncodingOption ? string : Uint8Array;

export type CommonOptions<EncodingType extends EncodingOption = DefaultEncodingOption> = {
	/**
	Kill the spawned process when the parent process exits unless either:
		- the spawned process is [`detached`](https://nodejs.org/api/child_process.html#child_process_options_detached)
		- the parent process is terminated abruptly, for example, with `SIGKILL` as opposed to `SIGTERM` or a normal exit

	@default true
	*/
	readonly cleanup?: boolean;

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
	Path to the Node.js executable to use in child processes.

	This can be either an absolute path or a path relative to the `cwd` option.

	Requires `preferLocal` to be `true`.

	For example, this can be used together with [`get-node`](https://github.com/ehmicky/get-node) to run a specific Node.js version in a child process.

	@default process.execPath
	*/
	readonly execPath?: string;

	/**
	Buffer the output from the spawned process. When set to `false`, you must read the output of `stdout` and `stderr` (or `all` if the `all` option is `true`). Otherwise the returned promise will not be resolved/rejected.

	If the spawned process fails, `error.stdout`, `error.stderr`, and `error.all` will contain the buffered data.

	@default true
	*/
	readonly buffer?: boolean;

	/**
	[How to setup](https://nodejs.org/dist/latest-v6.x/docs/api/child_process.html#child_process_options_stdio) the child process' standard input. This can be:
	- `'pipe'`: sets [`childProcess.stdin`](https://nodejs.org/api/child_process.html#subprocessstdin) stream.
	- `'overlapped'`: like `'pipe'` but asynchronous on Windows.
	- `'ignore'`: do not use `stdin`.
	- `'ipc'`: sets an [IPC channel](https://nodejs.org/api/child_process.html#subprocesssendmessage-sendhandle-options-callback). You can also use `execaNode()` instead.
	- `'inherit'`: re-use the current process' `stdin`.
	- an integer: re-use a specific file descriptor from the current process.
	- a Node.js `Readable` stream. It must have an underlying file or socket, such as the streams created by the `fs`, `net` or `http` core modules.

	Unless either the synchronous methods, the `input` option or the `inputFile` option is used, the value can also be a:
	- file path. If relative, it must start with `.`.
	- file URL.
	- web [`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream).
	- [`Iterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterable_protocol) or [`AsyncIterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_async_iterator_and_async_iterable_protocols)

	@default `inherit` with `$`, `pipe` otherwise
	*/
	readonly stdin?: StdinOption;

	/**
	[How to setup](https://nodejs.org/dist/latest-v6.x/docs/api/child_process.html#child_process_options_stdio) the child process' standard output. This can be:
	- `'pipe'`: sets [`childProcess.stdout`](https://nodejs.org/api/child_process.html#subprocessstdout) stream.
	- `'overlapped'`: like `'pipe'` but asynchronous on Windows.
	- `'ignore'`: do not use `stdout`.
	- `'ipc'`: sets an [IPC channel](https://nodejs.org/api/child_process.html#subprocesssendmessage-sendhandle-options-callback). You can also use `execaNode()` instead.
	- `'inherit'`: re-use the current process' `stdout`.
	- an integer: re-use a specific file descriptor from the current process.
	- a Node.js `Writable` stream. It must have an underlying file or socket, such as the streams created by the `fs`, `net` or `http` core modules.

	Unless either synchronous methods, the value can also be a:
	- file path. If relative, it must start with `.`.
	- file URL.
	- web [`WritableStream`](https://developer.mozilla.org/en-US/docs/Web/API/WritableStream).

	@default 'pipe'
	*/
	readonly stdout?: StdoutStderrOption;

	/**
	[How to setup](https://nodejs.org/dist/latest-v6.x/docs/api/child_process.html#child_process_options_stdio) the child process' standard error. This can be:
	- `'pipe'`: sets [`childProcess.stderr`](https://nodejs.org/api/child_process.html#subprocessstderr) stream.
	- `'overlapped'`: like `'pipe'` but asynchronous on Windows.
	- `'ignore'`: do not use `stderr`.
	- `'ipc'`: sets an [IPC channel](https://nodejs.org/api/child_process.html#subprocesssendmessage-sendhandle-options-callback). You can also use `execaNode()` instead.
	- `'inherit'`: re-use the current process' `stderr`.
	- an integer: re-use a specific file descriptor from the current process.
	- a Node.js `Writable` stream. It must have an underlying file or socket, such as the streams created by the `fs`, `net` or `http` core modules.

	Unless either synchronous methods, the value can also be a:
	- file path. If relative, it must start with `.`.
	- file URL.
	- web [`WritableStream`](https://developer.mozilla.org/en-US/docs/Web/API/WritableStream).

	@default 'pipe'
	*/
	readonly stderr?: StdoutStderrOption;

	/**
	Setting this to `false` resolves the promise with the error instead of rejecting it.

	@default true
	*/
	readonly reject?: boolean;

	/**
	Add an `.all` property on the promise and the resolved value. The property contains the output of the process with `stdout` and `stderr` interleaved.

	@default false
	*/
	readonly all?: boolean;

	/**
	Strip the final [newline character](https://en.wikipedia.org/wiki/Newline) from the output.

	@default true
	*/
	readonly stripFinalNewline?: boolean;

	/**
	Set to `false` if you don't want to extend the environment variables when providing the `env` property.

	@default true
	*/
	readonly extendEnv?: boolean;

	/**
	Current working directory of the child process.

	@default process.cwd()
	*/
	readonly cwd?: string | URL;

	/**
	Environment key-value pairs. Extends automatically from `process.env`. Set `extendEnv` to `false` if you don't want this.

	@default process.env
	*/
	readonly env?: NodeJS.ProcessEnv;

	/**
	Explicitly set the value of `argv[0]` sent to the child process. This will be set to `command` or `file` if not specified.
	*/
	readonly argv0?: string;

	/**
	Like the `stdin`, `stdout` and `stderr` options but for all file descriptors at once.
	The possible values are the same except it can also be:
	- a single string, to set the same value to each standard stream.
	- an array with more than 3 values, to create more than 3 file descriptors.

	@default 'pipe'
	*/
	readonly stdio?: 'pipe' | 'overlapped' | 'ignore' | 'inherit' | readonly StdioOption[];

	/**
	Specify the kind of serialization used for sending messages between processes when using the `stdio: 'ipc'` option or `execaNode()`:
		- `json`: Uses `JSON.stringify()` and `JSON.parse()`.
		- `advanced`: Uses [`v8.serialize()`](https://nodejs.org/api/v8.html#v8_v8_serialize_value)

	[More info.](https://nodejs.org/api/child_process.html#child_process_advanced_serialization)

	@default 'json'
	*/
	readonly serialization?: 'json' | 'advanced';

	/**
	Prepare child to run independently of its parent process. Specific behavior [depends on the platform](https://nodejs.org/api/child_process.html#child_process_options_detached).

	@default false
	*/
	readonly detached?: boolean;

	/**
	Sets the user identity of the process.
	*/
	readonly uid?: number;

	/**
	Sets the group identity of the process.
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
	readonly shell?: boolean | string;

	/**
	Specify the character encoding used to decode the `stdout` and `stderr` output. If set to `'buffer'`, then `stdout` and `stderr` will be a `Uint8Array` instead of a string.

	@default 'utf8'
	*/
	readonly encoding?: EncodingType;

	/**
	If `timeout` is greater than `0`, the parent will send the signal identified by the `killSignal` property (the default is `SIGTERM`) if the child runs longer than `timeout` milliseconds.

	@default 0
	*/
	readonly timeout?: number;

	/**
	Largest amount of data in bytes allowed on `stdout` or `stderr`. Default: 100 MB.

	@default 100_000_000
	*/
	readonly maxBuffer?: number;

	/**
	Signal value to be used when the spawned process will be killed.

	@default 'SIGTERM'
	*/
	readonly killSignal?: string | number;

	/**
	You can abort the spawned process using [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).

	When `AbortController.abort()` is called, [`.isCanceled`](https://github.com/sindresorhus/execa#iscanceled) becomes `true`.

	@example
	```
	import {execa} from 'execa';

	const abortController = new AbortController();
	const subprocess = execa('node', [], {signal: abortController.signal});

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
	readonly signal?: AbortSignal;

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
	Print each command on `stderr` before executing it.

	This can also be enabled by setting the `NODE_DEBUG=execa` environment variable in the current process.

	@default false
	*/
	readonly verbose?: boolean;
};

export type Options<EncodingType extends EncodingOption = DefaultEncodingOption> = {
	/**
	Write some input to the child process' `stdin`.\
	Streams are not allowed when using the synchronous methods.

	See also the `inputFile` and `stdin` options.
	*/
	readonly input?: string | Uint8Array | Readable;

	/**
	Use a file as input to the child process' `stdin`.

	See also the `input` and `stdin` options.
	*/
	readonly inputFile?: string | URL;
} & CommonOptions<EncodingType>;

export type SyncOptions<EncodingType extends EncodingOption = DefaultEncodingOption> = {
	/**
	Write some input to the `stdin` of your binary.

	If the input is a file, use the `inputFile` option instead.
	*/
	readonly input?: string | Uint8Array;

	/**
	Use a file as input to the the `stdin` of your binary.

	If the input is not a file, use the `input` option instead.
	*/
	readonly inputFile?: string;
} & CommonOptions<EncodingType>;

export type NodeOptions<EncodingType extends EncodingOption = DefaultEncodingOption> = {
	/**
	The Node.js executable to use.

	@default process.execPath
	*/
	readonly nodePath?: string;

	/**
	List of [CLI options](https://nodejs.org/api/cli.html#cli_options) passed to the Node.js executable.

	@default process.execArgv
	*/
	readonly nodeOptions?: string[];
} & Options<EncodingType>;

type StdoutStderrAll = string | Uint8Array | undefined;

export type ExecaReturnBase<StdoutStderrType extends StdoutStderrAll> = {
	/**
	The file and arguments that were run, for logging purposes.

	This is not escaped and should not be executed directly as a process, including using `execa()` or `execaCommand()`.
	*/
	command: string;

	/**
	Same as `command` but escaped.

	This is meant to be copy and pasted into a shell, for debugging purposes.
	Since the escaping is fairly basic, this should not be executed directly as a process, including using `execa()` or `execaCommand()`.
	*/
	escapedCommand: string;

	/**
	The numeric exit code of the process that was run.
	*/
	exitCode: number;

	/**
	The output of the process on `stdout`.

	This is `undefined` if the `stdout` option is set to [`'inherit'`, `'ipc'`, `'ignore'`, `Stream` or `integer`](https://nodejs.org/dist/latest-v6.x/docs/api/child_process.html#child_process_options_stdio).
	*/
	stdout: StdoutStderrType;

	/**
	The output of the process on `stderr`.

	This is `undefined` if the `stderr` option is set to [`'inherit'`, `'ipc'`, `'ignore'`, `Stream` or `integer`](https://nodejs.org/dist/latest-v6.x/docs/api/child_process.html#child_process_options_stdio).
	*/
	stderr: StdoutStderrType;

	/**
	Whether the process failed to run.
	*/
	failed: boolean;

	/**
	Whether the process timed out.
	*/
	timedOut: boolean;

	/**
	Whether the process was terminated using either:
		- `childProcess.kill()`.
		- A signal sent by another process. This case is [not supported on Windows](https://nodejs.org/api/process.html#signal-events).
	*/
	isTerminated: boolean;

	/**
	The name of the signal (like `SIGFPE`) that terminated the process using either:
		- `childProcess.kill()`.
		- A signal sent by another process. This case is [not supported on Windows](https://nodejs.org/api/process.html#signal-events).

	If a signal terminated the process, this property is defined and included in the error message. Otherwise it is `undefined`.
	*/
	signal?: string;

	/**
	A human-friendly description of the signal that was used to terminate the process. For example, `Floating point arithmetic error`.

	If a signal terminated the process, this property is defined and included in the error message. Otherwise it is `undefined`. It is also `undefined` when the signal is very uncommon which should seldomly happen.
	*/
	signalDescription?: string;

	/**
	The `cwd` of the command if provided in the command options. Otherwise it is `process.cwd()`.
	*/
	cwd: string;
};

export type ExecaSyncReturnValue<StdoutStderrType extends StdoutStderrAll = string> = {
} & ExecaReturnBase<StdoutStderrType>;

/**
Result of a child process execution. On success this is a plain object. On failure this is also an `Error` instance.

The child process fails when:
- its exit code is not `0`
- it was terminated with a signal
- timing out
- being canceled
- there's not enough memory or there are already too many child processes
*/
export type ExecaReturnValue<StdoutStderrType extends StdoutStderrAll = string> = {
	/**
	The output of the process with `stdout` and `stderr` interleaved.

	This is `undefined` if either:
	- the `all` option is `false` (default value)
	- the synchronous methods are used
  - both `stdout` and `stderr` options are set to [`'inherit'`, `'ipc'`, `'ignore'`, `Stream` or `integer`](https://nodejs.org/dist/latest-v6.x/docs/api/child_process.html#child_process_options_stdio)
	*/
	all?: StdoutStderrType;

	/**
	Whether the process was canceled.

	You can cancel the spawned process using the [`signal`](https://github.com/sindresorhus/execa#signal-1) option.
	*/
	isCanceled: boolean;
} & ExecaSyncReturnValue<StdoutStderrType>;

export type ExecaSyncError<StdoutStderrType extends StdoutStderrAll = string> = {
	/**
	Error message when the child process failed to run. In addition to the underlying error message, it also contains some information related to why the child process errored.

	The child process `stderr` then `stdout` are appended to the end, separated with newlines and not interleaved.
	*/
	message: string;

	/**
	This is the same as the `message` property except it does not include the child process `stdout`/`stderr`.
	*/
	shortMessage: string;

	/**
	Original error message. This is the same as the `message` property except it includes neither the child process `stdout`/`stderr` nor some additional information added by Execa.

	This is `undefined` unless the child process exited due to an `error` event or a timeout.
	*/
	originalMessage?: string;
} & Error & ExecaReturnBase<StdoutStderrType>;

export type ExecaError<StdoutStderrType extends StdoutStderrAll = string> = {
	/**
	The output of the process with `stdout` and `stderr` interleaved.

	This is `undefined` if either:
	- the `all` option is `false` (default value)
	- `execaSync()` was used
	*/
	all?: StdoutStderrType;

	/**
	Whether the process was canceled.
	*/
	isCanceled: boolean;
} & ExecaSyncError<StdoutStderrType>;

export type KillOptions = {
	/**
	Milliseconds to wait for the child process to terminate before sending `SIGKILL`.

	Can be disabled with `false`.

	@default 5000
	*/
	forceKillAfterTimeout?: number | false;
};

export type ExecaChildPromise<StdoutStderrType extends StdoutStderrAll> = {
	/**
	Stream combining/interleaving [`stdout`](https://nodejs.org/api/child_process.html#child_process_subprocess_stdout) and [`stderr`](https://nodejs.org/api/child_process.html#child_process_subprocess_stderr).

	This is `undefined` if either:
		- the `all` option is `false` (the default value)
		- the synchronous methods are used
		- both `stdout` and `stderr` options are set to [`'inherit'`, `'ipc'`, `'ignore'`, `Stream` or `integer`](https://nodejs.org/dist/latest-v6.x/docs/api/child_process.html#child_process_options_stdio)
	*/
	all?: Readable;

	catch<ResultType = never>(
		onRejected?: (reason: ExecaError<StdoutStderrType>) => ResultType | PromiseLike<ResultType>
	): Promise<ExecaReturnValue<StdoutStderrType> | ResultType>;

	/**
	Same as the original [`child_process#kill()`](https://nodejs.org/api/child_process.html#child_process_subprocess_kill_signal), except if `signal` is `SIGTERM` (the default value) and the child process is not terminated after 5 seconds, force it by sending `SIGKILL`. Note that this graceful termination does not work on Windows, because Windows [doesn't support signals](https://nodejs.org/api/process.html#process_signal_events) (`SIGKILL` and `SIGTERM` has the same effect of force-killing the process immediately.) If you want to achieve graceful termination on Windows, you have to use other means, such as [`taskkill`](https://github.com/sindresorhus/taskkill).
	*/
	kill(signal?: string, options?: KillOptions): void;

	/**
	Similar to [`childProcess.kill()`](https://nodejs.org/api/child_process.html#child_process_subprocess_kill_signal). This used to be preferred when cancelling the child process execution as the error is more descriptive and [`childProcessResult.isCanceled`](#iscanceled) is set to `true`. But now this is deprecated and you should either use `.kill()` or the `signal` option when creating the child process.
	*/
	cancel(): void;

	/**
	[Pipe](https://nodejs.org/api/stream.html#readablepipedestination-options) the child process's `stdout` to `target`, which can be:
	- Another `execa()` return value
	- A writable stream
	- A file path string

	If the `target` is another `execa()` return value, it is returned. Otherwise, the original `execa()` return value is returned. This allows chaining `pipeStdout()` then `await`ing the final result.

	The `stdout` option] must be kept as `pipe`, its default value.
	*/
	pipeStdout?<Target extends ExecaChildPromise<StdoutStderrAll>>(target: Target): Target;
	pipeStdout?(target: Writable | string): ExecaChildProcess<StdoutStderrType>;

	/**
	Like `pipeStdout()` but piping the child process's `stderr` instead.

	The `stderr` option must be kept as `pipe`, its default value.
	*/
	pipeStderr?<Target extends ExecaChildPromise<StdoutStderrAll>>(target: Target): Target;
	pipeStderr?(target: Writable | string): ExecaChildProcess<StdoutStderrType>;

	/**
	Combines both `pipeStdout()` and `pipeStderr()`.

	Either the `stdout` option or the `stderr` option must be kept as `pipe`, their default value. Also, the `all` option must be set to `true`.
	*/
	pipeAll?<Target extends ExecaChildPromise<StdoutStderrAll>>(target: Target): Target;
	pipeAll?(target: Writable | string): ExecaChildProcess<StdoutStderrType>;
};

export type ExecaChildProcess<StdoutStderrType extends StdoutStderrAll = string> = ChildProcess &
ExecaChildPromise<StdoutStderrType> &
Promise<ExecaReturnValue<StdoutStderrType>>;

/**
Executes a command using `file ...arguments`. `file` is a string or a file URL. `arguments` are an array of strings. Returns a `childProcess`.

Arguments are automatically escaped. They can contain any character, including spaces.

This is the preferred method when executing single commands.

@param file - The program/script to execute, as a string or file URL
@param arguments - Arguments to pass to `file` on execution.
@returns An `ExecaChildProcess` that is both:
	- a `Promise` resolving or rejecting with a `childProcessResult`.
	- a [`child_process` instance](https://nodejs.org/api/child_process.html#child_process_class_childprocess) with some additional methods and properties.
@throws A `childProcessResult` error

@example <caption>Promise interface</caption>
```
import {execa} from 'execa';

const {stdout} = await execa('echo', ['unicorns']);
console.log(stdout);
//=> 'unicorns'
```

@example <caption>Redirect output to a file</caption>
```
import {execa} from 'execa';

// Similar to `echo unicorns > stdout.txt` in Bash
await execa('echo', ['unicorns']).pipeStdout('stdout.txt');

// Similar to `echo unicorns 2> stdout.txt` in Bash
await execa('echo', ['unicorns']).pipeStderr('stderr.txt');

// Similar to `echo unicorns &> stdout.txt` in Bash
await execa('echo', ['unicorns'], {all: true}).pipeAll('all.txt');
```

@example <caption>Redirect input from a file</caption>
```
import {execa} from 'execa';

// Similar to `cat < stdin.txt` in Bash
const {stdout} = await execa('cat', {inputFile: 'stdin.txt'});
console.log(stdout);
//=> 'unicorns'
```

@example <caption>Save and pipe output from a child process</caption>
```
import {execa} from 'execa';

const {stdout} = await execa('echo', ['unicorns']).pipeStdout(process.stdout);
// Prints `unicorns`
console.log(stdout);
// Also returns 'unicorns'
```

@example <caption>Pipe multiple processes</caption>
```
import {execa} from 'execa';

// Similar to `echo unicorns | cat` in Bash
const {stdout} = await execa('echo', ['unicorns']).pipeStdout(execa('cat'));
console.log(stdout);
//=> 'unicorns'
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
	{
		message: 'Command failed with ENOENT: unknown command spawn unknown ENOENT',
		errno: -2,
		code: 'ENOENT',
		syscall: 'spawn unknown',
		path: 'unknown',
		spawnargs: ['command'],
		originalMessage: 'spawn unknown ENOENT',
		shortMessage: 'Command failed with ENOENT: unknown command spawn unknown ENOENT',
		command: 'unknown command',
		escapedCommand: 'unknown command',
		stdout: '',
		stderr: '',
		failed: true,
		timedOut: false,
		isCanceled: false,
		isTerminated: false,
		cwd: '/path/to/cwd'
	}
	\*\/
}
```

@example <caption>Graceful termination</caption>
```
const subprocess = execa('node');

setTimeout(() => {
	subprocess.kill('SIGTERM', {
		forceKillAfterTimeout: 2000
	});
}, 1000);
```
*/
export function execa<EncodingType extends EncodingOption = DefaultEncodingOption>(
	file: string | URL,
	arguments?: readonly string[],
	options?: Options<EncodingType>
): ExecaChildProcess<GetStdoutStderrType<EncodingType>>;
export function execa<EncodingType extends EncodingOption = DefaultEncodingOption>(
	file: string | URL,
	options?: Options<EncodingType>
): ExecaChildProcess<GetStdoutStderrType<EncodingType>>;

/**
Same as `execa()` but synchronous.

@param file - The program/script to execute, as a string or file URL
@param arguments - Arguments to pass to `file` on execution.
@returns A `childProcessResult` object
@throws A `childProcessResult` error

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
		message: 'Command failed with ENOENT: unknown command spawnSync unknown ENOENT',
		errno: -2,
		code: 'ENOENT',
		syscall: 'spawnSync unknown',
		path: 'unknown',
		spawnargs: ['command'],
		originalMessage: 'spawnSync unknown ENOENT',
		shortMessage: 'Command failed with ENOENT: unknown command spawnSync unknown ENOENT',
		command: 'unknown command',
		escapedCommand: 'unknown command',
		stdout: '',
		stderr: '',
		failed: true,
		timedOut: false,
		isCanceled: false,
		isTerminated: false,
		cwd: '/path/to/cwd'
	}
	\*\/
}
```
*/
export function execaSync<EncodingType extends EncodingOption = DefaultEncodingOption>(
	file: string | URL,
	arguments?: readonly string[],
	options?: SyncOptions<EncodingType>
): ExecaSyncReturnValue<GetStdoutStderrType<EncodingType>>;
export function execaSync<EncodingType extends EncodingOption = DefaultEncodingOption>(
	file: string | URL,
	options?: SyncOptions<EncodingType>
): ExecaSyncReturnValue<GetStdoutStderrType<EncodingType>>;

/**
Executes a command. The `command` string includes both the `file` and its `arguments`. Returns a `childProcess`.

Arguments are automatically escaped. They can contain any character, but spaces must be escaped with a backslash like `execaCommand('echo has\\ space')`.

This is the preferred method when executing a user-supplied `command` string, such as in a REPL.

@param command - The program/script to execute and its arguments.
@returns An `ExecaChildProcess` that is both:
	- a `Promise` resolving or rejecting with a `childProcessResult`.
	- a [`child_process` instance](https://nodejs.org/api/child_process.html#child_process_class_childprocess) with some additional methods and properties.
@throws A `childProcessResult` error

@example
```
import {execaCommand} from 'execa';

const {stdout} = await execaCommand('echo unicorns');
console.log(stdout);
//=> 'unicorns'
```
*/
export function execaCommand<EncodingType extends EncodingOption = DefaultEncodingOption>(
	command: string, options?: Options<EncodingType>
): ExecaChildProcess<GetStdoutStderrType<EncodingType>>;

/**
Same as `execaCommand()` but synchronous.

@param command - The program/script to execute and its arguments.
@returns A `childProcessResult` object
@throws A `childProcessResult` error

@example
```
import {execaCommandSync} from 'execa';

const {stdout} = execaCommandSync('echo unicorns');
console.log(stdout);
//=> 'unicorns'
```
*/
export function execaCommandSync<EncodingType extends EncodingOption = DefaultEncodingOption>(
	command: string, options?: SyncOptions<EncodingType>
): ExecaSyncReturnValue<GetStdoutStderrType<EncodingType>>;

type TemplateExpression =
	| string
	| number
	| ExecaReturnValue<string | Uint8Array>
	| ExecaSyncReturnValue<string | Uint8Array>
	| Array<string | number | ExecaReturnValue<string | Uint8Array> | ExecaSyncReturnValue<string | Uint8Array>>;

type Execa$<StdoutStderrType extends StdoutStderrAll = string> = {
	/**
	Returns a new instance of `$` but with different default `options`. Consecutive calls are merged to previous ones.

	This can be used to either:
		- Set options for a specific command: `` $(options)`command` ``
		- Share options for multiple commands: `` const $$ = $(options); $$`command`; $$`otherCommand` ``

	@param options - Options to set
	@returns A new instance of `$` with those `options` set

	@example
	```
	import {$} from 'execa';

	const $$ = $({stdio: 'inherit'});

	await $$`echo unicorns`;
	//=> 'unicorns'

	await $$`echo rainbows`;
	//=> 'rainbows'
	```
	*/
	(options: Options<undefined>): Execa$<StdoutStderrType>;
	(options: Options): Execa$;
	(options: Options<BufferEncodingOption>): Execa$<Uint8Array>;
	(
		templates: TemplateStringsArray,
		...expressions: TemplateExpression[]
	): ExecaChildProcess<StdoutStderrType>;

	/**
	Same as $\`command\` but synchronous.

	@returns A `childProcessResult` object
	@throws A `childProcessResult` error

	@example <caption>Basic</caption>
	```
	import {$} from 'execa';

	const branch = $.sync`git branch --show-current`;
	$.sync`dep deploy --branch=${branch}`;
	```

	@example <caption>Multiple arguments</caption>
	```
	import {$} from 'execa';

	const args = ['unicorns', '&', 'rainbows!'];
	const {stdout} = $.sync`echo ${args}`;
	console.log(stdout);
	//=> 'unicorns & rainbows!'
	```

	@example <caption>With options</caption>
	```
	import {$} from 'execa';

	$.sync({stdio: 'inherit'})`echo unicorns`;
	//=> 'unicorns'
	```

	@example <caption>Shared options</caption>
	```
	import {$} from 'execa';

	const $$ = $({stdio: 'inherit'});

	$$.sync`echo unicorns`;
	//=> 'unicorns'

	$$.sync`echo rainbows`;
	//=> 'rainbows'
	```
	*/
	sync(
		templates: TemplateStringsArray,
		...expressions: TemplateExpression[]
	): ExecaSyncReturnValue<StdoutStderrType>;

	/**
	Same as $\`command\` but synchronous.

	@returns A `childProcessResult` object
	@throws A `childProcessResult` error

	@example <caption>Basic</caption>
	```
	import {$} from 'execa';

	const branch = $.s`git branch --show-current`;
	$.s`dep deploy --branch=${branch}`;
	```

	@example <caption>Multiple arguments</caption>
	```
	import {$} from 'execa';

	const args = ['unicorns', '&', 'rainbows!'];
	const {stdout} = $.s`echo ${args}`;
	console.log(stdout);
	//=> 'unicorns & rainbows!'
	```

	@example <caption>With options</caption>
	```
	import {$} from 'execa';

	$.s({stdio: 'inherit'})`echo unicorns`;
	//=> 'unicorns'
	```

	@example <caption>Shared options</caption>
	```
	import {$} from 'execa';

	const $$ = $({stdio: 'inherit'});

	$$.s`echo unicorns`;
	//=> 'unicorns'

	$$.s`echo rainbows`;
	//=> 'rainbows'
	```
	*/
	s(
		templates: TemplateStringsArray,
		...expressions: TemplateExpression[]
	): ExecaSyncReturnValue<StdoutStderrType>;
};

/**
Executes a command. The `command` string includes both the `file` and its `arguments`. Returns a `childProcess`.

Arguments are automatically escaped. They can contain any character, but spaces must use `${}` like `` $`echo ${'has space'}` ``.

This is the preferred method when executing multiple commands in a script file.

The `command` string can inject any `${value}` with the following types: string, number, `childProcess` or an array of those types. For example: `` $`echo one ${'two'} ${3} ${['four', 'five']}` ``. For `${childProcess}`, the process's `stdout` is used.

@returns An `ExecaChildProcess` that is both:
	- a `Promise` resolving or rejecting with a `childProcessResult`.
	- a [`child_process` instance](https://nodejs.org/api/child_process.html#child_process_class_childprocess) with some additional methods and properties.
@throws A `childProcessResult` error

@example <caption>Basic</caption>
```
import {$} from 'execa';

const branch = await $`git branch --show-current`;
await $`dep deploy --branch=${branch}`;
```

@example <caption>Multiple arguments</caption>
```
import {$} from 'execa';

const args = ['unicorns', '&', 'rainbows!'];
const {stdout} = await $`echo ${args}`;
console.log(stdout);
//=> 'unicorns & rainbows!'
```

@example <caption>With options</caption>
```
import {$} from 'execa';

await $({stdio: 'inherit'})`echo unicorns`;
//=> 'unicorns'
```

@example <caption>Shared options</caption>
```
import {$} from 'execa';

const $$ = $({stdio: 'inherit'});

await $$`echo unicorns`;
//=> 'unicorns'

await $$`echo rainbows`;
//=> 'rainbows'
```
*/
export const $: Execa$;

/**
Executes a Node.js file using `node scriptPath ...arguments`. `file` is a string or a file URL. `arguments` are an array of strings. Returns a `childProcess`.

Arguments are automatically escaped. They can contain any character, including spaces.

This is the preferred method when executing Node.js files.

Like [`child_process#fork()`](https://nodejs.org/api/child_process.html#child_process_child_process_fork_modulepath_args_options):
  - the current Node version and options are used. This can be overridden using the `nodePath` and `nodeOptions` options.
  - the `shell` option cannot be used
  - an extra channel [`ipc`](https://nodejs.org/api/child_process.html#child_process_options_stdio) is passed to `stdio`

@param scriptPath - Node.js script to execute, as a string or file URL
@param arguments - Arguments to pass to `scriptPath` on execution.
@returns An `ExecaChildProcess` that is both:
	- a `Promise` resolving or rejecting with a `childProcessResult`.
	- a [`child_process` instance](https://nodejs.org/api/child_process.html#child_process_class_childprocess) with some additional methods and properties.
@throws A `childProcessResult` error

@example
```
import {execa} from 'execa';

await execaNode('scriptPath', ['argument']);
```
*/
export function execaNode<EncodingType extends EncodingOption = DefaultEncodingOption>(
	scriptPath: string | URL,
	arguments?: readonly string[],
	options?: NodeOptions<EncodingType>
): ExecaChildProcess<GetStdoutStderrType<EncodingType>>;
export function execaNode<EncodingType extends EncodingOption = DefaultEncodingOption>(
	scriptPath: string | URL,
	options?: NodeOptions<EncodingType>
): ExecaChildProcess<GetStdoutStderrType<EncodingType>>;
