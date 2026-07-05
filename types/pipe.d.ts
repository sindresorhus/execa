import type {Options} from './arguments/options.js';
import type {Result} from './return/result.js';
import type {FromOption, ToOption} from './arguments/fd-options.js';
import type {ResultPromise, SubprocessResultMethods} from './subprocess/subprocess.js';
import type {IpcMethods, HasIpc} from './ipc.js';
import type {TemplateExpression} from './methods/template.js';

// `subprocess.pipe()` options
type PipeOptions = {
	/**
	Which stream to pipe from the source subprocess. A [file descriptor](https://en.wikipedia.org/wiki/File_descriptor) like `"fd3"` can also be passed.

	`"all"` pipes both `stdout` and `stderr`. This requires the `all` option to be `true`.
	*/
	readonly from?: FromOption;

	/**
	Which stream to pipe to the destination subprocess. A [file descriptor](https://en.wikipedia.org/wiki/File_descriptor) like `"fd3"` can also be passed.
	*/
	readonly to?: ToOption;

	/**
	Unpipe the subprocess when the signal aborts.
	*/
	readonly unpipeSignal?: AbortSignal;
};

// Methods forwarded from the destination subprocess to the return value of `subprocess.pipe()`, so its output can be iterated, converted to a stream, or used for IPC.
type PipeResultMethods<OptionsType extends Options> =
	& SubprocessResultMethods<OptionsType>
	& IpcMethods<HasIpc<OptionsType>, OptionsType['serialization']>;

// Same as `PipeResultMethods`, but when the destination is another `execa()` call, so its own option types are kept.
// The base `Options` is only used to compute the property names, which do not depend on the specific options.
type PipeResultMethodsFrom<Destination extends ResultPromise> = Pick<Destination, keyof PipeResultMethods<Options>>;

// `subprocess.pipe()`
export type PipableSubprocess = {
	/**
	[Pipe](https://nodejs.org/api/stream.html#readablepipedestination-options) the subprocess' `stdout` to a second Execa subprocess' `stdin`. This resolves with that second subprocess' result. If either subprocess is rejected, this is rejected with that subprocess' error instead.

	This follows the same syntax as `execa(file, arguments?, options?)` except both regular options and pipe-specific options can be specified.

	Like a subprocess, the return value can be [iterated](https://github.com/sindresorhus/execa/blob/main/docs/lines.md#progressive-splitting), [converted to a stream](https://github.com/sindresorhus/execa/blob/main/docs/streams.md#converting-a-subprocess-to-a-stream), or used for [IPC](https://github.com/sindresorhus/execa/blob/main/docs/ipc.md) with the destination subprocess.
	*/
	pipe<OptionsType extends Options & PipeOptions = {}>(
		file: string | URL,
		arguments?: readonly string[],
		options?: OptionsType,
	): Promise<Result<OptionsType>> & PipableSubprocess & PipeResultMethods<OptionsType>;
	pipe<OptionsType extends Options & PipeOptions = {}>(
		file: string | URL,
		options?: OptionsType,
	): Promise<Result<OptionsType>> & PipableSubprocess & PipeResultMethods<OptionsType>;

	/**
	Like `subprocess.pipe(file, arguments?, options?)` but using a `command` template string instead. This follows the same syntax as `$`.
	*/
	pipe(templates: TemplateStringsArray, ...expressions: readonly TemplateExpression[]):
	Promise<Result<{}>> & PipableSubprocess & PipeResultMethods<{}>;
	pipe<OptionsType extends Options & PipeOptions = {}>(options: OptionsType):
	(templates: TemplateStringsArray, ...expressions: readonly TemplateExpression[])
	=> Promise<Result<OptionsType>> & PipableSubprocess & PipeResultMethods<OptionsType>;

	/**
	Like `subprocess.pipe(file, arguments?, options?)` but using the return value of another `execa()` call instead.
	*/
	pipe<Destination extends ResultPromise>(destination: Destination, options?: PipeOptions):
	Promise<Awaited<Destination>> & PipableSubprocess & PipeResultMethodsFrom<Destination>;
};

export {};
