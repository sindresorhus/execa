/// <reference types="node"/>
import {ChildProcess} from 'child_process';
import {Stream, Readable as ReadableStream} from 'stream';

export type StdIOOption =
	| 'pipe'
	| 'ipc'
	| 'ignore'
	| 'inherit'
	| Stream
	| number
	| null
	| undefined;

export interface CommonOptions<EncodingType> {
	/**
	 * Current working directory of the child process.
	 *
	 * @default process.cwd()
	 */
	readonly cwd?: string;

	/**
	 * Environment key-value pairs. Extends automatically from `process.env`. Set `extendEnv` to `false` if you don't want this.
	 *
	 * @default process.env
	 */
	readonly env?: NodeJS.ProcessEnv;

	/**
	 * Set to `false` if you don't want to extend the environment variables when providing the `env` property.
	 *
	 * @default true
	 */
	readonly extendEnv?: boolean;

	/**
	 * Explicitly set the value of `argv[0]` sent to the child process. This will be set to `command` or `file` if not specified.
	 */
	readonly argv0?: string;

	/**
	 * Child's [stdio](https://nodejs.org/api/child_process.html#child_process_options_stdio) configuration.
	 *
	 * @default 'pipe'
	 */
	readonly stdio?: 'pipe' | 'ignore' | 'inherit' | ReadonlyArray<StdIOOption>;

	/**
	 * Prepare child to run independently of its parent process. Specific behavior [depends on the platform](https://nodejs.org/api/child_process.html#child_process_options_detached).
	 */
	readonly detached?: boolean;

	/**
	 * Sets the user identity of the process.
	 */
	readonly uid?: number;

	/**
	 * Sets the group identity of the process.
	 */
	readonly gid?: number;

	/**
	 * If `true`, runs `command` inside of a shell. Uses `/bin/sh` on UNIX and `cmd.exe` on Windows. A different shell can be specified as a string. The shell should understand the `-c` switch on UNIX or `/d /s /c` on Windows.
	 *
	 * @default false
	 */
	readonly shell?: boolean | string;

	/**
	 * Strip the final [newline character](https://en.wikipedia.org/wiki/Newline) from the output.
	 *
	 * @default true
	 */
	readonly stripFinalNewline?: boolean;

	/**
	 * Prefer locally installed binaries when looking for a binary to execute.
	 *
	 * If you `$ npm install foo`, you can then `execa('foo')`.
	 *
	 * @default true
	 */
	readonly preferLocal?: boolean;

	/**
	 * Preferred path to find locally installed binaries in (use with `preferLocal`).
	 *
	 * @default process.cwd()
	 */
	readonly localDir?: string;

	/**
	 * Setting this to `false` resolves the promise with the error instead of rejecting it.
	 *
	 * @default true
	 */
	readonly reject?: boolean;

	/**
	 * Keep track of the spawned process and `kill` it when the parent process exits.
	 *
	 * @default true
	 */
	readonly cleanup?: boolean;

	/**
	 * Specify the character encoding used to decode the `stdout` and `stderr` output. If set to `null`, then `stdout` and `stderr` will be a `Buffer` instead of a string.
	 *
	 * @default 'utf8'
	 */
	readonly encoding?: EncodingType;

	/**
	 * If `timeout` is greater than `0`, the parent will send the signal identified by the `killSignal` property (the default is `SIGTERM`) if the child runs longer than `timeout` milliseconds.
	 *
	 * @default 0
	 */
	readonly timeout?: number;

	/**
	 * Buffer the output from the spawned process. When buffering is disabled you must consume the output of the `stdout` and `stderr` streams because the promise will not be resolved/rejected until they have completed.
	 *
	 * @default true
	 */
	readonly buffer?: boolean;

	/**
	 * Largest amount of data in bytes allowed on `stdout` or `stderr`. Default: 10MB.
	 *
	 * @default 10000000
	 */
	readonly maxBuffer?: number;

