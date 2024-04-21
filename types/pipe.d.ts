import type {Options} from './arguments/options';
import type {ExecaResult} from './return/result';
import type {FromOption, ToOption} from './arguments/fd-options';
import type {ExecaSubprocess} from './subprocess/subprocess';
import type {TemplateExpression} from './methods/template';

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

// `subprocess.pipe()`
export type PipableSubprocess = {
	/**
	[Pipe](https://nodejs.org/api/stream.html#readablepipedestination-options) the subprocess' `stdout` to a second Execa subprocess' `stdin`. This resolves with that second subprocess' result. If either subprocess is rejected, this is rejected with that subprocess' error instead.

	This follows the same syntax as `execa(file, arguments?, options?)` except both regular options and pipe-specific options can be specified.
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
	Like `subprocess.pipe(file, arguments?, options?)` but using a `command` template string instead. This follows the same syntax as `$`.
	*/
	pipe(templates: TemplateStringsArray, ...expressions: readonly TemplateExpression[]):
	Promise<ExecaResult<{}>> & PipableSubprocess;
	pipe<OptionsType extends Options & PipeOptions = {}>(options: OptionsType):
	(templates: TemplateStringsArray, ...expressions: readonly TemplateExpression[])
	=> Promise<ExecaResult<OptionsType>> & PipableSubprocess;

	/**
	Like `subprocess.pipe(file, arguments?, options?)` but using the return value of another `execa()` call instead.
	*/
	pipe<Destination extends ExecaSubprocess>(destination: Destination, options?: PipeOptions):
	Promise<Awaited<Destination>> & PipableSubprocess;
};
