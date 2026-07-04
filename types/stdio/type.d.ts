import type {Readable, Writable} from 'node:stream';
import type {ReadableStream, WritableStream, TransformStream} from 'node:stream/web';
import type {
	Not,
	And,
	Unless,
	AndUnless,
} from '../utils.js';
import type {
	GeneratorTransform,
	GeneratorTransformFull,
	DuplexTransform,
	WebTransform,
} from '../transform/normalize.js';

type IsStandardStream<FdNumber extends string> = FdNumber extends keyof StandardStreams ? true : false;

export type StandardStreams = readonly ['stdin', 'stdout', 'stderr'];

// When `options.stdin|stdout|stderr|stdio` is set to one of those values, no stream is created
export type NoStreamStdioOption<FdNumber extends string> =
	| 'ignore'
	| 'inherit'
	| number
	| Readable
	| Writable
	| Unless<IsStandardStream<FdNumber>, undefined>
	| readonly [NoStreamStdioOption<FdNumber>]
	| {readonly value: 'inherit' | number; readonly input?: boolean};

// `options.stdio` when it is not an array
type SimpleStdioOption<
	IsSync extends boolean,
	IsExtra extends boolean,
	IsArray extends boolean,
> =
	| undefined
	| 'pipe'
	| Unless<And<And<Not<IsSync>, IsArray>, IsExtra>, 'inherit'>
	| Unless<IsArray, 'ignore'>
	| Unless<IsSync, 'overlapped'>;

// The `{value, input}` object form wraps a direction-ambiguous value and sets its direction explicitly.
export type AmbiguousStdioOption<
	IsSync extends boolean,
	IsExtra extends boolean,
	IsArray extends boolean,
	ObjectModeChunk = unknown,
	TransformChunk = string,
> = {
	readonly value: AmbiguousStdioValue<IsSync, IsArray, ObjectModeChunk, TransformChunk>;
	readonly input?: Unless<And<IsSync, IsExtra>, boolean> | false;
};

// Values whose direction is ambiguous on additional file descriptors, so they default to output unless `input` is set.
// This excludes values with a fixed direction (readable/writable streams, iterables, standard file descriptors).
type AmbiguousStdioValue<
	IsSync extends boolean,
	IsArray extends boolean,
	ObjectModeChunk,
	TransformChunk,
> =
	| 'pipe'
	| 'inherit'
	| Unless<IsSync, 'overlapped'>
	| URL
	| GeneratorTransform<IsSync, TransformChunk>
	| GeneratorTransformFull<IsSync, ObjectModeChunk, TransformChunk>
	| Unless<And<Not<IsSync>, IsArray>, 3 | 4 | 5 | 6 | 7 | 8 | 9>
	| Unless<IsSync, DuplexTransform | WebTransform | TransformStream>
	| {readonly file: string; readonly append?: boolean};

// Values available in both `options.stdin|stdio` and `options.stdout|stderr|stdio`
type CommonStdioOption<
	IsSync extends boolean,
	IsExtra extends boolean,
	IsArray extends boolean,
	ObjectModeChunk = unknown,
	TransformChunk = string,
> =
	// TypeScript cannot contextually type inline full generator transform objects through this broad stdio union because the union also includes `{transform: Duplex | TransformStream}` wrapper objects. Users should annotate `chunk` when assigning an inline object directly to `StdinOption`, `StdoutStderrOption`, `Options['stdout']`, etc. Keep `GeneratorTransformFull` mode branches narrow, but do not add a broad full-object fallback here to try to recover contextual typing.
	SimpleStdioOption<IsSync, IsExtra, IsArray> | URL | GeneratorTransform<IsSync, TransformChunk> | GeneratorTransformFull<IsSync, ObjectModeChunk, TransformChunk> | Unless<And<Not<IsSync>, IsArray>, 3 | 4 | 5 | 6 | 7 | 8 | 9> | Unless<IsSync, DuplexTransform | WebTransform | TransformStream> | AmbiguousStdioOption<IsSync, IsExtra, IsArray, ObjectModeChunk, TransformChunk> | {readonly file: string; readonly append?: boolean};

// Synchronous iterables excluding strings, Uint8Arrays and Arrays
type IterableObject<IsArray extends boolean> = Iterable<unknown>
	& object
	& AndUnless<IsArray, {readonly lastIndexOf?: never}>
	& {readonly BYTES_PER_ELEMENT?: never};

// `process.stdin|stdout|stderr` are `Duplex` with a `fd` property.
// This ensures they can only be passed to `stdin`/`stdout`/`stderr`, based on their direction.
type ProcessStdinFd = {readonly fd?: 0};
type ProcessStdoutStderrFd = {readonly fd?: 1 | 2};

// Values available only in `options.stdin|stdio`
export type InputStdioOption<
	IsSync extends boolean = boolean,
	IsExtra extends boolean = boolean,
	IsArray extends boolean = boolean,
