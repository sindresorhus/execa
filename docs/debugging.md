<picture>
	<source media="(prefers-color-scheme: dark)" srcset="../media/logo_dark.svg">
	<img alt="execa logo" src="../media/logo.svg" width="400">
</picture>
<br>

# 🐛 Debugging

## Command

[`error.command`](api.md#resultcommand) contains the file and [arguments](input.md#command-arguments) that were run. It is intended for logging or debugging.

[`error.escapedCommand`](api.md#resultescapedcommand) is the same, except control characters are escaped. This makes it safe to either print or copy and paste in a terminal, for debugging purposes.

Since the escaping is fairly basic, neither `error.command` nor `error.escapedCommand` should be executed directly, including using [`execa()`](api.md#execafile-arguments-options) or [`execaCommand()`](api.md#execacommandcommand-options).

```js
import {execa} from 'execa';

try {
	await execa`npm run build\ntask`;
} catch (error) {
	console.error(error.command); // "npm run build\ntask"
	console.error(error.escapedCommand); // "npm run 'build\\ntask'"
	throw error;
}
```

## Duration

```js
try {
	const result = await execa`npm run build`;
	console.log('Command duration:', result.durationMs); // 150
} catch (error) {
	console.error('Command duration:', error.durationMs); // 150
	throw error;
}
```

## Verbose mode

### Short mode

When the [`verbose`](api.md#optionsverbose) option is `'short'`, the [command](#command), [duration](#duration) and [error messages](errors.md#error-message) are printed on [`stderr`](https://en.wikipedia.org/wiki/Standard_streams#Standard_error_(stderr)).

```js
// build.js
await execa({verbose: 'short'})`npm run build`;
```

```sh
$ node build.js
[20:36:11.043] [0] $ npm run build
[20:36:11.885] [0] ✔ (done in 842ms)
```

### Full mode

When the [`verbose`](api.md#optionsverbose) option is `'full'`, the subprocess' [`stdout` and `stderr`](output.md) are also logged. Both are printed on [`stderr`](https://en.wikipedia.org/wiki/Standard_streams#Standard_error_(stderr)).

The output is not logged if either:
- The [`stdout`](api.md#optionsstdout)/[`stderr`](api.md#optionsstderr) option is [`'ignore'`](output.md#ignore-output) or [`'inherit'`](output.md#terminal-output).
- The `stdout`/`stderr` is redirected to [a stream](streams.md#output), [a file](output.md#file-output), [a file descriptor](output.md#terminal-output), or [another subprocess](pipe.md).
- The [`encoding`](api.md#optionsencoding) option is [binary](binary.md#binary-output).

```js
// build.js
await execa({verbose: 'full'})`npm run build`;
```

```sh
$ node build.js
[20:36:11.043] [0] $ npm run build
Building application...
Done building.
[20:36:11.885] [0] ✔ (done in 842ms)
```

### Global mode

When the `NODE_DEBUG=execa` [environment variable](https://en.wikipedia.org/wiki/Environment_variable) is set, the [`verbose`](api.md#optionsverbose) option defaults to `'full'` for all commands.

```js
// build.js

// This is logged by default
await execa`npm run build`;
// This is not logged
await execa({verbose: 'none'})`npm run test`;
```

```sh
$ NODE_DEBUG=execa node build.js
[20:36:11.043] [0] $ npm run build
Building application...
Done building.
[20:36:11.885] [0] ✔ (done in 842ms)
```

<hr>

[**Next**: 📎 Windows](windows.md)\
[**Previous**: 📞 Inter-process communication](ipc.md)\
[**Top**: Table of contents](../readme.md#documentation)
