<picture>
	<source media="(prefers-color-scheme: dark)" srcset="../media/logo_dark.svg">
	<img alt="execa logo" src="../media/logo.svg" width="400">
</picture>
<br>

# 🧙 Transforms

## Summary

Transforms map or filter the input or output of a subprocess. They are defined by passing a [generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*) or a [transform options object](../readme.md#transform-options) to the [`stdin`](../readme.md#optionsstdin), [`stdout`](../readme.md#optionsstdout), [`stderr`](../readme.md#optionsstderr) or [`stdio`](../readme.md#optionsstdio) option. It can be [`async`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function*).

```js
import {execa} from 'execa';

const transform = function * (line) {
	const prefix = line.includes('error') ? 'ERROR' : 'INFO';
	yield `${prefix}: ${line}`;
};

const {stdout} = await execa({stdout: transform})`npm run build`;
console.log(stdout); // HELLO
```

## Difference with iteration

Transforms operate one `line` at a time, just like [`subprocess.iterable()`](lines.md#progressive-splitting). However, unlike iteration, transforms:
- Modify the subprocess' [output](../readme.md#resultstdout) and [streams](../readme.md#subprocessstdout).
- Can apply to the subprocess' input.
- Are defined using a [generator function](#summary), [`Duplex`](#duplextransform-streams) stream, Node.js [`Transform`](#duplextransform-streams) stream or web [`TransformStream`](#duplextransform-streams).

## Filtering

`yield` can be called 0, 1 or multiple times. Not calling `yield` enables filtering a specific line.

```js
const transform = function * (line) {
	if (!line.includes('secret')) {
		yield line;
	}
};

const {stdout} = await execa({stdout: transform})`echo ${'This is a secret'}`;
console.log(stdout); // ''
```

## Object mode

By default, [`stdout`](../readme.md#optionsstdout) and [`stderr`](../readme.md#optionsstderr)'s transforms must return a string or an `Uint8Array`. However, if the [`objectMode`](../readme.md#transformoptionsobjectmode) transform option is `true`, any type can be returned instead, except `null` or `undefined`. The subprocess' [`result.stdout`](../readme.md#resultstdout)/[`result.stderr`](../readme.md#resultstderr) will be an array of values.

```js
const transform = function * (line) {
	yield JSON.parse(line);
};

const {stdout} = await execa({stdout: {transform, objectMode: true}})`node jsonlines-output.js`;
for (const data of stdout) {
	console.log(stdout); // {...object}
}
```

[`stdin`](../readme.md#optionsstdin) can also use `objectMode: true`.

```js
const transform = function * (line) {
	yield JSON.stringify(line);
};

const input = [{event: 'example'}, {event: 'otherExample'}];
await execa({stdin: [input, {transform, objectMode: true}]})`node jsonlines-input.js`;
```

## Sharing state

State can be shared between calls of the [`transform`](../readme.md#transformoptionstransform) and [`final`](../readme.md#transformoptionsfinal) functions.

```js
let count = 0;

// Prefix line number
const transform = function * (line) {
	yield `[${count++}] ${line}`;
};
```

## Finalizing

To create additional lines after the last one, a [`final`](../readme.md#transformoptionsfinal) generator function can be used.

```js
let count = 0;

const transform = function * (line) {
	count += 1;
	yield line;
};

const final = function * () {
	yield `Number of lines: ${count}`;
};

const {stdout} = await execa({stdout: {transform, final}})`npm run build`;
console.log(stdout); // Ends with: 'Number of lines: 54'
```

## Duplex/Transform streams

A [`Duplex`](https://nodejs.org/api/stream.html#class-streamduplex) stream, Node.js [`Transform`](https://nodejs.org/api/stream.html#class-streamtransform) stream or web [`TransformStream`](https://developer.mozilla.org/en-US/docs/Web/API/TransformStream) can be used instead of a generator function.

Like generator functions, web `TransformStream` can be passed either directly or as a [`{transform}` plain object](../readme.md#transform-options). But `Duplex` and `Transform` must always be passed as a `{transform}` plain object.

The [`objectMode`](#object-mode) transform option can be used, but not the [`binary`](../readme.md#transformoptionsbinary) nor [`preserveNewlines`](../readme.md#transformoptionspreservenewlines) options.

```js
import {createGzip} from 'node:zlib';
import {execa} from 'execa';

const {stdout} = await execa({
	stdout: {transform: createGzip()},
	encoding: 'buffer',
})`npm run build`;
console.log(stdout); // `stdout` is compressed with gzip
```

```js
const {stdout} = await execa({
	stdout: new CompressionStream('gzip'),
	encoding: 'buffer',
})`npm run build`;
console.log(stdout); // `stdout` is compressed with gzip
```

## Combining

The [`stdin`](../readme.md#optionsstdin), [`stdout`](../readme.md#optionsstdout), [`stderr`](../readme.md#optionsstderr) and [`stdio`](../readme.md#optionsstdio) options can accept [an array of values](output.md#multiple-targets). While this is not specific to transforms, this can be useful with them too. For example, the following transform impacts the value printed by `'inherit'`.

```js
await execa({stdout: [transform, 'inherit']})`npm run build`;
```

This also allows using multiple transforms.

```js
await execa({stdout: [transform, otherTransform]})`npm run build`;
```

Or saving to archives.

```js
await execa({stdout: [new CompressionStream('gzip'), {file: './output.gz'}]})`npm run build`;
```

<hr>

[**Next**: 🔀 Piping multiple subprocesses](pipe.md)\
[**Previous**: 🤖 Binary data](binary.md)\
[**Top**: Table of contents](../readme.md#documentation)