	/**
	 * Signal value to be used when the spawned process will be killed.
	 *
	 * @default 'SIGTERM'
	 */
	readonly killSignal?: string | number;

	/**
	 * Same options as [`stdio`](https://nodejs.org/dist/latest-v6.x/docs/api/child_process.html#child_process_options_stdio).
	 *
	 * @default 'pipe'
	 */
	readonly stdin?: StdIOOption;

	/**
	 * Same options as [`stdio`](https://nodejs.org/dist/latest-v6.x/docs/api/child_process.html#child_process_options_stdio).
	 *
	 * @default 'pipe'
	 */
	readonly stdout?: StdIOOption;

	/**
	 * Same options as [`stdio`](https://nodejs.org/dist/latest-v6.x/docs/api/child_process.html#child_process_options_stdio).
	 *
	 * @default 'pipe'
	 */
	readonly stderr?: StdIOOption;

	/**
	 * If `true`, no quoting or escaping of arguments is done on Windows. Ignored on other platforms. This is set to `true` automatically when the `shell` option is `true`.
	 *
	 * @default false
	 */
	readonly windowsVerbatimArguments?: boolean;
}

export interface Options<EncodingType = string>
	extends CommonOptions<EncodingType> {
	/**
	 * Write some input to the `stdin` of your binary.
	 */
	readonly input?: string | Buffer | ReadableStream;
}

export interface SyncOptions<EncodingType = string>
	extends CommonOptions<EncodingType> {
	/**
	 * Write some input to the `stdin` of your binary.
	 */
	readonly input?: string | Buffer;
}

export interface ExecaReturnBase<StdOutErrType> {
	/**
	 * The numeric exit code of the process that was run.
	 */
	exitCode: number;

	/**
	 * The textual exit code of the process that was run.
	 */
	exitCodeName: string;

	/**
	 * The output of the process on stdout.
	 */
	stdout: StdOutErrType;

	/**
	 * The output of the process on stderr.
	 */
	stderr: StdOutErrType;

	/**
	 * Whether the process failed to run.
	 */
	failed: boolean;

	/**
	 * The signal that was used to terminate the process.
	 */
	signal: string | null;

	/**
	 * The command that was run.
	 */
	cmd: string;

	/**
	 * Whether the process timed out.
	 */
	timedOut: boolean;

	/**
	 * Whether the process was killed.
	 */
	killed: boolean;
}

export interface ExecaSyncReturnValue<StdOutErrType = string>
	extends ExecaReturnBase<StdOutErrType> {
	/**
	 * The exit code of the process that was run.
	 */
	code: number;
}

export interface ExecaReturnValue<StdOutErrType = string>
	extends ExecaSyncReturnValue<StdOutErrType> {
	/**
	 * The output of the process with `stdout` and `stderr` interleaved.
	 */
	all: StdOutErrType;
}

export interface ExecaSyncError<StdOutErrType = string>
	extends Error,
		ExecaReturnBase<StdOutErrType> {
	/**
	 * The error message.
	 */
	message: string;

	/**
	 * The exit code (either numeric or textual) of the process that was run.
	 */
	code: number | string;
}

export interface ExecaError<StdOutErrType = string>
	extends ExecaSyncError<StdOutErrType> {
	/**
	 * The output of the process with `stdout` and `stderr` interleaved.
	 */
	all: StdOutErrType;
}

export interface ExecaChildPromise<StdOutErrType> {
	catch<ResultType = never>(
		onrejected?:
			| ((
					reason: ExecaError<StdOutErrType>
			  ) => ResultType | PromiseLike<ResultType>)
			| null
	): Promise<ExecaReturnValue<StdOutErrType> | ResultType>;
}

export type ExecaChildProcess<StdOutErrType = string> = ChildProcess &
	ExecaChildPromise<StdOutErrType> &
	Promise<ExecaReturnValue<StdOutErrType>>;

