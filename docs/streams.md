<picture>
	<source media="(prefers-color-scheme: dark)" srcset="../media/logo_dark.svg">
	<img alt="execa logo" src="../media/logo.svg" width="400">
</picture>
<br>

# ⏳️ Streams

## Node.js streams

### Input

```js
import {createReadStream} from 'node:fs';
import {once} from 'node:events';
import {execa} from 'execa';

const readable = createReadStream('./input.txt');
await once(readable, 'open');
await execa({stdin: readable})`npm run scaffold`;
```

### Output

```js
import {createWriteStream} from 'node:fs';
import {once} from 'node:events';
import {execa} from 'execa';

const writable = createWriteStream('./output.txt');
await once(writable, 'open');
await execa({stdout: writable})`npm run build`;
```

### File descriptors

When passing a Node.js stream to the [`stdin`](../readme.md#optionsstdin), [`stdout`](../readme.md#optionsstdout) or [`stderr`](../readme.md#optionsstderr) option, that stream must have an underlying file or socket, such as the streams created by the [`fs`](https://nodejs.org/api/fs.html#filehandlecreatereadstreamoptions), [`net`](https://nodejs.org/api/net.html#new-netsocketoptions) or [`http`](https://nodejs.org/api/http.html#class-httpincomingmessage) core modules. Otherwise the following error is thrown.

```
TypeError [ERR_INVALID_ARG_VALUE]: The argument 'stdio' is invalid.
```

This limitation can be worked around by either:
- Using the [`input`](../readme.md#optionsinput) option instead of the [`stdin`](../readme.md#optionsstdin) option.
- Passing a [web stream](#web-streams).
- Passing [`[nodeStream, 'pipe']`](output.md#multiple-targets) instead of `nodeStream`.

## Web streams

[Web streams](https://nodejs.org/api/webstreams.html) ([`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream) or [`WritableStream`](https://developer.mozilla.org/en-US/docs/Web/API/WritableStream)) can be used instead of [Node.js streams](https://nodejs.org/api/stream.html).

```js
const response = await fetch('https://example.com');
await execa({stdin: response.body})`npm run build`;
```

## Iterables as input

```js
const getReplInput = async function * () {
	for await (const replLine of getReplLines()) {
		yield replLine;
	}
};

await execa({stdin: getReplInput()})`npm run scaffold`;
```

## Manual streaming

[`subprocess.stdin`](../readme.md#subprocessstdin) is a Node.js [`Readable`](https://nodejs.org/api/stream.html#class-streamreadable) stream and [`subprocess.stdout`](../readme.md#subprocessstdout)/[`subprocess.stderr`](../readme.md#subprocessstderr)/[`subprocess.all`](../readme.md#subprocessall) are Node.js [`Writable`](https://nodejs.org/api/stream.html#class-streamwritable) streams.

They can be used to stream input/output manually. This is intended for advanced situations. In most cases, the following simpler solutions can be used instead:
- [`result.stdout`](output.md#stdout-and-stderr), [`result.stderr`](output.md#stdout-and-stderr) or [`result.stdio`](output.md#additional-file-descriptors).
- The [`stdin`](../readme.md#optionsstdin), [`stdout`](../readme.md#optionsstdout), [`stderr`](../readme.md#optionsstderr) or [`stdio`](../readme.md#optionsstdio) options.
- [`subprocess.iterable()`](lines.md#progressive-splitting).
- [`subprocess.pipe()`](pipe.md).

## Converting a subprocess to a stream

### Convert

The [`subprocess.readable()`](../readme.md#subprocessreadablereadableoptions), [`subprocess.writable()`](../readme.md#subprocesswritablewritableoptions) and [`subprocess.duplex()`](../readme.md#subprocessduplexduplexoptions) methods convert the subprocess to a Node.js [`Readable`](https://nodejs.org/api/stream.html#class-streamreadable), [`Writable`](https://nodejs.org/api/stream.html#class-streamwritable) and [`Duplex`](https://nodejs.org/api/stream.html#class-streamduplex) stream.

This is useful when using a library or API that expects Node.js streams as arguments. In every other situation, the simpler solutions described [above](#manual-streaming) can be used instead.

```js
const readable = execa`npm run scaffold`.readable();

const writable = execa`npm run scaffold`.writable();

const duplex = execa`npm run scaffold`.duplex();
```

### Different file descriptor

By default, [`subprocess.readable()`](../readme.md#subprocessreadablereadableoptions), [`subprocess.writable()`](../readme.md#subprocesswritablewritableoptions) and [`subprocess.duplex()`](../readme.md#subprocessduplexduplexoptions) methods use [`stdin`](../readme.md#subprocessstdin) and [`stdout`](../readme.md#subprocessstdout). This can be changed using the [`from`](../readme.md#readableoptionsfrom) and [`to`](../readme.md#writableoptionsto) options.

```js
const readable = execa`npm run scaffold`.readable({from: 'stderr'});

const writable = execa`npm run scaffold`.writable({to: 'fd3'});

const duplex = execa`npm run scaffold`.duplex({from: 'stderr', to: 'fd3'});
```

### Error handling

When using [`subprocess.readable()`](../readme.md#subprocessreadablereadableoptions), [`subprocess.writable()`](../readme.md#subprocesswritablewritableoptions) or [`subprocess.duplex()`](../readme.md#subprocessduplexduplexoptions), the stream waits for the subprocess to end, and emits an [`error`](https://nodejs.org/api/stream.html#event-error) event if the subprocess [fails](errors.md). This differs from [`subprocess.stdin`](../readme.md#subprocessstdin), [`subprocess.stdout`](../readme.md#subprocessstdout) and [`subprocess.stderr`](../readme.md#subprocessstderr)'s behavior.

This means you do not need to `await` the subprocess' [promise](execution.md#result). On the other hand, you (or the library using the stream) do need to both consume the stream, and handle its `error` event. This can be done by using [`await finished(stream)`](https://nodejs.org/api/stream.html#streamfinishedstream-options), [`await pipeline(..., stream, ...)`](https://nodejs.org/api/stream.html#streampipelinesource-transforms-destination-options) or [`await text(stream)`](https://nodejs.org/api/webstreams.html#streamconsumerstextstream) which throw an exception when the stream errors.

<hr>

[**Next**: 📞 Inter-process communication](ipc.md)\
[**Previous**: 🔀 Piping multiple subprocesses](pipe.md)\
[**Top**: Table of contents](../readme.md#documentation)
