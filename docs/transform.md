# Transforms

## Summary

Transforms map or filter the input or output of a child process. They are defined by passing an [async generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function*) to the [`stdin`](../readme.md#stdin), [`stdout`](../readme.md#stdout-1), [`stderr`](../readme.md#stderr-1) or [`stdio`](../readme.md#stdio-1) option.

```js
import {execa} from 'execa';

const transform = async function * (chunks) {
	for await (const chunk of chunks) {
		yield chunk.toUpperCase();
	}
};

const {stdout} = await execa('echo', ['hello'], {stdout: transform});
console.log(stdout); // HELLO
```

## Encoding

The `chunks` argument passed to the transform is an [`AsyncIterable<string>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_async_iterator_and_async_iterable_protocols). If the [`encoding`](../readme.md#encoding) option is `buffer`, it is an `AsyncIterable<Uint8Array>` instead.

The transform can `yield` either a `string` or an `Uint8Array`, regardless of the `chunks` argument's type.

## Filtering

`yield` can be called 0, 1 or multiple times. Not calling `yield` enables filtering a specific chunk.

```js
import {execa} from 'execa';

const transform = async function * (chunks) {
	for await (const chunk of chunks) {
		if (!chunk.includes('secret')) {
			yield chunk;
		}
	}
};

const {stdout} = await execa('echo', ['This is a secret.'], {stdout: transform});
console.log(stdout); // ''
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
