# Transforms

## Summary

Transforms map or filter the input or output of a subprocess. They are defined by passing a [generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*) or a [transform options object](#transform-options) to the [`stdin`](../readme.md#optionsstdin), [`stdout`](../readme.md#optionsstdout), [`stderr`](../readme.md#optionsstderr) or [`stdio`](../readme.md#optionsstdio) option. It can be [`async`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function*).

```js
import {execa} from 'execa';

const transform = function * (line) {
	const prefix = line.includes('error') ? 'ERROR' : 'INFO';
	yield `${prefix}: ${line}`;
};

const {stdout} = await execa('./run.js', {stdout: transform});
console.log(stdout); // HELLO
```

## Encoding

The `line` argument passed to the transform is a string by default.\
However, if the [`binary`](#transformoptionsbinary) transform option is `true` or if the [`encoding`](../readme.md#optionsencoding) subprocess option is binary, it is an `Uint8Array` instead.

The transform can `yield` either a `string` or an `Uint8Array`, regardless of the `line` argument's type.

## Filtering

`yield` can be called 0, 1 or multiple times. Not calling `yield` enables filtering a specific line.

```js
import {execa} from 'execa';

const transform = function * (line) {
	if (!line.includes('secret')) {
		yield line;
	}
};

const {stdout} = await execa('echo', ['This is a secret.'], {stdout: transform});
console.log(stdout); // ''
```

## Binary data

The transform iterates over lines by default.\
However, if the [`binary`](#transformoptionsbinary) transform option is `true` or if the [`encoding`](../readme.md#optionsencoding) subprocess option is binary, it iterates over arbitrary chunks of data instead.

```js
await execa('./binary.js', {stdout: {transform, binary: true}});
```

This is more efficient and recommended if the data is either:
- Binary: Which does not have lines.
- Text: But the transform works even if a line or word is split across multiple chunks.

## Newlines

Unless the [`binary`](#transformoptionsbinary) transform option is `true`, the transform iterates over lines.
By default, newlines are stripped from each `line` argument.

```js
// `line`'s value never ends with '\n'.
const transform = function * (line) { /* ... */ };

await execa('./run.js', {stdout: transform});
```

However, if the [`preserveNewlines`](#transformoptionspreservenewlines) transform option is `true`, newlines are kept.

```js
// `line`'s value ends with '\n'.
// The output's last `line` might or might not end with '\n', depending on the output.
const transform = function * (line) { /* ... */ };

await execa('./run.js', {stdout: {transform, preserveNewlines: true}});
```

Each `yield` produces at least one line. Calling `yield` multiple times or calling `yield *` produces multiples lines.

```js
const transform = function * (line) {
	yield 'Important note:';
	yield 'Read the comments below.';

	// Or:
	yield * [
		'Important note:',
		'Read the comments below.',
	];

	// Is the same as:
	yield 'Important note:\nRead the comments below.\n';

	yield line
};

await execa('./run.js', {stdout: transform});
```

However, if the [`preserveNewlines`](#transformoptionspreservenewlines) transform option is `true`, multiple `yield`s produce a single line instead.

```js
const transform = function * (line) {
	yield 'Important note: ';
	yield 'Read the comments below.\n';

	// Is the same as:
	yield 'Important note: Read the comments below.\n';

	yield line
};

await execa('./run.js', {stdout: {transform, preserveNewlines: true}});
```

## Object mode

By default, `stdout` and `stderr`'s transforms must return a string or an `Uint8Array`.\
However, if the [`objectMode`](#transformoptionsobjectmode) transform option is `true`, any type can be returned instead, except `null` or `undefined`. The subprocess' [`result.stdout`](../readme.md#resultstdout)/[`result.stderr`](../readme.md#resultstderr) will be an array of values.

```js
const transform = function * (line) {
	yield JSON.parse(line);
};

const {stdout} = await execa('./jsonlines-output.js', {stdout: {transform, objectMode: true}});
for (const data of stdout) {
	console.log(stdout); // {...}
}
```

[`stdin`](../readme.md#optionsstdin) can also use `objectMode: true`.

```js
const transform = function * (line) {
	yield JSON.stringify(line);
};

const input = [{event: 'example'}, {event: 'otherExample'}];
await execa('./jsonlines-input.js', {stdin: [input, {transform, objectMode: true}]});
```

## Sharing state

State can be shared between calls of the [`transform`](#transformoptionstransform) and [`final`](#transformoptionsfinal) functions.

```js
let count = 0

// Prefix line number
const transform = function * (line) {
	yield `[${count++}] ${line}`;
};
```

## Finalizing

To create additional lines after the last one, a [`final`](#transformoptionsfinal) generator function can be used.

```js
let count = 0;

const transform = function * (line) {
	count += 1;
	yield line;
};

const final = function * () {
	yield `Number of lines: ${count}`;
};

const {stdout} = await execa('./command.js', {stdout: {transform, final}});
console.log(stdout); // Ends with: 'Number of lines: 54'
```

## Duplex/Transform streams

A [`Duplex`](https://nodejs.org/api/stream.html#class-streamduplex) stream, Node.js [`Transform`](https://nodejs.org/api/stream.html#class-streamtransform) stream or web [`TransformStream`](https://developer.mozilla.org/en-US/docs/Web/API/TransformStream) can be used instead of a generator function.

Like generator functions, web `TransformStream` can be passed either directly or as a `{transform}` plain object. But `Duplex` and `Transform` must always be passed as a `{transform}` plain object.

The [`objectMode`](#object-mode) transform option can be used, but not the [`binary`](#encoding) nor [`preserveNewlines`](#newlines) options.

```js
import {createGzip} from 'node:zlib';
import {execa} from 'execa';

const {stdout} = await execa('./run.js', {stdout: {transform: createGzip()}});
console.log(stdout); // `stdout` is compressed with gzip
```

```js
import {execa} from 'execa';

const {stdout} = await execa('./run.js', {stdout: new CompressionStream('gzip')});
console.log(stdout); // `stdout` is compressed with gzip
```

## Combining

The [`stdin`](../readme.md#optionsstdin), [`stdout`](../readme.md#optionsstdout), [`stderr`](../readme.md#optionsstderr) and [`stdio`](../readme.md#optionsstdio) options can accept an array of values. While this is not specific to transforms, this can be useful with them too. For example, the following transform impacts the value printed by `inherit`.

```js
await execa('echo', ['hello'], {stdout: [transform, 'inherit']});
```

This also allows using multiple transforms.

```js
await execa('echo', ['hello'], {stdout: [transform, otherTransform]});
```

Or saving to files.

```js
await execa('./run.js', {stdout: [new CompressionStream('gzip'), {file: './output.gz'}]});
```

## Async iteration

In some cases, [iterating](../readme.md#subprocessiterablereadableoptions) over the subprocess can be an alternative to transforms.

```js
import {execa} from 'execa';

for await (const line of execa('./run.js')) {
	const prefix = line.includes('error') ? 'ERROR' : 'INFO';
	console.log(`${prefix}: ${line}`);
}
```

## Transform options

A transform or an [array of transforms](#combining) can be passed to the [`stdin`](../readme.md#optionsstdin), [`stdout`](../readme.md#optionsstdout), [`stderr`](../readme.md#optionsstderr) or [`stdio`](../readme.md#optionsstdio) option.

A transform is either a [generator function](#transformoptionstransform) or a plain object with the following members.

### transformOptions.transform

Type: `GeneratorFunction<string | Uint8Array | unknown>` | `AsyncGeneratorFunction<string | Uint8Array | unknown>`

Map or [filter](#filtering) the input or output of the subprocess.

More info [here](#summary) and [there](#sharing-state).

### transformOptions.final

Type: `GeneratorFunction<string | Uint8Array | unknown>` | `AsyncGeneratorFunction<string | Uint8Array | unknown>`

Create additional lines after the last one.

[More info.](#finalizing)

### transformOptions.binary

Type: `boolean`\
Default: `false`

If `true`, iterate over arbitrary chunks of `Uint8Array`s instead of line `string`s.

More info [here](#encoding) and [there](#binary-data).

### transformOptions.preserveNewlines

Type: `boolean`\
Default: `false`

If `true`, keep newlines in each `line` argument. Also, this allows multiple `yield`s to produces a single line.

[More info.](#newlines)

### transformOptions.objectMode

Type: `boolean`\
Default: `false`

If `true`, allow [`transformOptions.transform`](#transformoptionstransform) and [`transformOptions.final`](#transformoptionsfinal) to return any type, not just `string` or `Uint8Array`.

[More info.](#object-mode)
