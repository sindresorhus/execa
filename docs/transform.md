# Transforms

## Summary

Transforms map or filter the input or output of a child process. They are defined by passing an [async generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function*) to the [`stdin`](../readme.md#stdin), [`stdout`](../readme.md#stdout-1), [`stderr`](../readme.md#stderr-1) or [`stdio`](../readme.md#stdio-1) option.

```js
import {execa} from 'execa';

const transform = async function * (lines) {
	for await (const line of lines) {
		const prefix = line.includes('error') ? 'ERROR' : 'INFO'
		yield `${prefix}: ${line}`
	}
};

const {stdout} = await execa('echo', ['hello'], {stdout: transform});
console.log(stdout); // HELLO
```

## Encoding

The `lines` argument passed to the transform is an [`AsyncIterable<string>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_async_iterator_and_async_iterable_protocols). If the [`encoding`](../readme.md#encoding) option is `buffer`, it is an `AsyncIterable<Uint8Array>` instead.

The transform can `yield` either a `string` or an `Uint8Array`, regardless of the `lines` argument's type.

## Filtering

`yield` can be called 0, 1 or multiple times. Not calling `yield` enables filtering a specific line.

```js
import {execa} from 'execa';

const transform = async function * (lines) {
	for await (const line of lines) {
		if (!line.includes('secret')) {
			yield line;
		}
	}
};

const {stdout} = await execa('echo', ['This is a secret.'], {stdout: transform});
console.log(stdout); // ''
```

## Binary data

The transform iterates over lines by default.\
However, if a `{transform, binary: true}` plain object is passed, it iterates over arbitrary chunks of data instead.

```js
await execa('./binary.js', {stdout: {transform, binary: true}});
```

This is more efficient and recommended if the data is either:
	- Binary: Which does not have lines.
	- Text: But the transform works even if a line or word is split across multiple chunks.

## Object mode

By default, `stdout` and `stderr`'s transforms must return a string or an `Uint8Array`. However, if a `{transform, objectMode: true}` plain object is passed, any type can be returned instead. The process' [`stdout`](../readme.md#stdout)/[`stderr`](../readme.md#stderr) will be an array of values.

```js
const transform = async function * (lines) {
	for await (const line of lines) {
		yield JSON.parse(line)
	}
}

const {stdout} = await execa('./jsonlines-output.js', {stdout: {transform, objectMode: true}});
for (const data of stdout) {
	console.log(stdout) // {...}
}
```

`stdin` can also use `objectMode: true`.

```js
const transform = async function * (lines) {
	for await (const line of lines) {
		yield JSON.stringify(line)
	}
}

const input = [{event: 'example'}, {event: 'otherExample'}]
await execa('./jsonlines-input.js', {stdin: [input, {transform, objectMode: true}]});
```

## Combining

The [`stdin`](../readme.md#stdin), [`stdout`](../readme.md#stdout-1), [`stderr`](../readme.md#stderr-1) and [`stdio`](../readme.md#stdio-1) options can accept an array of values. While this is not specific to transforms, this can be useful with them too. For example, the following transform impacts the value printed by `inherit`.

```js
await execa('echo', ['hello'], {stdout: [transform, 'inherit']});
```

This also allows using multiple transforms.

```js
await execa('echo', ['hello'], {stdout: [transform, otherTransform]});
```
