<picture>
	<source media="(prefers-color-scheme: dark)" srcset="../media/logo_dark.svg">
	<img alt="execa logo" src="../media/logo.svg" width="400">
</picture>
<br>

# 🎹 Input

## Command arguments

The simplest way to pass input to a subprocess is to use command arguments.

```js
import {execa} from 'execa';

const commandArgument = 'build';
await execa`node child.js ${commandArgument}`;
```

If the subprocess is a Node.js file, those are available using [`process.argv`](https://nodejs.org/api/process.html#processargv).

```js
// child.js
import process from 'node:process';

const commandArgument = process.argv[2];
```

## Environment variables

Unlike [command arguments](#command-arguments), [environment variables](https://en.wikipedia.org/wiki/Environment_variable) have names. They are commonly used to configure applications.

If the subprocess spawns its own subprocesses, they inherit environment variables. To isolate subprocesses from each other, either command arguments or [`stdin`](#string-input) should be preferred instead.

```js
// Keep the current process' environment variables, and set `NO_COLOR`
await execa({env: {NO_COLOR: 'true'}})`node child.js`;
// Discard the current process' environment variables, only pass `NO_COLOR`
await execa({env: {NO_COLOR: 'true'}, extendEnv: false})`node child.js`;
```

If the subprocess is a Node.js file, environment variables are available using [`process.env`](https://nodejs.org/api/process.html#processenv).

```js
// child.js
import process from 'node:process';

console.log(process.env.NO_COLOR);
```

## String input

Alternatively, input can be provided to [`stdin`](https://en.wikipedia.org/wiki/Standard_streams#Standard_input_(stdin)). Unlike [command arguments](#command-arguments) and [environment variables](#environment-variables) which have [size](https://unix.stackexchange.com/questions/120642/what-defines-the-maximum-size-for-a-command-single-argument) [limits](https://stackoverflow.com/questions/1078031/what-is-the-maximum-size-of-a-linux-environment-variable-value), `stdin` works when the input is big. Also, the input can be redirected from the [terminal](#terminal-input), a [file](#file-input), another [subprocess](pipe.md) or a [stream](streams.md#manual-streaming). Finally, this is required when the input might contain [null bytes](https://en.wikipedia.org/wiki/Null_character), for example when it might be [binary](binary.md#binary-input).

If the input is already available as a string, it can be passed directly to the [`input`](api.md#optionsinput) option.

```js
await execa({input: 'stdinInput'})`npm run scaffold`;
```

The [`stdin`](api.md#optionsstdin) option can also be used, although the string must be wrapped in two arrays for [syntax reasons](output.md#multiple-targets).

```js
await execa({stdin: [['stdinInput']]})`npm run scaffold`;
```

## Ignore input

```js
const subprocess = execa({stdin: 'ignore'})`npm run scaffold`;
console.log(subprocess.stdin); // undefined
await subprocess;
```

## File input

```js
await execa({inputFile: 'input.txt'})`npm run scaffold`;
// Or:
await execa({stdin: {file: 'input.txt'}})`npm run scaffold`;
// Or:
await execa({stdin: new URL('file:///path/to/input.txt')})`npm run scaffold`;
```

## Terminal input

The parent process' input can be re-used in the subprocess by passing `'inherit'`. This is especially useful to receive interactive input in command line applications.

```js
await execa({stdin: 'inherit'})`npm run scaffold`;
```

## Any input type

If the subprocess [uses Node.js](node.md), [almost any type](ipc.md#message-type) can be passed to the subprocess using the [`ipcInput`](ipc.md#send-an-initial-message) option. The subprocess retrieves that input using [`getOneMessage()`](api.md#getonemessagegetonemessageoptions).

```js
// main.js
import {execaNode} from 'execa';

const ipcInput = [
	{task: 'lint', ignore: /test\.js/},
	{task: 'copy', files: new Set(['main.js', 'index.js']),
}];
await execaNode({ipcInput})`build.js`;
```

```js
// build.js
import {getOneMessage} from 'execa';

const ipcInput = await getOneMessage();
```

## Additional file descriptors

The [`stdio`](api.md#optionsstdio) option can be used to pass some input to any [file descriptor](https://en.wikipedia.org/wiki/File_descriptor), as opposed to only [`stdin`](api.md#optionsstdin).

```js
// Pass input to the file descriptor number 3
await execa({
	stdio: ['pipe', 'pipe', 'pipe', new Uint8Array([/* ... */])],
})`npm run build`;
```

<hr>

[**Next**: 📢 Output](output.md)\
[**Previous**: 🏁 Termination](termination.md)\
[**Top**: Table of contents](../readme.md#documentation)
