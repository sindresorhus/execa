<picture>
	<source media="(prefers-color-scheme: dark)" srcset="media/logo_dark.svg">
	<img alt="execa logo" src="media/logo.svg" width="400">
</picture>
<br>

[![Coverage Status](https://codecov.io/gh/sindresorhus/execa/branch/main/graph/badge.svg)](https://codecov.io/gh/sindresorhus/execa)

> Process execution for humans

<br>

---

<div align="center">
	<p>
		<p>
			<sup>
				<a href="https://github.com/sponsors/sindresorhus">Sindre's open source work is supported by the community</a>
			</sup>
		</p>
		<sup>Special thanks to:</sup>
		<br>
		<br>
		<a href="https://transloadit.com?utm_source=sindresorhus&utm_medium=referral&utm_campaign=sponsorship&utm_content=execa">
			<picture>
				<source width="360" media="(prefers-color-scheme: dark)" srcset="https://sindresorhus.com/assets/thanks/transloadit-logo-dark.svg">
				<source width="360" media="(prefers-color-scheme: light)" srcset="https://sindresorhus.com/assets/thanks/transloadit-logo.svg">
				<img width="360" src="https://sindresorhus.com/assets/thanks/transloadit-logo.svg" alt="Transloadit logo">
			</picture>
		</a>
		<br>
		<br>
		<a href="https://coderabbit.ai?utm_source=sindre&utm_medium=execa">
			<img width="300" src="https://sindresorhus.com/assets/thanks/coderabbit-logo.png" alt="CodeRabbit logo">
		</a>
		<br>
		<br>
	</p>
</div>

---

<br>

## Why

This package improves [`child_process`](https://nodejs.org/api/child_process.html) methods with:

- [Promise interface](#execacommandcommand-options).
- [Scripts interface](#scripts-interface), like `zx`.
- Improved [Windows support](https://github.com/IndigoUnited/node-cross-spawn#why), including [shebang](https://en.wikipedia.org/wiki/Shebang_(Unix)) binaries.
- Executes [locally installed binaries](#preferlocal) without `npx`.
- [Cleans up](#cleanup) subprocesses when the current process ends.
- Redirect [`stdin`](#stdin)/[`stdout`](#stdout-1)/[`stderr`](#stderr-1) from/to files, streams, iterables, strings, `Uint8Array` or [objects](docs/transform.md#object-mode).
- [Transform](docs/transform.md) `stdin`/`stdout`/`stderr` with simple functions.
- Iterate over [each text line](docs/transform.md#binary-data) output by the subprocess.
- [Fail-safe subprocess termination](#forcekillafterdelay).
- Get [interleaved output](#all) from `stdout` and `stderr` similar to what is printed on the terminal.
- [Strips the final newline](#stripfinalnewline) from the output so you don't have to do `stdout.trim()`.
- Convenience methods to pipe subprocesses' [input](#input) and [output](#redirect-output-to-a-file).
- Can specify file and arguments [as a single string](#execacommandcommand-options) without a shell.
- [Verbose mode](#verbose-mode) for debugging.
- More descriptive errors.
- Higher max buffer: 100 MB instead of 1 MB.

## Install

```sh
npm install execa
```

## Usage

### Promise interface

```js
import {execa} from 'execa';

const {stdout} = await execa('echo', ['unicorns']);
console.log(stdout);
//=> 'unicorns'
```

### Scripts interface

For more information about Execa scripts, please see [this page](docs/scripts.md).

#### Basic

```js
import {$} from 'execa';

const branch = await $`git branch --show-current`;
await $`dep deploy --branch=${branch}`;
```

#### Multiple arguments

```js
import {$} from 'execa';

const args = ['unicorns', '&', 'rainbows!'];
const {stdout} = await $`echo ${args}`;
console.log(stdout);
//=> 'unicorns & rainbows!'
```

#### With options

```js
import {$} from 'execa';

await $({stdio: 'inherit'})`echo unicorns`;
//=> 'unicorns'
```

#### Global/shared options

```js
import {$ as $_} from 'execa';

const $ = $_({stdio: 'inherit'});

await $`echo unicorns`;
//=> 'unicorns'

await $`echo rainbows`;
//=> 'rainbows'
```

#### Piping

```js
import {$} from 'execa';

await $`npm run build`
	.pipe`sort`
	.pipe`head -n2`;
```

#### Verbose mode

```sh
> node file.js
unicorns
rainbows

> NODE_DEBUG=execa node file.js
[19:49:00.360] [0] $ echo unicorns
unicorns
[19:49:00.383] [0] √ (done in 23ms)
[19:49:00.383] [1] $ echo rainbows
rainbows
[19:49:00.404] [1] √ (done in 21ms)
```

### Input/output

#### Redirect output to a file

```js
import {execa} from 'execa';

// Similar to `echo unicorns > stdout.txt` in Bash
await execa('echo', ['unicorns'], {stdout: {file: 'stdout.txt'}});

// Similar to `echo unicorns 2> stdout.txt` in Bash
await execa('echo', ['unicorns'], {stderr: {file: 'stderr.txt'}});

// Similar to `echo unicorns &> stdout.txt` in Bash
await execa('echo', ['unicorns'], {stdout: {file: 'all.txt'}, stderr: {file: 'all.txt'}});
```

#### Redirect input from a file

```js
import {execa} from 'execa';

// Similar to `cat < stdin.txt` in Bash
const {stdout} = await execa('cat', {inputFile: 'stdin.txt'});
console.log(stdout);
//=> 'unicorns'
```

#### Save and pipe output from a subprocess

```js
import {execa} from 'execa';

const {stdout} = await execa('echo', ['unicorns'], {stdout: ['pipe', 'inherit']});
// Prints `unicorns`
console.log(stdout);
// Also returns 'unicorns'
```

#### Pipe multiple subprocesses

```js
import {execa} from 'execa';

// Similar to `npm run build | sort | head -n2` in Bash
const {stdout, pipedFrom} = await execa('npm', ['run', 'build'])
	.pipe('sort')
	.pipe('head', ['-n2']);
console.log(stdout); // Result of `head -n2`
console.log(pipedFrom[0]); // Result of `sort`
console.log(pipedFrom[0].pipedFrom[0]); // Result of `npm run build`
```

### Handling Errors

```js
import {execa} from 'execa';

// Catching an error
try {
	await execa('unknown', ['command']);
} catch (error) {
	console.log(error);
	/*
	ExecaError: Command failed with ENOENT: unknown command
	spawn unknown ENOENT
			at ...
			at ... {
		shortMessage: 'Command failed with ENOENT: unknown command\nspawn unknown ENOENT',
		originalMessage: 'spawn unknown ENOENT',
		command: 'unknown command',
		escapedCommand: 'unknown command',
		cwd: '/path/to/cwd',
		durationMs: 28.217566,
		failed: true,
		timedOut: false,
		isCanceled: false,
		isTerminated: false,
		code: 'ENOENT',
		stdout: '',
		stderr: '',
		stdio: [undefined, '', ''],
		pipedFrom: []
		[cause]: Error: spawn unknown ENOENT
				at ...
				at ... {
			errno: -2,
			code: 'ENOENT',
			syscall: 'spawn unknown',
			path: 'unknown',
			spawnargs: [ 'command' ]
		}
	}
	*/
}
```

## API

### Methods

#### execa(file, arguments?, options?)

`file`: `string | URL`\
`arguments`: `string[]`\
`options`: [`Options`](#options-1)\
_Returns_: [`Subprocess`](#subprocess)

Executes a command using `file ...arguments`.

Arguments are [automatically escaped](#shell-syntax). They can contain any character, including spaces.

This is the preferred method when executing single commands.

#### $\`command\`
#### $(options)\`command\`

`command`: `string`\
`options`: [`Options`](#options-1)\
_Returns_: [`Subprocess`](#subprocess)

Executes a command. The `command` string includes both the `file` and its `arguments`.

Arguments are [automatically escaped](#shell-syntax). They can contain any character, but spaces, tabs and newlines must use `${}` like `` $`echo ${'has space'}` ``.

This is the preferred method when executing multiple commands in a script file.

The `command` string can inject any `${value}` with the following types: string, number, [`subprocess`](#subprocess) or an array of those types. For example: `` $`echo one ${'two'} ${3} ${['four', 'five']}` ``. For `${subprocess}`, the subprocess's `stdout` is used.

The `command` string can use [multiple lines and indentation](docs/scripts.md#multiline-commands).

For more information, please see [this section](#scripts-interface) and [this page](docs/scripts.md).

#### $(options)

`options`: [`Options`](#options-1)\
_Returns_: [`$`](#command)

Returns a new instance of [`$`](#command) but with different default [`options`](#options-1). Consecutive calls are merged to previous ones.

This can be used to either:
- Set options for a specific command: `` $(options)`command` ``
- Share options for multiple commands: `` const $$ = $(options); $$`command`; $$`otherCommand`; ``

#### execaCommand(command, options?)

`command`: `string`\
`options`: [`Options`](#options-1)\
_Returns_: [`Subprocess`](#subprocess)

Executes a command. The `command` string includes both the `file` and its `arguments`.

Arguments are [automatically escaped](#shell-syntax). They can contain any character, but spaces must be escaped with a backslash like `execaCommand('echo has\\ space')`.

This is the preferred method when executing a user-supplied `command` string, such as in a REPL.

#### execaNode(scriptPath, arguments?, options?)

`file`: `string | URL`\
`arguments`: `string[]`\
`options`: [`Options`](#options-1)\
_Returns_: [`Subprocess`](#subprocess)

Same as [`execa()`](#execacommandcommand-options) but using the [`node`](#node) option.

Executes a Node.js file using `node scriptPath ...arguments`.

This is the preferred method when executing Node.js files.

#### execaSync(file, arguments?, options?)
#### execaCommandSync(command, options?)
#### $.sync\`command\`
#### $.s\`command\`
#### $.sync(options)\`command\`
#### $.s(options)\`command\`

Same as [`execa()`](#execacommandcommand-options), [`execaCommand()`](#execacommand-command-options), [$\`command\`](#command) but synchronous.

Cannot use the following options: [`all`](#all-2), [`cleanup`](#cleanup), [`buffer`](#buffer), [`detached`](#detached), [`ipc`](#ipc), [`serialization`](#serialization), [`cancelSignal`](#cancelsignal), [`lines`](#lines) and [`verbose: 'full'`](#verbose). Also, the [`stdin`](#stdin), [`stdout`](#stdout-1), [`stderr`](#stderr-1), [`stdio`](#stdio-1) and [`input`](#input) options cannot be an array, an iterable, a [transform](docs/transform.md) or a web stream. Node.js streams [must have a file descriptor](#redirect-a-nodejs-stream-fromto-stdinstdoutstderr) unless the `input` option is used.

Returns or throws a [`subprocessResult`](#subprocessResult). The [`subprocess`](#subprocess) is not returned: its methods and properties are not available. This includes [`.kill()`](https://nodejs.org/api/child_process.html#subprocesskillsignal), [`.pid`](https://nodejs.org/api/child_process.html#subprocesspid), [`.pipe()`](#pipefile-arguments-options) and the [`.stdin`/`.stdout`/`.stderr`](https://nodejs.org/api/child_process.html#subprocessstdout) streams.

### Shell syntax

For all the [methods above](#methods), no shell interpreter (Bash, cmd.exe, etc.) is used unless the [`shell` option](#shell) is set. This means shell-specific characters and expressions (`$variable`, `&&`, `||`, `;`, `|`, etc.) have no special meaning and do not need to be escaped.

### subprocess

The return value of all [asynchronous methods](#methods) is both:
- a `Promise` resolving or rejecting with a [`subprocessResult`](#subprocessResult).
- a [`child_process` instance](https://nodejs.org/api/child_process.html#child_process_class_childprocess) with the following additional methods and properties.

#### all

Type: `ReadableStream | undefined`

Stream [combining/interleaving](#ensuring-all-output-is-interleaved) [`stdout`](https://nodejs.org/api/child_process.html#child_process_subprocess_stdout) and [`stderr`](https://nodejs.org/api/child_process.html#child_process_subprocess_stderr).

This is `undefined` if either:
- the [`all` option](#all-2) is `false` (the default value)
- both [`stdout`](#stdout-1) and [`stderr`](#stderr-1) options are set to [`'inherit'`, `'ignore'`, `Stream` or `integer`](https://nodejs.org/api/child_process.html#child_process_options_stdio)

#### pipe(file, arguments?, options?)

`file`: `string | URL`\
`arguments`: `string[]`\
`options`: [`Options`](#options-1) and [`PipeOptions`](#pipeoptions)\
_Returns_: [`Promise<SubprocessResult>`](#subprocessresult)

[Pipe](https://nodejs.org/api/stream.html#readablepipedestination-options) the subprocess' `stdout` to a second Execa subprocess' `stdin`. This resolves with that second subprocess' [result](#subprocessresult). If either subprocess is rejected, this is rejected with that subprocess' [error](#execaerror) instead.

This follows the same syntax as [`execa(file, arguments?, options?)`](#execafile-arguments-options) except both [regular options](#options-1) and [pipe-specific options](#pipeoptions) can be specified.

This can be called multiple times to chain a series of subprocesses.

Multiple subprocesses can be piped to the same subprocess. Conversely, the same subprocess can be piped to multiple other subprocesses.

This is usually the preferred method to pipe subprocesses.

#### pipe\`command\`
#### pipe(options)\`command\`

`command`: `string`\
`options`: [`Options`](#options-1) and [`PipeOptions`](#pipeoptions)\
_Returns_: [`Promise<SubprocessResult>`](#subprocessresult)

Like [`.pipe(file, arguments?, options?)`](#pipefile-arguments-options) but using a [`command` template string](docs/scripts.md#piping-stdout-to-another-command) instead. This follows the same syntax as [`$`](#command).

This is the preferred method to pipe subprocesses when using [`$`](#command).

#### pipe(secondSubprocess, pipeOptions?)

`secondSubprocess`: [`execa()` return value](#subprocess)\
`pipeOptions`: [`PipeOptions`](#pipeoptions)\
_Returns_: [`Promise<SubprocessResult>`](#subprocessresult)

Like [`.pipe(file, arguments?, options?)`](#pipefile-arguments-options) but using the [return value](#subprocess) of another `execa()` call instead.

This is the most advanced method to pipe subprocesses. It is useful in specific cases, such as piping multiple subprocesses to the same subprocess.

##### pipeOptions

Type: `object`

##### pipeOptions.from

Type: `"stdout" | "stderr" | "all" | number`\
Default: `"stdout"`

Which stream to pipe from the source subprocess. A file descriptor number can also be passed.

`"all"` pipes both `stdout` and `stderr`. This requires the [`all` option](#all-2) to be `true`.

##### pipeOptions.to

Type: `"stdin" | number`\
Default: `"stdin"`

Which stream to pipe to the destination subprocess. A file descriptor number can also be passed.

##### pipeOptions.unpipeSignal

Type: [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)

Unpipe the subprocess when the signal aborts.

The [`.pipe()`](#pipefile-arguments-options) method will be rejected with a cancellation error.

#### kill(signal, error?)
#### kill(error?)

`signal`: `string | number`\
`error`: `Error`\
_Returns_: `boolean`

Sends a [signal](https://nodejs.org/api/os.html#signal-constants) to the subprocess. The default signal is the [`killSignal`](#killsignal) option. `killSignal` defaults to `SIGTERM`, which [terminates](#isterminated) the subprocess.

This returns `false` when the signal could not be sent, for example when the subprocess has already exited.

When an error is passed as argument, it is set to the subprocess' [`error.cause`](#cause). The subprocess is then terminated with the default signal. This does not emit the [`error` event](https://nodejs.org/api/child_process.html#event-error).

[More info.](https://nodejs.org/api/child_process.html#subprocesskillsignal)

#### readable(streamOptions?)

`streamOptions`: [`StreamOptions`](#streamoptions)\
_Returns_: [`Readable`](https://nodejs.org/api/stream.html#class-streamreadable) Node.js stream

Converts the subprocess to a readable stream.

Unlike [`subprocess.stdout`](https://nodejs.org/api/child_process.html#subprocessstdout), the stream waits for the subprocess to end and emits an [`error`](https://nodejs.org/api/stream.html#event-error) event if the subprocess [fails](#subprocessresult). This means you do not need to `await` the subprocess' [promise](#subprocess). On the other hand, you do need to handle to the stream `error` event. This can be done by using [`await finished(stream)`](https://nodejs.org/api/stream.html#streamfinishedstream-options), [`await pipeline(..., stream)`](https://nodejs.org/api/stream.html#streampipelinesource-transforms-destination-options) or [`await text(stream)`](https://nodejs.org/api/webstreams.html#streamconsumerstextstream) which throw an exception when the stream errors.

Before using this method, please first consider the [`stdin`](#stdin)/[`stdout`](#stdout-1)/[`stderr`](#stderr-1)/[`stdio`](#stdio-1) options or the [`subprocess.pipe()`](#pipefile-arguments-options) method.

#### writable(streamOptions?)

`streamOptions`: [`StreamOptions`](#streamoptions)\
_Returns_: [`Writable`](https://nodejs.org/api/stream.html#class-streamwritable) Node.js stream

Converts the subprocess to a writable stream.

Unlike [`subprocess.stdin`](https://nodejs.org/api/child_process.html#subprocessstdin), the stream waits for the subprocess to end and emits an [`error`](https://nodejs.org/api/stream.html#event-error) event if the subprocess [fails](#subprocessresult). This means you do not need to `await` the subprocess' [promise](#subprocess). On the other hand, you do need to handle to the stream `error` event. This can be done by using [`await finished(stream)`](https://nodejs.org/api/stream.html#streamfinishedstream-options) or [`await pipeline(stream, ...)`](https://nodejs.org/api/stream.html#streampipelinesource-transforms-destination-options) which throw an exception when the stream errors.

Before using this method, please first consider the [`stdin`](#stdin)/[`stdout`](#stdout-1)/[`stderr`](#stderr-1)/[`stdio`](#stdio-1) options or the [`subprocess.pipe()`](#pipefile-arguments-options) method.

#### duplex(streamOptions?)

`streamOptions`: [`StreamOptions`](#streamoptions)\
_Returns_: [`Duplex`](https://nodejs.org/api/stream.html#class-streamduplex) Node.js stream

Converts the subprocess to a duplex stream.

The stream waits for the subprocess to end and emits an [`error`](https://nodejs.org/api/stream.html#event-error) event if the subprocess [fails](#subprocessresult). This means you do not need to `await` the subprocess' [promise](#subprocess). On the other hand, you do need to handle to the stream `error` event. This can be done by using [`await finished(stream)`](https://nodejs.org/api/stream.html#streamfinishedstream-options), [`await pipeline(..., stream, ...)`](https://nodejs.org/api/stream.html#streampipelinesource-transforms-destination-options) or [`await text(stream)`](https://nodejs.org/api/webstreams.html#streamconsumerstextstream) which throw an exception when the stream errors.

Before using this method, please first consider the [`stdin`](#stdin)/[`stdout`](#stdout-1)/[`stderr`](#stderr-1)/[`stdio`](#stdio-1) options or the [`subprocess.pipe()`](#pipefile-arguments-options) method.

##### streamOptions

Type: `object`

##### streamOptions.from

Type: `"stdout" | "stderr" | "all" | number`\
Default: `"stdout"`

Which stream to read from the subprocess. A file descriptor number can also be passed.

`"all"` reads both `stdout` and `stderr`. This requires the [`all` option](#all-2) to be `true`.

Only available with [`.readable()`](#readablestreamoptions) and [`.duplex()`](#duplexstreamoptions), not [`.writable()`](#writablestreamoptions).

##### streamOptions.to

Type: `"stdin" | number`\
Default: `"stdin"`

Which stream to write to the subprocess. A file descriptor number can also be passed.

Only available with [`.writable()`](#writablestreamoptions) and [`.duplex()`](#duplexstreamoptions), not [`.readable()`](#readablestreamoptions).

### SubprocessResult

Type: `object`

Result of a subprocess execution.

When the subprocess [fails](#failed), it is rejected with an [`ExecaError`](#execaerror) instead.

#### command

Type: `string`

The file and arguments that were run, for logging purposes.

This is not escaped and should not be executed directly as a subprocess, including using [`execa()`](#execafile-arguments-options) or [`execaCommand()`](#execacommandcommand-options).

#### escapedCommand

Type: `string`

Same as [`command`](#command-1) but escaped.

Unlike `command`, control characters are escaped, which makes it safe to print in a terminal.

This can also be copied and pasted into a shell, for debugging purposes.
Since the escaping is fairly basic, this should not be executed directly as a subprocess, including using [`execa()`](#execafile-arguments-options) or [`execaCommand()`](#execacommandcommand-options).

#### cwd

Type: `string`

The [current directory](#cwd-1) in which the command was run.

#### durationMs

Type: `number`

Duration of the subprocess, in milliseconds.

#### stdout

Type: `string | Uint8Array | string[] | Uint8Array[] | unknown[] | undefined`

The output of the subprocess on `stdout`.

This is `undefined` if the [`stdout`](#stdout-1) option is set to only [`'inherit'`, `'ignore'`, `Stream` or `integer`](https://nodejs.org/api/child_process.html#child_process_options_stdio). This is an array if the [`lines` option](#lines) is `true`, or if the `stdout` option is a [transform in object mode](docs/transform.md#object-mode).

#### stderr

Type: `string | Uint8Array | string[] | Uint8Array[] | unknown[] | undefined`

The output of the subprocess on `stderr`.

This is `undefined` if the [`stderr`](#stderr-1) option is set to only [`'inherit'`, `'ignore'`, `Stream` or `integer`](https://nodejs.org/api/child_process.html#child_process_options_stdio). This is an array if the [`lines` option](#lines) is `true`, or if the `stderr` option is a [transform in object mode](docs/transform.md#object-mode).

#### all

Type: `string | Uint8Array | string[] | Uint8Array[] | unknown[] | undefined`

The output of the subprocess with `stdout` and `stderr` [interleaved](#ensuring-all-output-is-interleaved).

This is `undefined` if either:
- the [`all` option](#all-2) is `false` (the default value)
- both [`stdout`](#stdout-1) and [`stderr`](#stderr-1) options are set to only [`'inherit'`, `'ignore'`, `Stream` or `integer`](https://nodejs.org/api/child_process.html#child_process_options_stdio)

This is an array if the [`lines` option](#lines) is `true`, or if either the `stdout` or `stderr` option is a [transform in object mode](docs/transform.md#object-mode).

#### stdio

Type: `Array<string | Uint8Array | string[] | Uint8Array[] | unknown[] | undefined>`

The output of the subprocess on [`stdin`](#stdin), [`stdout`](#stdout-1), [`stderr`](#stderr-1) and [other file descriptors](#stdio-1).

Items are `undefined` when their corresponding [`stdio`](#stdio-1) option is set to [`'inherit'`, `'ignore'`, `Stream` or `integer`](https://nodejs.org/api/child_process.html#child_process_options_stdio). Items are arrays when their corresponding `stdio` option is a [transform in object mode](docs/transform.md#object-mode).

#### failed

Type: `boolean`

Whether the subprocess failed to run.

#### timedOut

Type: `boolean`

Whether the subprocess timed out.

#### isCanceled

Type: `boolean`

Whether the subprocess was canceled using the [`cancelSignal`](#cancelsignal) option.

#### isTerminated

Type: `boolean`

Whether the subprocess was terminated by a signal (like `SIGTERM`) sent by either:
- The current process.
- Another process. This case is [not supported on Windows](https://nodejs.org/api/process.html#signal-events).

#### exitCode

Type: `number | undefined`

The numeric exit code of the subprocess that was run.

This is `undefined` when the subprocess could not be spawned or was terminated by a [signal](#signal).

#### signal

Type: `string | undefined`

The name of the signal (like `SIGTERM`) that terminated the subprocess, sent by either:
- The current process.
- Another process. This case is [not supported on Windows](https://nodejs.org/api/process.html#signal-events).

If a signal terminated the subprocess, this property is defined and included in the error message. Otherwise it is `undefined`.

#### signalDescription

Type: `string | undefined`

A human-friendly description of the signal that was used to terminate the subprocess. For example, `Floating point arithmetic error`.

If a signal terminated the subprocess, this property is defined and included in the error message. Otherwise it is `undefined`. It is also `undefined` when the signal is very uncommon which should seldomly happen.

#### pipedFrom

Type: [`Array<SubprocessResult | ExecaError>`](#subprocessresult)

Results of the other subprocesses that were [piped](#pipe-multiple-subprocesses) into this subprocess. This is useful to inspect a series of subprocesses piped with each other.

This array is initially empty and is populated each time the [`.pipe()`](#pipefile-arguments-options) method resolves.

### ExecaError
### ExecaSyncError

Type: `Error`

Exception thrown when the subprocess [fails](#failed), either:
- its [exit code](#exitcode) is not `0`
- it was [terminated](#isterminated) with a [signal](#signal), including [`.kill()`](#killerror)
- [timing out](#timedout)
- [being canceled](#iscanceled)
- there's not enough memory or there are already too many subprocesses

This has the same shape as [successful results](#subprocessresult), with the following additional properties.

#### message

Type: `string`

Error message when the subprocess failed to run. In addition to the [underlying error message](#originalMessage), it also contains some information related to why the subprocess errored.

The subprocess [`stderr`](#stderr), [`stdout`](#stdout) and other [file descriptors' output](#stdio) are appended to the end, separated with newlines and not interleaved.

#### shortMessage

Type: `string`

This is the same as the [`message` property](#message) except it does not include the subprocess [`stdout`](#stdout)/[`stderr`](#stderr)/[`stdio`](#stdio).

#### originalMessage

Type: `string | undefined`

Original error message. This is the same as the `message` property excluding the subprocess [`stdout`](#stdout)/[`stderr`](#stderr)/[`stdio`](#stdio) and some additional information added by Execa.

This exists only if the subprocess exited due to an `error` event or a timeout.

#### cause

Type: `unknown | undefined`

Underlying error, if there is one. For example, this is set by [`.kill(error)`](#killerror).

This is usually an `Error` instance.

#### code

Type: `string | undefined`

Node.js-specific [error code](https://nodejs.org/api/errors.html#errorcode), when available.

### options

Type: `object`

This lists all Execa options, including some options which are the same as for [`child_process#spawn()`](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options)/[`child_process#exec()`](https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback).

#### reject

Type: `boolean`\
Default: `true`

Setting this to `false` resolves the promise with the [error](#execaerror) instead of rejecting it.

#### shell

Type: `boolean | string | URL`\
Default: `false`

If `true`, runs `file` inside of a shell. Uses `/bin/sh` on UNIX and `cmd.exe` on Windows. A different shell can be specified as a string. The shell should understand the `-c` switch on UNIX or `/d /s /c` on Windows.

We recommend against using this option since it is:
- not cross-platform, encouraging shell-specific syntax.
- slower, because of the additional shell interpretation.
- unsafe, potentially allowing command injection.

#### cwd

Type: `string | URL`\
Default: `process.cwd()`

Current working directory of the subprocess.

This is also used to resolve the [`nodePath`](#nodepath) option when it is a relative path.

#### env

Type: `object`\
Default: `process.env`

Environment key-value pairs.

Unless the [`extendEnv` option](#extendenv) is `false`, the subprocess also uses the current process' environment variables ([`process.env`](https://nodejs.org/api/process.html#processenv)).

#### extendEnv

Type: `boolean`\
Default: `true`

If `true`, the subprocess uses both the [`env` option](#env) and the current process' environment variables ([`process.env`](https://nodejs.org/api/process.html#processenv)).
If `false`, only the `env` option is used, not `process.env`.

#### preferLocal

Type: `boolean`\
Default: `true` with [`$`](#command), `false` otherwise

Prefer locally installed binaries when looking for a binary to execute.\
If you `$ npm install foo`, you can then `execa('foo')`.

#### localDir

Type: `string | URL`\
Default: `process.cwd()`

Preferred path to find locally installed binaries in (use with `preferLocal`).

#### node

Type: `boolean`\
Default: `true` with [`execaNode()`](#execanodescriptpath-arguments-options), `false` otherwise

If `true`, runs with Node.js. The first argument must be a Node.js file.

#### nodeOptions

Type: `string[]`\
Default: [`process.execArgv`](https://nodejs.org/api/process.html#process_process_execargv) (current Node.js CLI options)

List of [CLI options](https://nodejs.org/api/cli.html#cli_options) passed to the [Node.js executable](#nodepath).

Requires the [`node`](#node) option to be `true`.

#### nodePath

Type: `string | URL`\
Default: [`process.execPath`](https://nodejs.org/api/process.html#process_process_execpath) (current Node.js executable)

Path to the Node.js executable.

For example, this can be used together with [`get-node`](https://github.com/ehmicky/get-node) to run a specific Node.js version.

Requires the [`node`](#node) option to be `true`.

#### verbose

Type: `'none' | 'short' | 'full'`\
Default: `'none'`

If `verbose` is `'short'` or `'full'`, [prints each command](#verbose-mode) on `stderr` before executing it. When the command completes, prints its duration and (if it failed) its error.

If `verbose` is `'full'`, the command's `stdout` and `stderr` are printed too, unless either:
- the [`stdout`](#stdout-1)/[`stderr`](#stderr-1) option is `ignore` or `inherit`.
- the `stdout`/`stderr` is redirected to [a stream](https://nodejs.org/api/stream.html#readablepipedestination-options), [a file](#stdout-1), a file descriptor, or [another subprocess](#pipefile-arguments-options).
- the [`encoding`](#encoding) option is set.

This can also be set to `'full'` by setting the `NODE_DEBUG=execa` environment variable in the current process.

#### buffer

Type: `boolean`\
Default: `true`

Whether to return the subprocess' output using the [`result.stdout`](#stdout), [`result.stderr`](#stderr), [`result.all`](#all-1) and [`result.stdio`](#stdio) properties.

On failure, the [`error.stdout`](#stdout), [`error.stderr`](#stderr), [`error.all`](#all-1) and [`error.stdio`](#stdio) properties are used instead.

When `buffer` is `false`, the output can still be read using the [`subprocess.stdout`](#stdout-1), [`subprocess.stderr`](#stderr-1), [`subprocess.stdio`](https://nodejs.org/api/child_process.html#subprocessstdio) and [`subprocess.all`](#all) streams. If the output is read, this should be done right away to avoid missing any data.

#### input

Type: `string | Uint8Array | stream.Readable`

Write some input to the subprocess' `stdin`.

See also the [`inputFile`](#inputfile) and [`stdin`](#stdin) options.

#### inputFile

Type: `string | URL`

Use a file as input to the subprocess' `stdin`.

See also the [`input`](#input) and [`stdin`](#stdin) options.

#### stdin

Type: `string | number | stream.Readable | ReadableStream | URL | Uint8Array | Iterable<string> | Iterable<Uint8Array> | Iterable<unknown> | AsyncIterable<string> | AsyncIterable<Uint8Array> | AsyncIterable<unknown> | GeneratorFunction<string> | GeneratorFunction<Uint8Array> | GeneratorFunction<unknown>| AsyncGeneratorFunction<string> | AsyncGeneratorFunction<Uint8Array> | AsyncGeneratorFunction<unknown>` (or a tuple of those types)\
Default: `inherit` with [`$`](#command), `pipe` otherwise

[How to setup](https://nodejs.org/api/child_process.html#child_process_options_stdio) the subprocess' standard input. This can be:
- `'pipe'`: Sets [`subprocess.stdin`](https://nodejs.org/api/child_process.html#subprocessstdin) stream.
- `'overlapped'`: Like `'pipe'` but asynchronous on Windows.
- `'ignore'`: Do not use `stdin`.
- `'inherit'`: Re-use the current process' `stdin`.
- an integer: Re-use a specific file descriptor from the current process.
- a [Node.js `Readable` stream](#redirect-a-nodejs-stream-fromto-stdinstdoutstderr).
- `{ file: 'path' }` object.
- a file URL.
- a web [`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream).
- an [`Iterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterable_protocol) or an [`AsyncIterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_async_iterator_and_async_iterable_protocols)
- an `Uint8Array`.

This can be an [array of values](#redirect-stdinstdoutstderr-to-multiple-destinations) such as `['inherit', 'pipe']` or `[filePath, 'pipe']`.

This can also be a generator function to transform the input. [Learn more.](docs/transform.md)

#### stdout

Type: `string | number | stream.Writable | WritableStream | URL | GeneratorFunction<string> | GeneratorFunction<Uint8Array> | GeneratorFunction<unknown>| AsyncGeneratorFunction<string> | AsyncGeneratorFunction<Uint8Array> | AsyncGeneratorFunction<unknown>` (or a tuple of those types)\
Default: `pipe`

[How to setup](https://nodejs.org/api/child_process.html#child_process_options_stdio) the subprocess' standard output. This can be:
- `'pipe'`: Sets [`subprocessResult.stdout`](#stdout) (as a string or `Uint8Array`) and [`subprocess.stdout`](https://nodejs.org/api/child_process.html#subprocessstdout) (as a stream).
- `'overlapped'`: Like `'pipe'` but asynchronous on Windows.
- `'ignore'`: Do not use `stdout`.
- `'inherit'`: Re-use the current process' `stdout`.
- an integer: Re-use a specific file descriptor from the current process.
- a [Node.js `Writable` stream](#redirect-a-nodejs-stream-fromto-stdinstdoutstderr).
- `{ file: 'path' }` object.
- a file URL.
- a web [`WritableStream`](https://developer.mozilla.org/en-US/docs/Web/API/WritableStream).

This can be an [array of values](#redirect-stdinstdoutstderr-to-multiple-destinations) such as `['inherit', 'pipe']` or `[filePath, 'pipe']`.

This can also be a generator function to transform the output. [Learn more.](docs/transform.md)

#### stderr

Type: `string | number | stream.Writable | WritableStream | URL | GeneratorFunction<string> | GeneratorFunction<Uint8Array> | GeneratorFunction<unknown>| AsyncGeneratorFunction<string> | AsyncGeneratorFunction<Uint8Array> | AsyncGeneratorFunction<unknown>` (or a tuple of those types)\
Default: `pipe`

[How to setup](https://nodejs.org/api/child_process.html#child_process_options_stdio) the subprocess' standard error. This can be:
- `'pipe'`: Sets [`subprocessResult.stderr`](#stderr) (as a string or `Uint8Array`) and [`subprocess.stderr`](https://nodejs.org/api/child_process.html#subprocessstderr) (as a stream).
- `'overlapped'`: Like `'pipe'` but asynchronous on Windows.
- `'ignore'`: Do not use `stderr`.
- `'inherit'`: Re-use the current process' `stderr`.
- an integer: Re-use a specific file descriptor from the current process.
- a [Node.js `Writable` stream](#redirect-a-nodejs-stream-fromto-stdinstdoutstderr).
- `{ file: 'path' }` object.
- a file URL.
- a web [`WritableStream`](https://developer.mozilla.org/en-US/docs/Web/API/WritableStream).

This can be an [array of values](#redirect-stdinstdoutstderr-to-multiple-destinations) such as `['inherit', 'pipe']` or `[filePath, 'pipe']`.

This can also be a generator function to transform the output. [Learn more.](docs/transform.md)

#### stdio

Type: `string | Array<string | number | stream.Readable | stream.Writable | ReadableStream | WritableStream | URL | Uint8Array | Iterable<string> | Iterable<Uint8Array> | Iterable<unknown> | AsyncIterable<string> | AsyncIterable<Uint8Array> | AsyncIterable<unknown> | GeneratorFunction<string> | GeneratorFunction<Uint8Array> | GeneratorFunction<unknown>| AsyncGeneratorFunction<string> | AsyncGeneratorFunction<Uint8Array> | AsyncGeneratorFunction<unknown>>` (or a tuple of those types)\
Default: `pipe`

Like the [`stdin`](#stdin), [`stdout`](#stdout-1) and [`stderr`](#stderr-1) options but for all file descriptors at once. For example, `{stdio: ['ignore', 'pipe', 'pipe']}` is the same as `{stdin: 'ignore', stdout: 'pipe', stderr: 'pipe'}`.

A single string can be used as a shortcut. For example, `{stdio: 'pipe'}` is the same as `{stdin: 'pipe', stdout: 'pipe', stderr: 'pipe'}`.

The array can have more than 3 items, to create additional file descriptors beyond `stdin`/`stdout`/`stderr`. For example, `{stdio: ['pipe', 'pipe', 'pipe', 'pipe']}` sets a fourth file descriptor.

#### all

Type: `boolean`\
Default: `false`

Add an `.all` property on the [promise](#all) and the [resolved value](#all-1). The property contains the output of the subprocess with `stdout` and `stderr` [interleaved](#ensuring-all-output-is-interleaved).

#### lines

Type: `boolean`\
Default: `false`

Split `stdout` and `stderr` into lines.
- [`result.stdout`](#stdout), [`result.stderr`](#stderr), [`result.all`](#all-1) and [`result.stdio`](#stdio) are arrays of lines.
- [`subprocess.stdout`](https://nodejs.org/api/child_process.html#subprocessstdout), [`subprocess.stderr`](https://nodejs.org/api/child_process.html#subprocessstderr), [`subprocess.all`](#all), [`subprocess.stdio`](https://nodejs.org/api/child_process.html#subprocessstdio), [`subprocess.readable()`](#readablestreamoptions) and [`subprocess.duplex`](#duplexstreamoptions) iterate over lines instead of arbitrary chunks.
- Any stream passed to the [`stdout`](#stdout-1), [`stderr`](#stderr-1) or [`stdio`](#stdio-1) option receives lines instead of arbitrary chunks.

#### encoding

Type: `string`\
Default: `utf8`

Specify the character encoding used to decode the [`stdout`](#stdout), [`stderr`](#stderr) and [`stdio`](#stdio) output. If set to `'buffer'`, then `stdout`, `stderr` and `stdio` will be `Uint8Array`s instead of strings.

#### stripFinalNewline

Type: `boolean`\
Default: `true`

Strip the final [newline character](https://en.wikipedia.org/wiki/Newline) from the output.

#### maxBuffer

Type: `number`\
Default: `100_000_000` (100 MB)

Largest amount of data in bytes allowed on [`stdout`](#stdout), [`stderr`](#stderr) and [`stdio`](#stdio).

#### ipc

Type: `boolean`\
Default: `true` if the [`node`](#node) option is enabled, `false` otherwise

Enables exchanging messages with the subprocess using [`subprocess.send(value)`](https://nodejs.org/api/child_process.html#subprocesssendmessage-sendhandle-options-callback) and [`subprocess.on('message', (value) => {})`](https://nodejs.org/api/child_process.html#event-message).

#### serialization

Type: `string`\
Default: `'advanced'`

Specify the kind of serialization used for sending messages between subprocesses when using the [`ipc`](#ipc) option:
	- `json`: Uses `JSON.stringify()` and `JSON.parse()`.
	- `advanced`: Uses [`v8.serialize()`](https://nodejs.org/api/v8.html#v8_v8_serialize_value)

[More info.](https://nodejs.org/api/child_process.html#child_process_advanced_serialization)

#### detached

Type: `boolean`\
Default: `false`

Prepare subprocess to run independently of the current process. Specific behavior [depends on the platform](https://nodejs.org/api/child_process.html#child_process_options_detached).

#### cleanup

Type: `boolean`\
Default: `true`

Kill the subprocess when the current process exits unless either:
	- the subprocess is [`detached`](https://nodejs.org/api/child_process.html#child_process_options_detached)
	- the current process is terminated abruptly, for example, with `SIGKILL` as opposed to `SIGTERM` or a normal exit

#### timeout

Type: `number`\
Default: `0`

If `timeout` is greater than `0`, the subprocess will be [terminated](#killsignal) if it runs for longer than that amount of milliseconds.

#### cancelSignal

Type: [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)

You can abort the subprocess using [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).

When `AbortController.abort()` is called, [`.isCanceled`](#iscanceled) becomes `true`.

#### forceKillAfterDelay

Type: `number | false`\
Default: `5000`

If the subprocess is terminated but does not exit, forcefully exit it by sending [`SIGKILL`](https://en.wikipedia.org/wiki/Signal_(IPC)#SIGKILL).

The grace period is 5 seconds by default. This feature can be disabled with `false`.

This works when the subprocess is terminated by either:
- the [`cancelSignal`](#cancelsignal), [`timeout`](#timeout), [`maxBuffer`](#maxbuffer) or [`cleanup`](#cleanup) option
- calling [`subprocess.kill()`](https://nodejs.org/api/child_process.html#subprocesskillsignal) with no arguments

This does not work when the subprocess is terminated by either:
- calling [`subprocess.kill()`](https://nodejs.org/api/child_process.html#subprocesskillsignal) with an argument
- calling [`process.kill(subprocess.pid)`](https://nodejs.org/api/process.html#processkillpid-signal)
- sending a termination signal from another process

Also, this does not work on Windows, because Windows [doesn't support signals](https://nodejs.org/api/process.html#process_signal_events): `SIGKILL` and `SIGTERM` both terminate the subprocess immediately. Other packages (such as [`taskkill`](https://github.com/sindresorhus/taskkill)) can be used to achieve fail-safe termination on Windows.

#### killSignal

Type: `string | number`\
Default: `SIGTERM`

Signal used to terminate the subprocess when:
- using the [`cancelSignal`](#cancelsignal), [`timeout`](#timeout), [`maxBuffer`](#maxbuffer) or [`cleanup`](#cleanup) option
- calling [`subprocess.kill()`](https://nodejs.org/api/child_process.html#subprocesskillsignal) with no arguments

This can be either a name (like `"SIGTERM"`) or a number (like `9`).

#### argv0

Type: `string`

Explicitly set the value of `argv[0]` sent to the subprocess. This will be set to `file` if not specified.

#### uid

Type: `number`

Sets the user identity of the subprocess.

#### gid

Type: `number`

Sets the group identity of the subprocess.

#### windowsVerbatimArguments

Type: `boolean`\
Default: `false`

If `true`, no quoting or escaping of arguments is done on Windows. Ignored on other platforms. This is set to `true` automatically when the `shell` option is `true`.

#### windowsHide

Type: `boolean`\
Default: `true`

On Windows, do not create a new console window. Please note this also prevents `CTRL-C` [from working](https://github.com/nodejs/node/issues/29837) on Windows.

## Tips

### Redirect stdin/stdout/stderr to multiple destinations

The [`stdin`](#stdin), [`stdout`](#stdout-1) and [`stderr`](#stderr-1) options can be an array of values.
The following example redirects `stdout` to both the terminal and an `output.txt` file, while also retrieving its value programmatically.

```js
const {stdout} = await execa('npm', ['install'], {stdout: ['inherit', './output.txt', 'pipe']});
console.log(stdout);
```

When combining `inherit` with other values, please note that the subprocess will not be an interactive TTY, even if the current process is one.

### Redirect a Node.js stream from/to stdin/stdout/stderr

When passing a Node.js stream to the [`stdin`](#stdin), [`stdout`](#stdout-1) or [`stderr`](#stderr-1) option, Node.js requires that stream to have an underlying file or socket, such as the streams created by the `fs`, `net` or `http` core modules. Otherwise the following error is thrown.

```
TypeError [ERR_INVALID_ARG_VALUE]: The argument 'stdio' is invalid.
```

This limitation can be worked around by passing either:
  - a web stream ([`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream) or [`WritableStream`](https://developer.mozilla.org/en-US/docs/Web/API/WritableStream))
  - `[nodeStream, 'pipe']` instead of `nodeStream`

```diff
- await execa(..., {stdout: nodeStream});
+ await execa(..., {stdout: [nodeStream, 'pipe']});
```

### Retry on error

Safely handle failures by using automatic retries and exponential backoff with the [`p-retry`](https://github.com/sindresorhus/p-retry) package:

```js
import pRetry from 'p-retry';

const run = async () => {
	const results = await execa('curl', ['-sSL', 'https://sindresorhus.com/unicorn']);
	return results;
};

console.log(await pRetry(run, {retries: 5}));
```

### Cancelling a subprocess

```js
import {execa} from 'execa';

const abortController = new AbortController();
const subprocess = execa('node', [], {cancelSignal: abortController.signal});

setTimeout(() => {
	abortController.abort();
}, 1000);

try {
	await subprocess;
} catch (error) {
	console.log(error.isTerminated); // true
	console.log(error.isCanceled); // true
}
```

### Execute the current package's binary

Execa can be combined with [`get-bin-path`](https://github.com/ehmicky/get-bin-path) to test the current package's binary. As opposed to hard-coding the path to the binary, this validates that the `package.json` `bin` field is correctly set up.

```js
import {getBinPath} from 'get-bin-path';

const binPath = await getBinPath();
await execa(binPath);
```

### Ensuring `all` output is interleaved

The `all` [stream](#all) and [string/`Uint8Array`](#all-1) properties are guaranteed to interleave [`stdout`](#stdout) and [`stderr`](#stderr).

However, for performance reasons, the subprocess might buffer and merge multiple simultaneous writes to `stdout` or `stderr`. This prevents proper interleaving.

For example, this prints `1 3 2` instead of `1 2 3` because both `console.log()` are merged into a single write.

```js
import {execa} from 'execa';

const {all} = await execa('node', ['example.js'], {all: true});
console.log(all);
```

```js
// example.js
console.log('1'); // writes to stdout
console.error('2'); // writes to stderr
console.log('3'); // writes to stdout
```

This can be worked around by using `setTimeout()`.

```js
import {setTimeout} from 'timers/promises';

console.log('1');
console.error('2');
await setTimeout(0);
console.log('3');
```

## Related

- [gulp-execa](https://github.com/ehmicky/gulp-execa) - Gulp plugin for Execa
- [nvexeca](https://github.com/ehmicky/nvexeca) - Run Execa using any Node.js version

## Maintainers

- [Sindre Sorhus](https://github.com/sindresorhus)
- [@ehmicky](https://github.com/ehmicky)
