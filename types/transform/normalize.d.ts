import type {TransformStream} from 'node:stream/web';
import type {Duplex} from 'node:stream';
import type {Unless} from '../utils.js';

// `options.std*: Generator`
// The `chunk` argument's type is based on the transform's mode:
// - `binary: true` or binary `encoding`, with `objectMode: true` -> `unknown` for stdin, `Uint8Array` for stdout/stderr
// - `binary: true` or binary `encoding` -> `Uint8Array`
// - `objectMode: true` -> `unknown` for stdin, `string` for stdout/stderr
// - otherwise -> `string`
// The return type is kept as `unknown` since a transform can always yield either a `string` or an `Uint8Array`.
// See https://github.com/sindresorhus/execa/issues/694
export type GeneratorTransform<IsSync extends boolean, Chunk = string> = (chunk: Chunk) =>
	| Unless<IsSync, AsyncGenerator<unknown, void, void>>
	| Generator<unknown, void, void>;
type GeneratorTransformReturn<IsSync extends boolean> = ReturnType<GeneratorTransform<IsSync>>;
type GeneratorFinal<IsSync extends boolean> = () =>
	| Unless<IsSync, AsyncGenerator<unknown, void, void>>
	| Generator<unknown, void, void>;

export type TransformCommon = {
	/**
	If `true`, allow `transformOptions.transform` and `transformOptions.final` to return any type, not just `string` or `Uint8Array`.
	*/
	readonly objectMode?: boolean;
};

// A `GeneratorTransformFull` shape whose `transform` narrows the `chunk` argument to `Chunk`.
// The mode-independent documentation lives here.
type GeneratorTransformBase<IsSync extends boolean, Chunk> = TransformCommon & {
	/**
	Map or filter the input or output of the subprocess.
	*/
	readonly transform: GeneratorTransform<IsSync, Chunk>;

	/**
	Create additional lines after the last one.
	*/
	readonly final?: GeneratorFinal<IsSync>;

	/**
	If `true`, iterate over arbitrary chunks of `Uint8Array`s instead of line `string`s.
	*/
	readonly binary?: boolean;

	/**
	If `true`, keep newlines in each `line` argument. Also, this allows multiple `yield`s to produce a single line.
	*/
	readonly preserveNewlines?: boolean;
};

// For stdout/stderr, this literal option pair accepts explicitly typed `Uint8Array` callbacks, matching runtime binary chunks, while still allowing stdin-style `unknown` object-mode callbacks.
type GeneratorTransformBinaryObjectMode<IsSync extends boolean, ObjectModeChunk> = ObjectModeChunk extends string
	? Omit<GeneratorTransformBase<IsSync, unknown>, 'transform' | 'objectMode' | 'binary'> & {
		/**
		Map or filter the input or output of the subprocess.
		*/
		transform(chunk: Uint8Array): GeneratorTransformReturn<IsSync>;
		// eslint-disable-next-line @typescript-eslint/unified-signatures -- Combining these as `unknown | Uint8Array` would collapse to `unknown` and reject explicitly typed `Uint8Array` callbacks.
		transform(chunk: unknown): GeneratorTransformReturn<IsSync>;

		readonly objectMode: true;
		readonly binary: true;
	}
	: GeneratorTransformBase<IsSync, unknown> & {readonly objectMode: true; readonly binary: true};

/**
A transform or an array of transforms can be passed to the `stdin`, `stdout`, `stderr` or `stdio` option.

A transform is either a generator function or a plain object with the following members.
*/
export type GeneratorTransformFull<IsSync extends boolean, ObjectModeChunk = unknown, TransformChunk = string> =
	// Non-literal `binary` or `objectMode` values are accepted at runtime, but their mode is unknown at compile time.
	| (GeneratorTransformBase<IsSync, unknown> & {readonly objectMode?: boolean; readonly binary?: boolean})
	// `binary: true` without `objectMode` -> the `chunk` argument is an `Uint8Array`.
	| (GeneratorTransformBase<IsSync, Uint8Array> & {readonly objectMode?: false; readonly binary: true})
	// `binary: true` with `objectMode` -> the `chunk` argument is `unknown` for stdin, `Uint8Array` for stdout/stderr.
	| GeneratorTransformBinaryObjectMode<IsSync, ObjectModeChunk>
	// `binary: false` without `objectMode` -> the `chunk` argument depends on the subprocess encoding.
	| (GeneratorTransformBase<IsSync, TransformChunk> & {readonly objectMode?: false; readonly binary?: false})
	// `objectMode: true` with `binary: false` -> the `chunk` argument depends on the stdio direction.
	| (GeneratorTransformBase<IsSync, ObjectModeChunk> & {readonly objectMode: true; readonly binary?: false});

// `options.std*: Duplex`
export type DuplexTransform = TransformCommon & {
	readonly transform: Duplex;
};

// `options.std*: TransformStream`
export type WebTransform = TransformCommon & {
	readonly transform: TransformStream;
};

export {};
