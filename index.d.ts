/// <reference types="node"/>
import {ChildProcess} from 'child_process';
import {Stream, Readable as ReadableStream} from 'stream';

declare namespace execa {
	type StdioOption =
		| 'pipe'
		| 'ipc'
		| 'ignore'
		| 'inherit'
		| Stream
		| number
		| undefined;

	interface CommonOptions<EncodingType> {
		/**
		Current working directory of the child process.

		@default process.cwd()
		*/
		readonly cwd?: string;

		/**
		Environment key-value pairs. Extends automatically from `process.env`. Set `extendEnv` to `false` if you don't want this.

		@default process.env
		*/
		readonly env?: NodeJS.ProcessEnv;

		/**
		Set to `false` if you don't want to extend the environment variables when providing the `env` property.

		@default true
		*/
		readonly extendEnv?: boolean;

		/**
		Explicitly set the value of `argv[0]` sent to the child process. This will be set to `command` or `file` if not specified.
		*/
		readonly argv0?: string;

		/**
		Child's [stdio](https://nodejs.org/api/child_process.html#child_process_options_stdio) configuration.

		@default 'pipe'
		*/
		readonly stdio?: 'pipe' | 'ignore' | 'inherit' | readonly StdioOption[];

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

		@default false
		*/
		readonly shell?: boolean | string;

		/**
		Strip the final [newline character](https://en.wikipedia.org/wiki/Newline) from the output.

		@default true
		*/
		readonly stripFinalNewline?: boolean;

		/**
		Prefer locally installed binaries when looking for a binary to execute.

		If you `$ npm install foo`, you can then `execa('foo')`.

		@default true
		*/
		readonly preferLocal?: boolean;

		/**
		Preferred path to find locally installed binaries in (use with `preferLocal`).

		@default process.cwd()
		*/
		readonly localDir?: string;

		/**
		Setting this to `false` resolves the promise with the error instead of rejecting it.

		@default true
		*/
		readonly reject?: boolean;

		/**
		Keep track of the spawned process and `kill` it when the parent process exits.

		@default true
		*/
		readonly cleanup?: boolean;

		/**
		Specify the character encoding used to decode the `stdout` and `stderr` output. If set to `null`, then `stdout` and `stderr` will be a `Buffer` instead of a string.

		@default 'utf8'
		*/
		readonly encoding?: EncodingType;

		/**
		If `timeout` is greater than `0`, the parent will send the signal identified by the `killSignal` property (the default is `SIGTERM`) if the child runs longer than `timeout` milliseconds.

		@default 0
		*/
		readonly timeout?: number;

		/**
		Buffer the output from the spawned process. When buffering is disabled you must consume the output of the `stdout` and `stderr` streams because the promise will not be resolved/rejected until they have completed.

		@default true
		*/
		readonly buffer?: boolean;

		/**
		Largest amount of data in bytes allowed on `stdout` or `stderr`. Default: 10MB.

		@default 10000000
		*/
		readonly maxBuffer?: number;

		/**
		Signal value to be used when the spawned process will be killed.

		@default 'SIGTERM'
		*/
		readonly killSignal?: string | number;

		/**
		Same options as [`stdio`](https://nodejs.org/dist/latest-v6.x/docs/api/child_process.html#child_process_options_stdio).

		@default 'pipe'
		*/
		readonly stdin?: StdioOption;

		/**
		Same options as [`stdio`](https://nodejs.org/dist/latest-v6.x/docs/api/child_process.html#child_process_options_stdio).

		@default 'pipe'
		*/
		readonly stdout?: StdioOption;

		/**
		Same options as [`stdio`](https://nodejs.org/dist/latest-v6.x/docs/api/child_process.html#child_process_options_stdio).

		@default 'pipe'
		*/
		readonly stderr?: StdioOption;

		/**
		If `true`, no quoting or escaping of arguments is done on Windows. Ignored on other platforms. This is set to `true` automatically when the `shell` option is `true`.

		@default false
		*/
		readonly windowsVerbatimArguments?: boolean;
	}

	interface Options<EncodingType = string> extends CommonOptions<EncodingType> {
		/**
		Write some input to the `stdin` of your binary.
		*/
		readonly input?: string | Buffer | ReadableStream;
	}

	interface SyncOptions<EncodingType = string> extends CommonOptions<EncodingType> {
		/**
		Write some input to the `stdin` of your binary.
		*/
		readonly input?: string | Buffer;
	}

	interface ForkOptions<EncodingType = string> extends CommonOptions<EncodingType> {

		/**
	 	Define the sub-process executable binary

		@default process.execPath
		 */
		readonly execPath?: string;

