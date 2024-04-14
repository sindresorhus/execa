import type {Unless} from '../utils';
import type {CommonOptions, Options, SyncOptions} from '../arguments/options';
import type {ErrorProperties} from './final-error';
import type {ResultAll} from './result-all';
import type {ResultStdioArray} from './result-stdio';
import type {ResultStdioNotAll} from './result-stdout';

export declare abstract class CommonResult<
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

	This is `undefined` if the `stdout` option is set to only `'inherit'`, `'ignore'`, `Writable` or `integer`. This is an array if the `lines` option is `true`, or if the `stdout` option is a transform in object mode.
	*/
	stdout: ResultStdioNotAll<'1', OptionsType>;

	/**
	The output of the subprocess on `stderr`.

	This is `undefined` if the `stderr` option is set to only `'inherit'`, `'ignore'`, `Writable` or `integer`. This is an array if the `lines` option is `true`, or if the `stderr` option is a transform in object mode.
	*/
	stderr: ResultStdioNotAll<'2', OptionsType>;

	/**
	The output of the subprocess on `stdin`, `stdout`, `stderr` and other file descriptors.

	Items are `undefined` when their corresponding `stdio` option is set to only `'inherit'`, `'ignore'`, `Writable` or `integer`. Items are arrays when their corresponding `stdio` option is a transform in object mode.
	*/
	stdio: ResultStdioArray<OptionsType>;

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
	Whether the subprocess failed because its output was larger than the `maxBuffer` option.
	*/
	isMaxBuffer: boolean;

	/**
	The output of the subprocess with `result.stdout` and `result.stderr` interleaved.

	This is `undefined` if either:
	- the `all` option is `false` (default value).
	- both `stdout` and `stderr` options are set to `'inherit'`, `'ignore'`, `Writable` or `integer`.

	This is an array if the `lines` option is `true`, or if either the `stdout` or `stderr` option is a transform in object mode.
	*/
	all: ResultAll<OptionsType>;

	/**
	Results of the other subprocesses that were piped into this subprocess. This is useful to inspect a series of subprocesses piped with each other.

	This array is initially empty and is populated each time the `subprocess.pipe()` method resolves.
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
	Underlying error, if there is one. For example, this is set by `subprocess.kill(error)`.

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

export type CommonResultInstance<
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
