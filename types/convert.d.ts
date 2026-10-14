import type {BinaryEncodingOption} from './arguments/encoding-option.js';
import type {Options} from './arguments/options.js';
import type {FromOption, ToOption} from './arguments/fd-options.js';
import type {IsObjectFd} from './transform/object-mode.js';

// `subprocess.readable|duplex|iterable()` options
export type ReadableOptions = {
	/**
	Which stream to read from the subprocess. A [file descriptor](https://en.wikipedia.org/wiki/File_descriptor) like `"fd3"` can also be passed.

	`"all"` reads both `stdout` and `stderr`. This requires the `all` option to be `true`.

	@default 'stdout'
	*/
	readonly from?: FromOption;

	/**
	If `false`, iterates over lines. Each line is a string.

	If `true`, iterates over arbitrary chunks of data. Each line is an [`Uint8Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) (with `subprocess.iterable()`) or a [`Buffer`](https://nodejs.org/api/buffer.html#class-buffer) (with `subprocess.readable()`/`subprocess.duplex()`).

	This is always `true` when the `encoding` option is binary.

	With a transform in object mode, each chunk is the object itself, whatever the value of this option.

	@default `false` with `subprocess.iterable()`, `true` otherwise
	*/
	readonly binary?: boolean;

	/**
	If both this option and the `binary` option is `false`, [newlines](https://en.wikipedia.org/wiki/Newline) are stripped from each line.

	@default `false` with `subprocess.iterable()`, `true` otherwise
	*/
	readonly preserveNewlines?: boolean;
};

// `subprocess.writable|duplex()` options
export type WritableOptions = {
	/**
	Which stream to write to the subprocess. A [file descriptor](https://en.wikipedia.org/wiki/File_descriptor) like `"fd3"` can also be passed.

	@default 'stdin'
	*/
	readonly to?: ToOption;
};

// `subprocess.duplex()` options
export type DuplexOptions = ReadableOptions & WritableOptions;

// `subprocess.iterable()` return value
export type SubprocessAsyncIterable<
	BinaryOption extends boolean | undefined,
	EncodingOption extends Options['encoding'],
	ObjectMode extends boolean,
> = AsyncIterableIterator<
	// Object-mode chunks are passed through unchanged, even with binary options.
	true extends ObjectMode
		? unknown
		: EncodingOption extends BinaryEncodingOption
			? Uint8Array
			: BinaryOption extends true
				? Uint8Array
				: string
>;

// `all` can yield objects from either stdout or stderr.
export type IsObjectIterable<
	From extends ReadableOptions['from'],
	OptionsType extends Options,
> = OptionsType extends Options
	? From extends 'all' ? IsObjectFd<'1' | '2', OptionsType>
		: From extends 'stderr' ? IsObjectFd<'2', OptionsType>
			: From extends `fd${infer FdNumber}` ? IsObjectFd<`${number}` extends FdNumber ? string : FdNumber, OptionsType>
				: IsObjectFd<'1', OptionsType>
	: never;

export {};