		/**
		Define the sub-process arguments

		@default process.execArgv
		 */
		readonly execArgv?: string[];

		/**
		If `true`, set all stdio channel to `'pipe'`
		 */
		readonly silent?: boolean;
	}

	interface ExecaReturnBase<StdoutStderrType> {
		/**
		The numeric exit code of the process that was run.
		*/
		exitCode: number;

		/**
		The textual exit code of the process that was run.
		*/
		exitCodeName: string;

		/**
		The output of the process on stdout.
		*/
		stdout: StdoutStderrType;

		/**
		The output of the process on stderr.
		*/
		stderr: StdoutStderrType;

		/**
		Whether the process failed to run.
		*/
		failed: boolean;

		/**
		The signal that was used to terminate the process.
		*/
		signal?: string;

		/**
		The command that was run.
		*/
		command: string;

		/**
		Whether the process timed out.
		*/
		timedOut: boolean;

		/**
		Whether the process was killed.
		*/
		killed: boolean;
	}

	interface ExecaSyncReturnValue<StdoutErrorType = string>
		extends ExecaReturnBase<StdoutErrorType> {
		/**
		The exit code of the process that was run.
		*/
		code: number;
	}

	interface ExecaReturnValue<StdoutErrorType = string>
		extends ExecaSyncReturnValue<StdoutErrorType> {
		/**
		The output of the process with `stdout` and `stderr` interleaved.
		*/
		all: StdoutErrorType;

		/**
		Whether the process was canceled.
		*/
		isCanceled: boolean;
	}

	interface ExecaSyncError<StdoutErrorType = string>
		extends Error,
			ExecaReturnBase<StdoutErrorType> {
		/**
		The error message.
		*/
		message: string;

		/**
		The exit code (either numeric or textual) of the process that was run.
		*/
		code: number | string;
	}

	interface ExecaError<StdoutErrorType = string>
		extends ExecaSyncError<StdoutErrorType> {
		/**
		The output of the process with `stdout` and `stderr` interleaved.
		*/
		all: StdoutErrorType;

		/**
		Whether the process was canceled.
		*/
		isCanceled: boolean;
	}

	interface ExecaChildPromise<StdoutErrorType> {
		catch<ResultType = never>(
			onRejected?: (reason: ExecaError<StdoutErrorType>) => ResultType | PromiseLike<ResultType>
		): Promise<ExecaReturnValue<StdoutErrorType> | ResultType>;

		/**
		Cancel the subprocess.

		Causes the promise to reject an error with a `.isCanceled = true` property, provided the process gets canceled. The process will not be canceled if it has already exited.
		*/
		cancel(): void;
	}

	type ExecaChildProcess<StdoutErrorType = string> = ChildProcess &
		ExecaChildPromise<StdoutErrorType> &
		Promise<ExecaReturnValue<StdoutErrorType>>;
}