declare const execa: {
	/**
	 * Execute a file.
	 *
	 * Think of this as a mix of `child_process.execFile` and `child_process.spawn`.
	 *
	 * @param file - The program/script to execute.
	 * @param arguments - Arguments to pass to `file` on execution.
	 * @returns A [`child_process` instance](https://nodejs.org/api/child_process.html#child_process_class_childprocess), which is enhanced to also be a `Promise` for a result `Object` with `stdout` and `stderr` properties.
	 */
	(
		file: string,
		arguments?: ReadonlyArray<string>,
		options?: Options
	): ExecaChildProcess;
	(
		file: string,
		arguments?: ReadonlyArray<string>,
		options?: Options<null>
	): ExecaChildProcess<Buffer>;
	(file: string, options?: Options): ExecaChildProcess;
	(file: string, options?: Options<null>): ExecaChildProcess<Buffer>;

	/**
	 * Same as `execa()`, but returns only `stdout`.
	 *
	 * @param file - The program/script to execute.
	 * @param arguments - Arguments to pass to `file` on execution.
	 * @returns A `Promise` that will be resolved with the contents of executed processe's `stdout` contents.
	 */
	stdout(
		file: string,
		arguments?: ReadonlyArray<string>,
		options?: Options
	): Promise<string>;
	stdout(
		file: string,
		arguments?: ReadonlyArray<string>,
		options?: Options<null>
	): Promise<Buffer>;
	stdout(file: string, options?: Options): Promise<string>;
	stdout(file: string, options?: Options<null>): Promise<Buffer>;

	/**
	 * Same as `execa()`, but returns only `stderr`.
	 *
	 * @param file - The program/script to execute.
	 * @param arguments - Arguments to pass to `file` on execution.
	 * @returns A `Promise` that will be resolved with the contents of executed processe's `stderr` contents.
	 */
	stderr(
		file: string,
		arguments?: ReadonlyArray<string>,
		options?: Options
	): Promise<string>;
	stderr(
		file: string,
		arguments?: ReadonlyArray<string>,
		options?: Options<null>
	): Promise<Buffer>;
	stderr(file: string, options?: Options): Promise<string>;
	stderr(file: string, options?: Options<null>): Promise<Buffer>;

	/**
	 * Execute a command through the system shell.
	 *
	 * Prefer `execa()` whenever possible, as it's both faster and safer.
	 *
	 * @param command - The command to execute.
	 * @returns A [`child_process` instance](https://nodejs.org/api/child_process.html#child_process_class_childprocess).
	 */
	shell(command: string, options?: Options): ExecaChildProcess;
	shell(command: string, options?: Options<null>): ExecaChildProcess<Buffer>;

	/**
	 * Execute a file synchronously.
	 *
	 * This method throws an `Error` if the command fails.
	 *
	 * @param file - The program/script to execute.
	 * @param arguments - Arguments to pass to `file` on execution.
	 * @returns The same result object as [`child_process.spawnSync`](https://nodejs.org/api/child_process.html#child_process_child_process_spawnsync_command_args_options).
	 */
	sync(
		file: string,
		arguments?: ReadonlyArray<string>,
		options?: SyncOptions
	): ExecaSyncReturnValue;
	sync(
		file: string,
		arguments?: ReadonlyArray<string>,
		options?: SyncOptions<null>
	): ExecaSyncReturnValue<Buffer>;
	sync(file: string, options?: SyncOptions): ExecaSyncReturnValue;
	sync(file: string, options?: SyncOptions<null>): ExecaSyncReturnValue<Buffer>;

	/**
	 * Execute a command synchronously through the system shell.
	 *
	 * This method throws an `Error` if the command fails.
	 *
	 * @param command - The command to execute.
	 * @returns The same result object as [`child_process.spawnSync`](https://nodejs.org/api/child_process.html#child_process_child_process_spawnsync_command_args_options).
	 */
	shellSync(command: string, options?: Options): ExecaSyncReturnValue;
	shellSync(
		command: string,
		options?: Options<null>
	): ExecaSyncReturnValue<Buffer>;
};

export default execa;
