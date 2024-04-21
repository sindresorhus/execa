<picture>
	<source media="(prefers-color-scheme: dark)" srcset="../media/logo_dark.svg">
	<img alt="execa logo" src="../media/logo.svg" width="400">
</picture>
<br>

# ▶️ Basic execution

## Array syntax

```js
import {execa} from 'execa';

await execa('npm', ['run', 'build']);
```

## Template string syntax

All [available methods](../readme.md#methods) can use either the [array syntax](#array-syntax) or the template string syntax, which are equivalent.

```js
await execa`npm run build`;
```

### String argument

```js
await execa`npm run ${'task with space'}`;
```

### Number argument

```js
await execa`npm run build --concurrency ${2}`;
```

### Subcommands

```js
const result = await execa`get-concurrency`;

// Uses `result.stdout`
await execa`npm run build --concurrency ${result}`;
```

### Concatenation

```js
const tmpDirectory = '/tmp';
await execa`mkdir ${tmpDirectory}/filename`;
```

### Multiple arguments

```js
const result = await execa`get-concurrency`;

await execa`npm ${['run', 'build', '--concurrency', 2]}`;
```

### Multiple lines

```js
await execa`npm run build
	--concurrency 2
	--fail-fast`;
```

## Options

[Options](../readme.md#options) can be passed to influence the execution's behavior.

### Array syntax

```js
await execa('npm', ['run', 'build'], {timeout: 5000});
```

### Template string syntax

```js
await execa({timeout: 5000})`npm run build`;
```

### Global/shared options

```js
const timedExeca = execa({timeout: 5000});

await timedExeca('npm', ['run', 'build']);
await timedExeca`npm run test`;
```

## Return value

### Subprocess

The subprocess is returned as soon as it is spawned. It is a [`child_process` instance](https://nodejs.org/api/child_process.html#child_process_class_childprocess) with [additional methods and properties](../readme.md#subprocess).

```js
const subprocess = execa`npm run build`;
console.log(subprocess.pid);
```

### Result

The subprocess is also a `Promise` that resolves with the [`result`](../readme.md#result).

```js
const {stdout} = await execa`npm run build`;
```

### Synchronous execution

[Every method](../readme.md#methods) can be called synchronously by appending `Sync` to the method's name. The [`result`](../readme.md#result) is returned without needing to `await`. The [`subprocess`](#subprocess) is not returned: its methods and properties are not available.

```js
import {execaSync} from 'execa';

const {stdout} = execaSync`npm run build`;
```

Synchronous execution is generally discouraged as it holds the CPU and prevents parallelization. Also, the following features cannot be used:
- Streams: [`subprocess.stdin`](../readme.md#subprocessstdin), [`subprocess.stdout`](../readme.md#subprocessstdout), [`subprocess.stderr`](../readme.md#subprocessstderr), [`subprocess.readable()`](../readme.md#subprocessreadablereadableoptions), [`subprocess.writable()`](../readme.md#subprocesswritablewritableoptions), [`subprocess.duplex()`](../readme.md#subprocessduplexduplexoptions).
- The [`stdin`](../readme.md#optionsstdin), [`stdout`](../readme.md#optionsstdout), [`stderr`](../readme.md#optionsstderr) and [`stdio`](../readme.md#optionsstdio) options cannot be [`'overlapped'`](../readme.md#optionsstdout), an [async iterable](lines.md#progressive-splitting), an async [transform](transform.md), a [`Duplex`](transform.md#duplextransform-streams), nor a [web stream](streams.md#web-streams). Node.js streams can be passed but only if either they [have a file descriptor](streams.md#file-descriptors), or the [`input`](../readme.md#optionsinput) option is used.
- Signal termination: [`subprocess.kill()`](../readme.md#subprocesskillerror), [`subprocess.pid`](../readme.md#subprocesspid), [`cleanup`](../readme.md#optionscleanup) option, [`cancelSignal`](../readme.md#optionscancelsignal) option, [`forceKillAfterDelay`](../readme.md#optionsforcekillafterdelay) option.
- Piping multiple subprocesses: [`subprocess.pipe()`](../readme.md#subprocesspipefile-arguments-options).
- [`subprocess.iterable()`](lines.md#progressive-splitting).
- [`ipc`](../readme.md#optionsipc) and [`serialization`](../readme.md#optionsserialization) options.
- [`result.all`](../readme.md#resultall) is not interleaved.
- [`detached`](../readme.md#optionsdetached) option.
- The [`maxBuffer`](../readme.md#optionsmaxbuffer) option is always measured in bytes, not in characters, [lines](../readme.md#optionslines) nor [objects](transform.md#object-mode). Also, it ignores transforms and the [`encoding`](../readme.md#optionsencoding) option.

<hr>

[**Next**: 💬 Escaping/quoting](escaping.md)\
[**Top**: Table of contents](../readme.md#documentation)
