<picture>
	<source media="(prefers-color-scheme: dark)" srcset="../media/logo_dark.svg">
	<img alt="execa logo" src="../media/logo.svg" width="400">
</picture>
<br>

# 🤖 Binary data

## Binary input

There are multiple ways to pass binary input using the [`stdin`](../readme.md#optionsstdin), [`input`](../readme.md#optionsinput) or [`inputFile`](../readme.md#optionsinputfile) options: `Uint8Array`s, [files](input.md#file-input), [streams](streams.md) or [other subprocesses](pipe.md).

This is required if the subprocess input includes [null bytes](https://en.wikipedia.org/wiki/Null_character).

```js
import {execa} from 'execa';

const binaryData = new Uint8Array([/* ... */]);
await execa({stdin: binaryData})`hexdump`;
```

## Binary output

By default, the subprocess [output](../readme.md#resultstdout) is a [UTF8](https://en.wikipedia.org/wiki/UTF-8) string. If it is binary, the [`encoding`](../readme.md#optionsencoding) option should be set to `'buffer'` instead. The output will be an [`Uint8Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array).

```js
const {stdout} = await execa({encoding: 'buffer'})`zip -r - input.txt`;
console.log(stdout.byteLength);
```

## Encoding

When the output is binary, the [`encoding`](../readme.md#optionsencoding) option can also be set to [`'hex'`](https://en.wikipedia.org/wiki/Hexadecimal), [`'base64'`](https://en.wikipedia.org/wiki/Base64) or [`'base64url'`](https://en.wikipedia.org/wiki/Base64#URL_applications). The output will be a string then.

```js
const {stdout} = await execa({encoding: 'hex'})`zip -r - input.txt`;
console.log(stdout); // Hexadecimal string
```

## Iterable

By default, the subprocess [iterates](lines.md#progressive-splitting) over line strings. However, if the [`encoding`](../readme.md#optionsencoding) subprocess option is binary, or if the [`binary`](../readme.md#readableoptionsbinary) iterable option is `true`, it iterates over arbitrary chunks of [`Uint8Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) data instead.

```js
for await (const data of execa({encoding: 'buffer'})`zip -r - input.txt`) {
	/* ... */
}
```

## Transforms

The same applies to transforms. When the [`encoding`](../readme.md#optionsencoding) subprocess option is binary, or when the [`binary`](../readme.md#transformoptionsbinary) transform option is `true`, it iterates over arbitrary chunks of [`Uint8Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) data instead.

However, transforms can always `yield` either a `string` or an `Uint8Array`, regardless of whether the output is binary or not.

```js
const transform = function * (data) {
	/* ... */
}

await execa({stdout: {transform, binary: true}})`zip -r - input.txt`;
```

## Streams

[Streams produced](streams.md#converting-a-subprocess-to-a-stream) by [`subprocess.readable()`](../readme.md#subprocessreadablereadableoptions) and [`subprocess.duplex()`](../readme.md#subprocessduplexduplexoptions) are binary by default, which means they iterate over arbitrary [`Buffer`](https://nodejs.org/api/buffer.html#class-buffer) chunks. However, if the [`binary`](../readme.md#readableoptionsbinary) option is `false`, they iterate over line strings instead, and the stream is [in object mode](https://nodejs.org/api/stream.html#object-mode).

```js
const readable = execa`npm run build`.readable({binary: false});
readable.on('data', lineString => {
	/* ... */
});
```

<hr>

[**Next**: 🧙 Transforms](transform.md)\
[**Previous**: 📃 Text lines](lines.md)\
[**Top**: Table of contents](../readme.md#documentation)
