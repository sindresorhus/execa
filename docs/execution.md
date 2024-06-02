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

All [available methods](api.md#methods) can use either the [array syntax](#array-syntax) or the template string syntax, which are equivalent.

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

await execa`npm ${['run', 'build', '--concurrency', result]}`;
```

### No arguments

```js
await execa`npm run build ${[]}`;
// Same as:
await execa('npm', ['run', 'build']);
```

### Empty string argument

```js
await execa`npm run build ${''}`;
// Same as:
await execa('npm', ['run', 'build', '']);
```

### Conditional argument

```js
const commandArguments = failFast ? ['--fail-fast'] : [];
await execa`npm run build ${commandArguments}`;
```

### Multiple lines

```js
await execa`npm run build
	--concurrency 2
	--fail-fast`;
```

### Shells

By default, any shell-specific syntax has no special meaning and does not need to be escaped. This prevents [shell injections](https://en.wikipedia.org/wiki/Code_injection#Shell_injection). [More info.](escaping.md#shells)

```js
// This prints `$TASK_NAME`, not `build`
await execa({env: {TASK_NAME: 'build'}})`echo $TASK_NAME`;
```

## Options

[Options](api.md#options-1) can be passed to influence the execution's behavior.

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

The subprocess is returned as soon as it is spawned. It is a [`child_process` instance](https://nodejs.org/api/child_process.html#child_process_class_childprocess) with [additional methods and properties](api.md#subprocess).

```js
const subprocess = execa`npm run build`;
console.log(subprocess.pid);
```

### Result

The subprocess is also a `Promise` that resolves with the [`result`](api.md#result).

```js
const {stdout} = await execa`npm run build`;
```

### Synchronous execution

[`execaSync()`](api.md#execasyncfile-arguments-options) and [`$.sync()`](api.md#syncfile-arguments-options) return the [`result`](api.md#result) without needing to `await`. The [`subprocess`](#subprocess) is not returned: its methods and properties are not available.

```js
import {execaSync} from 'execa';

const {stdout} = execaSync`npm run build`;
```

Synchronous execution is generally discouraged as it holds the CPU and prevents parallelization. Also, the following features cannot be used:
- Streams: [`subprocess.stdin`](api.md#subprocessstdin), [`subprocess.stdout`](api.md#subprocessstdout), [`subprocess.stderr`](api.md#subprocessstderr), [`subprocess.readable()`](api.md#subprocessreadablereadableoptions), [`subprocess.writable()`](api.md#subprocesswritablewritableoptions), [`subprocess.duplex()`](api.md#subprocessduplexduplexoptions).
- The [`stdin`](api.md#optionsstdin), [`stdout`](api.md#optionsstdout), [`stderr`](api.md#optionsstderr) and [`stdio`](api.md#optionsstdio) options cannot be [`'overlapped'`](api.md#optionsstdout), an [async iterable](lines.md#progressive-splitting), an async [transform](transform.md), a [`Duplex`](transform.md#duplextransform-streams), nor a [web stream](streams.md#web-streams). Node.js streams can be passed but only if either they [have a file descriptor](streams.md#file-descriptors), or the [`input`](api.md#optionsinput) option is used.
- Signal termination: [`subprocess.kill()`](api.md#subprocesskillerror), [`subprocess.pid`](api.md#subprocesspid), [`cleanup`](api.md#optionscleanup) option, [`cancelSignal`](api.md#optionscancelsignal) option, [`forceKillAfterDelay`](api.md#optionsforcekillafterdelay) option.
- Piping multiple subprocesses: [`subprocess.pipe()`](api.md#subprocesspipefile-arguments-options).
- [`subprocess.iterable()`](lines.md#progressive-splitting).
- [IPC](ipc.md): [`sendMessage()`](api.md#sendmessagemessage-sendmessageoptions), [`getOneMessage()`](api.md#getonemessagegetonemessageoptions), [`getEachMessage()`](api.md#geteachmessage), [`result.ipcOutput`](output.md#any-output-type), [`ipc`](api.md#optionsipc) option, [`serialization`](api.md#optionsserialization) option, [`ipcInput`](input.md#any-input-type) option.
- [`result.all`](api.md#resultall) is not interleaved.
- [`detached`](api.md#optionsdetached) option.
- The [`maxBuffer`](api.md#optionsmaxbuffer) option is always measured in bytes, not in characters, [lines](api.md#optionslines) nor [objects](transform.md#object-mode). Also, it ignores transforms and the [`encoding`](api.md#optionsencoding) option.

<hr>

[**Next**: 💬 Escaping/quoting](escaping.md)\
[**Top**: Table of contents](../readme.md#documentation)