declare const execa: {
	/**
	Execute a file.

	Think of this as a mix of `child_process.execFile` and `child_process.spawn`.

	@param file - The program/script to execute.
	@param arguments - Arguments to pass to `file` on execution.
	@returns A [`child_process` instance](https://nodejs.org/api/child_process.html#child_process_class_childprocess), which is enhanced to also be a `Promise` for a result `Object` with `stdout` and `stderr` properties.

	@example
	```
	import execa from 'execa';

	(async () => {
		const {stdout} = await execa('echo', ['unicorns']);
		console.log(stdout);
		//=> 'unicorns'

		// Cancelling a spawned process
		const subprocess = execa('node');
		setTimeout(() => { spawned.cancel() }, 1000);
		try {
			await subprocess;
		} catch (error) {
			console.log(subprocess.killed); // true
			console.log(error.isCanceled); // true
		}
	})();

	// Pipe the child process stdout to the current stdout
	execa('echo', ['unicorns']).stdout.pipe(process.stdout);
	```
	*/
	(
		file: string,
		arguments?: readonly string[],
		options?: execa.Options
	): execa.ExecaChildProcess;
	(
		file: string,
		arguments?: readonly string[],
		options?: execa.Options<null>
	): execa.ExecaChildProcess<Buffer>;
	(file: string, options?: execa.Options): execa.ExecaChildProcess;
	(file: string, options?: execa.Options<null>): execa.ExecaChildProcess<
		Buffer
	>;

	/**
	Same as `execa()`, but returns only `stdout`.

	@param file - The program/script to execute.
	@param arguments - Arguments to pass to `file` on execution.
	@returns The contents of the executed process' `stdout`.
	*/
	stdout(
		file: string,
		arguments?: readonly string[],
		options?: execa.Options
	): Promise<string>;
	stdout(
		file: string,
		arguments?: readonly string[],
		options?: execa.Options<null>
	): Promise<Buffer>;
	stdout(file: string, options?: execa.Options): Promise<string>;
	stdout(file: string, options?: execa.Options<null>): Promise<Buffer>;

	/**
	Same as `execa()`, but returns only `stderr`.

	@param file - The program/script to execute.
	@param arguments - Arguments to pass to `file` on execution.
	@returns The contents of the executed process' `stderr`.
	*/
	stderr(
		file: string,
		arguments?: readonly string[],
		options?: execa.Options
	): Promise<string>;
	stderr(
		file: string,
		arguments?: readonly string[],
		options?: execa.Options<null>
	): Promise<Buffer>;
	stderr(file: string, options?: execa.Options): Promise<string>;
	stderr(file: string, options?: execa.Options<null>): Promise<Buffer>;

	/**
	Execute a command through the system shell.

	Prefer `execa()` whenever possible, as it's both faster and safer.

	@param command - The command to execute.
	@returns A [`child_process` instance](https://nodejs.org/api/child_process.html#child_process_class_childprocess).

	@example
	```
	import execa from 'execa';

	(async => {
		// Run a shell command
		const {stdout} = await execa.shell('echo unicorns');
		//=> 'unicorns'

		// Catching an error
		try {
			await execa.shell('exit 3');
		} catch (error) {
			console.log(error);
			//{
			//	message: 'Command failed with exit code 3 (ESRCH): exit 3',
			//	code: 3,
			//	exitCode: 3,
			//	exitCodeName: 'ESRCH',
			//	stdout: '',
			//	stderr: '',
			//	all: '',
			//	failed: true,
			//	command: 'exit 3',
			//	timedOut: false,
			//	killed: false
			//}
		}
	})();
	```
	*/
	shell(command: string, options?: execa.Options): execa.ExecaChildProcess;
	shell(
		command: string,
		options?: execa.Options<null>
	): execa.ExecaChildProcess<Buffer>;

	/**
	Execute a file synchronously.

	This method throws an `Error` if the command fails.

	@param file - The program/script to execute.
	@param arguments - Arguments to pass to `file` on execution.
	@returns The same result object as [`child_process.spawnSync`](https://nodejs.org/api/child_process.html#child_process_child_process_spawnsync_command_args_options).
	*/
	sync(
		file: string,
		arguments?: readonly string[],
		options?: execa.SyncOptions
	): execa.ExecaSyncReturnValue;
	sync(
		file: string,
		arguments?: readonly string[],
		options?: execa.SyncOptions<null>
	): execa.ExecaSyncReturnValue<Buffer>;
	sync(file: string, options?: execa.SyncOptions): execa.ExecaSyncReturnValue;
	sync(
		file: string,
		options?: execa.SyncOptions<null>
	): execa.ExecaSyncReturnValue<Buffer>;

	/**
	Execute a command synchronously through the system shell.

	This method throws an `Error` if the command fails.

	@param command - The command to execute.
	@returns The same result object as [`child_process.spawnSync`](https://nodejs.org/api/child_process.html#child_process_child_process_spawnsync_command_args_options).

	@example
	```
	import execa from 'execa';

	try {
		execa.shellSync('exit 3');
	} catch (error) {
		console.log(error);
		//{
		//	message: 'Command failed with exit code 3 (ESRCH): exit 3',
		//	code: 3,
		//	exitCode: 3,
		//	exitCodeName: 'ESRCH',
		//	stdout: '',
		//	stderr: '',
		//	failed: true,
		//	command: 'exit 3',
		//	timedOut: false
		//}
	}
	```
	*/
	shellSync(
		command: string,
		options?: execa.Options
	): execa.ExecaSyncReturnValue;
	shellSync(
		command: string,
		options?: execa.Options<null>
	): execa.ExecaSyncReturnValue<Buffer>;

	/**
	 Run a file through a fork of the current process.

	 @param file - The program/script to execute.
	 @param arguments - Arguments to pass to `file` on execution.
	 @returns A [`child_process` instance](https://nodejs.org/api/child_process.html#child_process_class_childprocess), which is enhanced to also be a `Promise` for a result `Object` with `stdout` and `stderr` properties.
	 */
	fork(
		file: string,
		arguments?: readonly string[],
		options?: execa.Options
	): execa.ExecaChildProcess;
	fork(
		file: string,
		arguments?: readonly string[],
		options?: execa.Options<null>
	): execa.ExecaChildProcess<Buffer>;
	fork(file: string, options?: execa.Options): execa.ExecaChildProcess;
	fork(file: string, options?: execa.Options<null>): execa.ExecaChildProcess<Buffer>;
};

export = execa;