> =
	| 0
	| Unless<And<IsSync, IsExtra>, Uint8Array | IterableObject<IsArray>>
	| Unless<And<IsSync, IsArray>, Readable & ProcessStdinFd>
	| Unless<IsSync, (AsyncIterable<unknown> & ProcessStdinFd) | ReadableStream>;

// Values available only in `options.stdout|stderr|stdio`
type OutputStdioOption<
	IsSync extends boolean,
	IsArray extends boolean,
> =
	| 1
	| 2
	| Unless<And<IsSync, IsArray>, Writable & ProcessStdoutStderrFd>
	| Unless<IsSync, WritableStream>;

// `options.stdin` array items
type StdinSingleOption<
	IsSync extends boolean,
	IsExtra extends boolean,
	IsArray extends boolean,
	TransformChunk = string,
> =
	| CommonStdioOption<IsSync, IsExtra, IsArray, unknown, TransformChunk>
	| InputStdioOption<IsSync, IsExtra, IsArray>;

// `options.stdin`
export type StdinOptionCommon<
	IsSync extends boolean = boolean,
	IsExtra extends boolean = boolean,
	TransformChunk = string,
> = TransformChunk extends unknown
	? | StdinSingleOption<IsSync, IsExtra, false, TransformChunk>
	| ReadonlyArray<StdinSingleOption<IsSync, IsExtra, true, TransformChunk>>
	: never;

// `options.stdin`, async
export type StdinOption = StdinOptionCommon<false, false>;
// `options.stdin`, sync
export type StdinSyncOption = StdinOptionCommon<true, false>;

// `options.stdout|stderr` array items
type StdoutStderrSingleOption<
	IsSync extends boolean,
	IsExtra extends boolean,
	IsArray extends boolean,
	TransformChunk = string,
> =
	| CommonStdioOption<IsSync, IsExtra, IsArray, TransformChunk, TransformChunk>
	| OutputStdioOption<IsSync, IsArray>;

// `options.stdout|stderr`
// In `objectMode`, the `chunk` argument of every array item is typed as `string`, even though only the first transform in the pipeline receives subprocess lines. The array index cannot be used to infer the pipeline position, since non-transform items are filtered out and transforms are reordered at runtime.
export type StdoutStderrOptionCommon<
	IsSync extends boolean = boolean,
	IsExtra extends boolean = boolean,
	TransformChunk = string,
> = TransformChunk extends unknown
	? | StdoutStderrSingleOption<IsSync, IsExtra, false, TransformChunk>
	| ReadonlyArray<StdoutStderrSingleOption<IsSync, IsExtra, true, TransformChunk>>
	: never;

// `options.stdout|stderr`, async
export type StdoutStderrOption = StdoutStderrOptionCommon<false, false>;
// `options.stdout|stderr`, sync
export type StdoutStderrSyncOption = StdoutStderrOptionCommon<true, false>;

// `options.stdio[3+]`
type StdioExtraOptionCommon<IsSync extends boolean, TransformChunk = string> =
	| StdinOptionCommon<IsSync, true, TransformChunk>
	| StdoutStderrOptionCommon<IsSync, true, TransformChunk>;

// `options.stdin|stdout|stderr|stdio` array items
type StdioSingleOption<
	IsSync extends boolean = boolean,
	IsExtra extends boolean = boolean,
	IsArray extends boolean = boolean,
	TransformChunk = string,
> =
	| StdinSingleOption<IsSync, IsExtra, IsArray, TransformChunk>
	| StdoutStderrSingleOption<IsSync, IsExtra, IsArray, TransformChunk>;

// Get `options.stdin|stdout|stderr|stdio` items if it is an array, else keep as is
export type StdioSingleOptionItems<StdioOptionType> = StdioOptionType extends readonly StdioSingleOption[]
	? StdioOptionType[number]
	: StdioOptionType;

// `options.stdin|stdout|stderr|stdio`
export type StdioOptionCommon<IsSync extends boolean = boolean, TransformChunk = string> =
	| StdinOptionCommon<IsSync, boolean, TransformChunk>
	| StdoutStderrOptionCommon<IsSync, boolean, TransformChunk>;

// `options.stdio` when it is an array
export type StdioOptionsArray<IsSync extends boolean = boolean, TransformChunk = string> = readonly [
	StdinOptionCommon<IsSync, false, TransformChunk>,
	StdoutStderrOptionCommon<IsSync, false, TransformChunk>,
	StdoutStderrOptionCommon<IsSync, false, TransformChunk>,
	...ReadonlyArray<StdioExtraOptionCommon<IsSync, TransformChunk>>,
];

// `options.stdio`
export type StdioOptionsProperty<IsSync extends boolean = boolean, TransformChunk = string> = TransformChunk extends unknown
	? | SimpleStdioOption<IsSync, false, false>
	| StdioOptionsArray<IsSync, TransformChunk>
	: never;

export {};
