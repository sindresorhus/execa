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

- [Promise interface](#execafile-arguments-options).
- [Script interface](docs/scripts.md) and [template strings](#template-string-syntax), like `zx`.
- Improved [Windows support](https://github.com/IndigoUnited/node-cross-spawn#why), including [shebang](https://en.wikipedia.org/wiki/Shebang_(Unix)) binaries.
- Executes [locally installed binaries](#optionspreferlocal) without `npx`.
- [Cleans up](#optionscleanup) subprocesses when the current process ends.
- Redirect [`stdin`](#optionsstdin)/[`stdout`](#optionsstdout)/[`stderr`](#optionsstderr) from/to files, streams, iterables, strings, `Uint8Array` or [objects](docs/transform.md#object-mode).
- [Transform](docs/transform.md) `stdin`/`stdout`/`stderr` with simple functions.
- Iterate over [each text line](docs/transform.md#binary-data) output by the subprocess.
- [Fail-safe subprocess termination](#optionsforcekillafterdelay).
- Get [interleaved output](#optionsall) from `stdout` and `stderr` similar to what is printed on the terminal.
- [Strips the final newline](#optionsstripfinalnewline) from the output so you don't have to do `stdout.trim()`.
- Convenience methods to pipe subprocesses' [input](#redirect-input-from-a-file) and [output](#redirect-output-to-a-file).
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

#### Global/shared options

```js
import {execa as execa_} from 'execa';

const execa = execa_({verbose: 'full'});

await execa('echo', ['unicorns']);
//=> 'unicorns'
```

### Template string syntax

#### Basic

```js
import {execa} from 'execa';

const arg = 'unicorns';
const {stdout} = await execa`echo ${arg} & rainbows!`;
console.log(stdout);
//=> 'unicorns & rainbows!'
```

#### Multiple arguments

```js
import {execa} from 'execa';

const args = ['unicorns', '&', 'rainbows!'];
const {stdout} = await execa`echo ${args}`;
console.log(stdout);
//=> 'unicorns & rainbows!'
```

#### With options

```js
import {execa} from 'execa';

await execa({verbose: 'full'})`echo unicorns`;
//=> 'unicorns'
```

### Scripts

For more information about Execa scripts, please see [this page](docs/scripts.md).

#### Basic

```js
import {$} from 'execa';

const branch = await $`git branch --show-current`;
await $`dep deploy --branch=${branch}`;
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

#### Pipe with template strings

```js
import {execa} from 'execa';

await execa`npm run build`
	.pipe`sort`
	.pipe`head -n2`;
```

#### Iterate over output lines

```js
import {execa} from 'execa';

for await (const line of execa`npm run build`)) {
	if (line.includes('ERROR')) {
		console.log(line);
	}
}
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
		isMaxBuffer: false,
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
`options`: [`Options`](#options)\
_Returns_: [`Subprocess`](#subprocess)

Executes a command using `file ...arguments`.

Arguments are [automatically escaped](#shell-syntax). They can contain any character, including spaces, tabs and newlines.

#### execa\`command\`
#### execa(options)\`command\`

`command`: `string`\
`options`: [`Options`](#options)\
_Returns_: [`Subprocess`](#subprocess)

Executes a command. `command` is a [template string](#template-string-syntax) and includes both the `file` and its `arguments`.

The `command` template string can inject any `${value}` with the following types: string, number, [`subprocess`](#subprocess) or an array of those types. For example: `` execa`echo one ${'two'} ${3} ${['four', 'five']}` ``. For `${subprocess}`, the subprocess's [`stdout`](#resultstdout) is used.

Arguments are [automatically escaped](#shell-syntax). They can contain any character, but spaces, tabs and newlines must use `${}` like `` execa`echo ${'has space'}` ``.

The `command` template string can use [multiple lines and indentation](docs/scripts.md#multiline-commands).

#### execa(options)

`options`: [`Options`](#options)\
_Returns_: [`execa`](#execafile-arguments-options)

Returns a new instance of Execa but with different default [`options`](#options). Consecutive calls are merged to previous ones.

This allows setting global options or [sharing options](#globalshared-options) between multiple commands.

#### execaSync(file, arguments?, options?)
#### execaSync\`command\`

Same as [`execa()`](#execafile-arguments-options) but synchronous.

Returns or throws a subprocess [`result`](#result). The [`subprocess`](#subprocess) is not returned: its methods and properties are not available.

The following features cannot be used:
- Streams: [`subprocess.stdin`](#subprocessstdin), [`subprocess.stdout`](#subprocessstdout), [`subprocess.stderr`](#subprocessstderr), [`subprocess.readable()`](#subprocessreadablereadableoptions), [`subprocess.writable()`](#subprocesswritablewritableoptions), [`subprocess.duplex()`](#subprocessduplexduplexoptions).
- The [`stdin`](#optionsstdin), [`stdout`](#optionsstdout), [`stderr`](#optionsstderr) and [`stdio`](#optionsstdio) options cannot be [`'overlapped'`](#optionsstdout), an async iterable, an async [transform](docs/transform.md), a [`Duplex`](docs/transform.md#duplextransform-streams), nor a web stream. Node.js streams can be passed but only if either they [have a file descriptor](#redirect-a-nodejs-stream-fromto-stdinstdoutstderr), or the `input` option is used.
- Signal termination: [`subprocess.kill()`](#subprocesskillerror), [`subprocess.pid`](#subprocesspid), [`cleanup`](#optionscleanup) option, [`cancelSignal`](#optionscancelsignal) option, [`forceKillAfterDelay`](#optionsforcekillafterdelay) option.
- Piping multiple processes: [`subprocess.pipe()`](#subprocesspipefile-arguments-options).
- [`subprocess.iterable()`](#subprocessiterablereadableoptions).
- [`ipc`](#optionsipc) and [`serialization`](#optionsserialization) options.
- [`result.all`](#resultall) is not interleaved.
- [`detached`](#optionsdetached) option.
- The [`maxBuffer`](#optionsmaxbuffer) option is always measured in bytes, not in characters, [lines](#optionslines) nor [objects](docs/transform.md#object-mode). Also, it ignores transforms and the [`encoding`](#optionsencoding) option.

#### $(file, arguments?, options?)

`file`: `string | URL`\
`arguments`: `string[]`\
`options`: [`Options`](#options)\
_Returns_: [`Subprocess`](#subprocess)

Same as [`execa()`](#execafile-arguments-options) but using the [`stdin: 'inherit'`](#optionsstdin) and [`preferLocal: true`](#optionspreferlocal) options.

Just like `execa()`, this can use the [template string syntax](#execacommand) or [bind options](#execaoptions). It can also be [run synchronously](#execasyncfile-arguments-options) using `$.sync()` or `$.s()`.

This is the preferred method when executing multiple commands in a script file. For more information, please see [this page](docs/scripts.md).

#### execaNode(scriptPath, arguments?, options?)

`scriptPath`: `string | URL`\
`arguments`: `string[]`\
`options`: [`Options`](#options)\
_Returns_: [`Subprocess`](#subprocess)

Same as [`execa()`](#execafile-arguments-options) but using the [`node: true`](#optionsnode) option.
Executes a Node.js file using `node scriptPath ...arguments`.

Just like `execa()`, this can use the [template string syntax](#execacommand) or [bind options](#execaoptions).

This is the preferred method when executing Node.js files.

#### execaCommand(command, options?)

`command`: `string`\
`options`: [`Options`](#options)\
_Returns_: [`Subprocess`](#subprocess)

[`execa`](#execafile-arguments-options) with the [template string syntax](#execacommand) allows the `file` or the `arguments` to be user-defined (by injecting them with `${}`). However, if _both_ the `file` and the `arguments` are user-defined, _and_ those are supplied as a single string, then `execaCommand(command)` must be used instead.

This is only intended for very specific cases, such as a REPL. This should be avoided otherwise.

Just like `execa()`, this can [bind options](#execaoptions). It can also be [run synchronously](#execasyncfile-arguments-options) using `execaCommandSync()`.

Arguments are [automatically escaped](#shell-syntax). They can contain any character, but spaces must be escaped with a backslash like `execaCommand('echo has\\ space')`.

### Shell syntax

For all the [methods above](#methods), no shell interpreter (Bash, cmd.exe, etc.) is used unless the [`shell`](#optionsshell) option is set. This means shell-specific characters and expressions (`$variable`, `&&`, `||`, `;`, `|`, etc.) have no special meaning and do not need to be escaped.

### subprocess

The return value of all [asynchronous methods](#methods) is both:
- a `Promise` resolving or rejecting with a subprocess [`result`](#result).
- a [`child_process` instance](https://nodejs.org/api/child_process.html#child_process_class_childprocess) with the following methods and properties.

#### subprocess.pipe(file, arguments?, options?)

`file`: `string | URL`\
`arguments`: `string[]`\
`options`: [`Options`](#options) and [`PipeOptions`](#pipeoptions)\
_Returns_: [`Promise<Result>`](#result)

[Pipe](https://nodejs.org/api/stream.html#readablepipedestination-options) the subprocess' `stdout` to a second Execa subprocess' `stdin`. This resolves with that second subprocess' [result](#result). If either subprocess is rejected, this is rejected with that subprocess' [error](#execaerror) instead.

This follows the same syntax as [`execa(file, arguments?, options?)`](#execafile-arguments-options) except both [regular options](#options) and [pipe-specific options](#pipeoptions) can be specified.

This can be called multiple times to chain a series of subprocesses.

Multiple subprocesses can be piped to the same subprocess. Conversely, the same subprocess can be piped to multiple other subprocesses.

#### subprocess.pipe\`command\`
#### subprocess.pipe(options)\`command\`

`command`: `string`\
`options`: [`Options`](#options) and [`PipeOptions`](#pipeoptions)\
_Returns_: [`Promise<Result>`](#result)

Like [`subprocess.pipe(file, arguments?, options?)`](#subprocesspipefile-arguments-options) but using a [`command` template string](docs/scripts.md#piping-stdout-to-another-command) instead. This follows the same syntax as `execa` [template strings](#execacommand).

#### subprocess.pipe(secondSubprocess, pipeOptions?)

`secondSubprocess`: [`execa()` return value](#subprocess)\
`pipeOptions`: [`PipeOptions`](#pipeoptions)\
_Returns_: [`Promise<Result>`](#result)

Like [`subprocess.pipe(file, arguments?, options?)`](#subprocesspipefile-arguments-options) but using the [return value](#subprocess) of another `execa()` call instead.

This is the most advanced method to pipe subprocesses. It is useful in specific cases, such as piping multiple subprocesses to the same subprocess.

##### pipeOptions

Type: `object`

##### pipeOptions.from

Type: `"stdout" | "stderr" | "all" | "fd3" | "fd4" | ...`\
Default: `"stdout"`

Which stream to pipe from the source subprocess. A file descriptor like `"fd3"` can also be passed.

`"all"` pipes both `stdout` and `stderr`. This requires the [`all`](#optionsall) option to be `true`.

##### pipeOptions.to

Type: `"stdin" | "fd3" | "fd4" | ...`\
Default: `"stdin"`

Which stream to pipe to the destination subprocess. A file descriptor like `"fd3"` can also be passed.

##### pipeOptions.unpipeSignal

Type: [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)

Unpipe the subprocess when the signal aborts.

The [`subprocess.pipe()`](#subprocesspipefile-arguments-options) method will be rejected with a cancellation error.

#### subprocess.kill(signal, error?)
#### subprocess.kill(error?)

`signal`: `string | number`\
`error`: `Error`\
_Returns_: `boolean`

Sends a [signal](https://nodejs.org/api/os.html#signal-constants) to the subprocess. The default signal is the [`killSignal`](#optionskillsignal) option. `killSignal` defaults to `SIGTERM`, which [terminates](#resultisterminated) the subprocess.

This returns `false` when the signal could not be sent, for example when the subprocess has already exited.

When an error is passed as argument, it is set to the subprocess' [`error.cause`](#errorcause). The subprocess is then terminated with the default signal. This does not emit the [`error` event](https://nodejs.org/api/child_process.html#event-error).

[More info.](https://nodejs.org/api/child_process.html#subprocesskillsignal)

#### subprocess.pid

_Type_: `number | undefined`

Process identifier ([PID](https://en.wikipedia.org/wiki/Process_identifier)).

This is `undefined` if the subprocess failed to spawn.

#### subprocess.send(message)

`message`: `unknown`\
_Returns_: `boolean`

Send a `message` to the subprocess. The type of `message` depends on the [`serialization`](#optionsserialization) option.
The subprocess receives it as a [`message` event](https://nodejs.org/api/process.html#event-message).

This returns `true` on success.

This requires the [`ipc`](#optionsipc) option to be `true`.

[More info.](https://nodejs.org/api/child_process.html#subprocesssendmessage-sendhandle-options-callback)

#### subprocess.on('message', (message) => void)

`message`: `unknown`

Receives a `message` from the subprocess. The type of `message` depends on the [`serialization`](#optionsserialization) option.
The subprocess sends it using [`process.send(message)`](https://nodejs.org/api/process.html#processsendmessage-sendhandle-options-callback).

This requires the [`ipc`](#optionsipc) option to be `true`.

[More info.](https://nodejs.org/api/child_process.html#event-message)

#### subprocess.stdin

Type: [`Writable | null`](https://nodejs.org/api/stream.html#class-streamwritable)

The subprocess [`stdin`](#optionsstdin) as a stream.

This is `null` if the [`stdin`](#optionsstdin) option is set to `'inherit'`, `'ignore'`, `Readable` or `integer`.

This is intended for advanced cases. Please consider using the [`stdin`](#optionsstdin) option, [`input`](#optionsinput) option, [`inputFile`](#optionsinputfile) option, or [`subprocess.pipe()`](#subprocesspipefile-arguments-options) instead.

#### subprocess.stdout

Type: [`Readable | null`](https://nodejs.org/api/stream.html#class-streamreadable)

The subprocess [`stdout`](#optionsstdout) as a stream.

This is `null` if the [`stdout`](#optionsstdout) option is set to `'inherit'`, `'ignore'`, `Writable` or `integer`.

This is intended for advanced cases. Please consider using [`result.stdout`](#resultstdout), the [`stdout`](#optionsstdout) option, [`subprocess.iterable()`](#subprocessiterablereadableoptions), or [`subprocess.pipe()`](#subprocesspipefile-arguments-options) instead.

#### subprocess.stderr

Type: [`Readable | null`](https://nodejs.org/api/stream.html#class-streamreadable)

The subprocess [`stderr`](#optionsstderr) as a stream.

This is `null` if the [`stderr`](#optionsstdout) option is set to `'inherit'`, `'ignore'`, `Writable` or `integer`.

This is intended for advanced cases. Please consider using [`result.stderr`](#resultstderr), the [`stderr`](#optionsstderr) option, [`subprocess.iterable()`](#subprocessiterablereadableoptions), or [`subprocess.pipe()`](#subprocesspipefile-arguments-options) instead.

#### subprocess.all

Type: [`Readable | undefined`](https://nodejs.org/api/stream.html#class-streamreadable)

Stream [combining/interleaving](#ensuring-all-output-is-interleaved) [`subprocess.stdout`](#subprocessstdout) and [`subprocess.stderr`](#subprocessstderr).

This is `undefined` if either:
- the [`all`](#optionsall) option is `false` (the default value).
- both [`stdout`](#optionsstdout) and [`stderr`](#optionsstderr) options are set to `'inherit'`, `'ignore'`, `Writable` or `integer`.

This is intended for advanced cases. Please consider using [`result.all`](#resultall), the [`stdout`](#optionsstdout)/[`stderr`](#optionsstderr) option, [`subprocess.iterable()`](#subprocessiterablereadableoptions), or [`subprocess.pipe()`](#subprocesspipefile-arguments-options) instead.

#### subprocess.stdio

Type: [`[Writable | null, Readable | null, Readable | null, ...Array<Writable | Readable | null>]`](https://nodejs.org/api/stream.html#class-streamreadable)

The subprocess `stdin`, `stdout`, `stderr` and [other files descriptors](#optionsstdio) as an array of streams.

Each array item is `null` if the corresponding [`stdin`](#optionsstdin), [`stdout`](#optionsstdout), [`stderr`](#optionsstderr) or [`stdio`](#optionsstdio) option is set to `'inherit'`, `'ignore'`, `Stream` or `integer`.

This is intended for advanced cases. Please consider using [`result.stdio`](#resultstdio), the [`stdio`](#optionsstdio) option, [`subprocess.iterable()`](#subprocessiterablereadableoptions) or [`subprocess.pipe()`](#subprocesspipefile-arguments-options) instead.

#### subprocess\[Symbol.asyncIterator\]()

_Returns_: `AsyncIterable`

Subprocesses are [async iterables](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator). They iterate over each output line.

The iteration waits for the subprocess to end. It throws if the subprocess [fails](#result). This means you do not need to `await` the subprocess' [promise](#subprocess).

#### subprocess.iterable(readableOptions?)

`readableOptions`: [`ReadableOptions`](#readableoptions)\
_Returns_: `AsyncIterable`

Same as [`subprocess[Symbol.asyncIterator]`](#subprocesssymbolasynciterator) except [options](#readableoptions) can be provided.

#### subprocess.readable(readableOptions?)

`readableOptions`: [`ReadableOptions`](#readableoptions)\
_Returns_: [`Readable`](https://nodejs.org/api/stream.html#class-streamreadable) Node.js stream

Converts the subprocess to a readable stream.

Unlike [`subprocess.stdout`](#subprocessstdout), the stream waits for the subprocess to end and emits an [`error`](https://nodejs.org/api/stream.html#event-error) event if the subprocess [fails](#result). This means you do not need to `await` the subprocess' [promise](#subprocess). On the other hand, you do need to handle to the stream `error` event. This can be done by using [`await finished(stream)`](https://nodejs.org/api/stream.html#streamfinishedstream-options), [`await pipeline(..., stream)`](https://nodejs.org/api/stream.html#streampipelinesource-transforms-destination-options) or [`await text(stream)`](https://nodejs.org/api/webstreams.html#streamconsumerstextstream) which throw an exception when the stream errors.

Before using this method, please first consider the [`stdin`](#optionsstdin)/[`stdout`](#optionsstdout)/[`stderr`](#optionsstderr)/[`stdio`](#optionsstdio) options, [`subprocess.pipe()`](#subprocesspipefile-arguments-options) or [`subprocess.iterable()`](#subprocessiterablereadableoptions).

#### subprocess.writable(writableOptions?)

`writableOptions`: [`WritableOptions`](#writableoptions)\
_Returns_: [`Writable`](https://nodejs.org/api/stream.html#class-streamwritable) Node.js stream

Converts the subprocess to a writable stream.

Unlike [`subprocess.stdin`](#subprocessstdin), the stream waits for the subprocess to end and emits an [`error`](https://nodejs.org/api/stream.html#event-error) event if the subprocess [fails](#result). This means you do not need to `await` the subprocess' [promise](#subprocess). On the other hand, you do need to handle to the stream `error` event. This can be done by using [`await finished(stream)`](https://nodejs.org/api/stream.html#streamfinishedstream-options) or [`await pipeline(stream, ...)`](https://nodejs.org/api/stream.html#streampipelinesource-transforms-destination-options) which throw an exception when the stream errors.

Before using this method, please first consider the [`stdin`](#optionsstdin)/[`stdout`](#optionsstdout)/[`stderr`](#optionsstderr)/[`stdio`](#optionsstdio) options or [`subprocess.pipe()`](#subprocesspipefile-arguments-options).

#### subprocess.duplex(duplexOptions?)

`duplexOptions`: [`ReadableOptions | WritableOptions`](#readableoptions)\
_Returns_: [`Duplex`](https://nodejs.org/api/stream.html#class-streamduplex) Node.js stream

Converts the subprocess to a duplex stream.

The stream waits for the subprocess to end and emits an [`error`](https://nodejs.org/api/stream.html#event-error) event if the subprocess [fails](#result). This means you do not need to `await` the subprocess' [promise](#subprocess). On the other hand, you do need to handle to the stream `error` event. This can be done by using [`await finished(stream)`](https://nodejs.org/api/stream.html#streamfinishedstream-options), [`await pipeline(..., stream, ...)`](https://nodejs.org/api/stream.html#streampipelinesource-transforms-destination-options) or [`await text(stream)`](https://nodejs.org/api/webstreams.html#streamconsumerstextstream) which throw an exception when the stream errors.

Before using this method, please first consider the [`stdin`](#optionsstdin)/[`stdout`](#optionsstdout)/[`stderr`](#optionsstderr)/[`stdio`](#optionsstdio) options, [`subprocess.pipe()`](#subprocesspipefile-arguments-options) or [`subprocess.iterable()`](#subprocessiterablereadableoptions).

##### readableOptions

Type: `object`

##### readableOptions.from

Type: `"stdout" | "stderr" | "all" | "fd3" | "fd4" | ...`\
Default: `"stdout"`

Which stream to read from the subprocess. A file descriptor like `"fd3"` can also be passed.

`"all"` reads both `stdout` and `stderr`. This requires the [`all`](#optionsall) option to be `true`.

##### readableOptions.binary

Type: `boolean`\
Default: `false` with [`subprocess.iterable()`](#subprocessiterablereadableoptions), `true` with [`subprocess.readable()`](#subprocessreadablereadableoptions)/[`subprocess.duplex()`](#subprocessduplexduplexoptions)

If `false`, the stream iterates over lines. Each line is a string. Also, the stream is in [object mode](https://nodejs.org/api/stream.html#object-mode).

If `true`, the stream iterates over arbitrary chunks of data. Each line is an `Uint8Array` (with [`subprocess.iterable()`](#subprocessiterablereadableoptions)) or a [`Buffer`](https://nodejs.org/api/buffer.html#class-buffer) (otherwise).

This is always `true` when the [`encoding`](#optionsencoding) option is binary.

##### readableOptions.preserveNewlines

Type: `boolean`\
Default: `false` with [`subprocess.iterable()`](#subprocessiterablereadableoptions), `true` with [`subprocess.readable()`](#subprocessreadablereadableoptions)/[`subprocess.duplex()`](#subprocessduplexduplexoptions)

If both this option and the [`binary`](#readableoptionsbinary) option is `false`, newlines are stripped from each line.

##### writableOptions

Type: `object`

##### writableOptions.to

Type: `"stdin" | "fd3" | "fd4" | ...`\
Default: `"stdin"`

Which stream to write to the subprocess. A file descriptor like `"fd3"` can also be passed.

### Result

Type: `object`

Result of a subprocess execution.

When the subprocess [fails](#resultfailed), it is rejected with an [`ExecaError`](#execaerror) instead.

#### result.command

Type: `string`

The file and arguments that were run, for logging purposes.

This is not escaped and should not be executed directly as a subprocess, including using [`execa()`](#execafile-arguments-options) or [`execaCommand()`](#execacommandcommand-options).

#### result.escapedCommand

Type: `string`

Same as [`command`](#resultcommand) but escaped.

Unlike `command`, control characters are escaped, which makes it safe to print in a terminal.

This can also be copied and pasted into a shell, for debugging purposes.
Since the escaping is fairly basic, this should not be executed directly as a subprocess, including using [`execa()`](#execafile-arguments-options) or [`execaCommand()`](#execacommandcommand-options).

#### result.cwd

Type: `string`

The [current directory](#optionscwd) in which the command was run.

#### result.durationMs

Type: `number`

Duration of the subprocess, in milliseconds.

#### result.stdout

Type: `string | Uint8Array | string[] | Uint8Array[] | unknown[] | undefined`

The output of the subprocess on `stdout`.

This is `undefined` if the [`stdout`](#optionsstdout) option is set to only `'inherit'`, `'ignore'`, `Writable` or `integer`. This is an array if the [`lines`](#optionslines) option is `true`, or if the `stdout` option is a [transform in object mode](docs/transform.md#object-mode).

#### result.stderr

Type: `string | Uint8Array | string[] | Uint8Array[] | unknown[] | undefined`

The output of the subprocess on `stderr`.

This is `undefined` if the [`stderr`](#optionsstderr) option is set to only `'inherit'`, `'ignore'`, `Writable` or `integer`. This is an array if the [`lines`](#optionslines) option is `true`, or if the `stderr` option is a [transform in object mode](docs/transform.md#object-mode).

#### result.all

Type: `string | Uint8Array | string[] | Uint8Array[] | unknown[] | undefined`

The output of the subprocess with [`result.stdout`](#resultstdout) and [`result.stderr`](#resultstderr) [interleaved](#ensuring-all-output-is-interleaved).

This is `undefined` if either:
- the [`all`](#optionsall) option is `false` (the default value).
- both [`stdout`](#optionsstdout) and [`stderr`](#optionsstderr) options are set to only `'inherit'`, `'ignore'`, `Writable` or `integer`.

This is an array if the [`lines`](#optionslines) option is `true`, or if either the `stdout` or `stderr` option is a [transform in object mode](docs/transform.md#object-mode).

#### result.stdio

Type: `Array<string | Uint8Array | string[] | Uint8Array[] | unknown[] | undefined>`

The output of the subprocess on [`stdin`](#optionsstdin), [`stdout`](#optionsstdout), [`stderr`](#optionsstderr) and [other file descriptors](#optionsstdio).

Items are `undefined` when their corresponding [`stdio`](#optionsstdio) option is set to `'inherit'`, `'ignore'`, `Writable` or `integer`. Items are arrays when their corresponding `stdio` option is a [transform in object mode](docs/transform.md#object-mode).

#### result.failed

Type: `boolean`

Whether the subprocess failed to run.

#### result.timedOut

Type: `boolean`

Whether the subprocess timed out.

#### result.isCanceled

Type: `boolean`

Whether the subprocess was canceled using the [`cancelSignal`](#optionscancelsignal) option.

#### result.isTerminated

Type: `boolean`

Whether the subprocess was terminated by a signal (like `SIGTERM`) sent by either:
- The current process.
- Another process. This case is [not supported on Windows](https://nodejs.org/api/process.html#signal-events).

#### result.isMaxBuffer

Type: `boolean`

Whether the subprocess failed because its output was larger than the [`maxBuffer`](#optionsmaxbuffer) option.

#### result.exitCode

Type: `number | undefined`

The numeric exit code of the subprocess that was run.

This is `undefined` when the subprocess could not be spawned or was terminated by a [signal](#resultsignal).

#### result.signal

Type: `string | undefined`

The name of the signal (like `SIGTERM`) that terminated the subprocess, sent by either:
- The current process.
- Another process. This case is [not supported on Windows](https://nodejs.org/api/process.html#signal-events).

If a signal terminated the subprocess, this property is defined and included in the error message. Otherwise it is `undefined`.

#### result.signalDescription

Type: `string | undefined`

A human-friendly description of the signal that was used to terminate the subprocess. For example, `Floating point arithmetic error`.

If a signal terminated the subprocess, this property is defined and included in the error message. Otherwise it is `undefined`. It is also `undefined` when the signal is very uncommon which should seldomly happen.

#### result.pipedFrom

Type: [`Array<Result | ExecaError>`](#result)

Results of the other subprocesses that were [piped](#pipe-multiple-subprocesses) into this subprocess. This is useful to inspect a series of subprocesses piped with each other.

This array is initially empty and is populated each time the [`subprocess.pipe()`](#subprocesspipefile-arguments-options) method resolves.

### ExecaError
### ExecaSyncError

Type: `Error`

Exception thrown when the subprocess [fails](#resultfailed), either:
- its [exit code](#resultexitcode) is not `0`
- it was [terminated](#resultisterminated) with a [signal](#resultsignal), including [`subprocess.kill()`](#subprocesskillerror)
- [timing out](#resulttimedout)
- [being canceled](#resultiscanceled)
- there's not enough memory or there are already too many subprocesses

This has the same shape as [successful results](#result), with the following additional properties.

#### error.message

Type: `string`

Error message when the subprocess failed to run. In addition to the [underlying error message](#errororiginalmessage), it also contains some information related to why the subprocess errored.

The subprocess [`stderr`](#resultstderr), [`stdout`](#resultstdout) and other [file descriptors' output](#resultstdio) are appended to the end, separated with newlines and not interleaved.

#### error.shortMessage

Type: `string`

This is the same as the [`message` property](#errormessage) except it does not include the subprocess [`stdout`](#resultstdout)/[`stderr`](#resultstderr)/[`stdio`](#resultstdio).

#### error.originalMessage

Type: `string | undefined`

Original error message. This is the same as the `message` property excluding the subprocess [`stdout`](#resultstdout)/[`stderr`](#resultstderr)/[`stdio`](#resultstdio) and some additional information added by Execa.

This exists only if the subprocess exited due to an `error` event or a timeout.

#### error.cause

Type: `unknown | undefined`

Underlying error, if there is one. For example, this is set by [`subprocess.kill(error)`](#subprocesskillerror).

This is usually an `Error` instance.

#### error.code

Type: `string | undefined`

Node.js-specific [error code](https://nodejs.org/api/errors.html#errorcode), when available.

### options

Type: `object`

This lists all options for [`execa()`](#execafile-arguments-options) and the [other methods](#methods).

Some options are related to the subprocess output: [`verbose`](#optionsverbose), [`lines`](#optionslines), [`stripFinalNewline`](#optionsstripfinalnewline), [`buffer`](#optionsbuffer), [`maxBuffer`](#optionsmaxbuffer). By default, those options apply to all file descriptors (`stdout`, `stderr`, etc.). A plain object can be passed instead to apply them to only `stdout`, `stderr`, `fd3`, etc.

```js
await execa('./run.js', {verbose: 'full'}) // Same value for stdout and stderr
await execa('./run.js', {verbose: {stdout: 'none', stderr: 'full'}}) // Different values
```

#### options.reject

Type: `boolean`\
Default: `true`

Setting this to `false` resolves the promise with the [error](#execaerror) instead of rejecting it.

#### options.shell

Type: `boolean | string | URL`\
Default: `false`

If `true`, runs `file` inside of a shell. Uses `/bin/sh` on UNIX and `cmd.exe` on Windows. A different shell can be specified as a string. The shell should understand the `-c` switch on UNIX or `/d /s /c` on Windows.

We recommend against using this option since it is:
- not cross-platform, encouraging shell-specific syntax.
- slower, because of the additional shell interpretation.
- unsafe, potentially allowing command injection.

#### options.cwd

Type: `string | URL`\
Default: `process.cwd()`

Current working directory of the subprocess.

This is also used to resolve the [`nodePath`](#optionsnodepath) option when it is a relative path.

#### options.env

Type: `object`\
Default: `process.env`

Environment key-value pairs.

Unless the [`extendEnv`](#optionsextendenv) option is `false`, the subprocess also uses the current process' environment variables ([`process.env`](https://nodejs.org/api/process.html#processenv)).

#### options.extendEnv

Type: `boolean`\
Default: `true`

If `true`, the subprocess uses both the [`env`](#optionsenv) option and the current process' environment variables ([`process.env`](https://nodejs.org/api/process.html#processenv)).
If `false`, only the `env` option is used, not `process.env`.

#### options.preferLocal

Type: `boolean`\
Default: `true` with [`$`](#file-arguments-options), `false` otherwise

Prefer locally installed binaries when looking for a binary to execute.\
If you `$ npm install foo`, you can then `execa('foo')`.

#### options.localDir

Type: `string | URL`\
Default: `process.cwd()`

Preferred path to find locally installed binaries in (use with `preferLocal`).

#### options.node

Type: `boolean`\
Default: `true` with [`execaNode()`](#execanodescriptpath-arguments-options), `false` otherwise

If `true`, runs with Node.js. The first argument must be a Node.js file.

#### options.nodeOptions

Type: `string[]`\
Default: [`process.execArgv`](https://nodejs.org/api/process.html#process_process_execargv) (current Node.js CLI options)

List of [CLI options](https://nodejs.org/api/cli.html#cli_options) passed to the [Node.js executable](#optionsnodepath).

Requires the [`node`](#optionsnode) option to be `true`.

#### options.nodePath

Type: `string | URL`\
Default: [`process.execPath`](https://nodejs.org/api/process.html#process_process_execpath) (current Node.js executable)

Path to the Node.js executable.

For example, this can be used together with [`get-node`](https://github.com/ehmicky/get-node) to run a specific Node.js version.

Requires the [`node`](#optionsnode) option to be `true`.

#### options.verbose

Type: `'none' | 'short' | 'full'`\
Default: `'none'`

If `verbose` is `'short'` or `'full'`, [prints each command](#verbose-mode) on `stderr` before executing it. When the command completes, prints its duration and (if it failed) its error.

If `verbose` is `'full'`, the command's `stdout` and `stderr` are printed too, unless either:
- the [`stdout`](#optionsstdout)/[`stderr`](#optionsstderr) option is `ignore` or `inherit`.
- the `stdout`/`stderr` is redirected to [a stream](https://nodejs.org/api/stream.html#readablepipedestination-options), [a file](#optionsstdout), a file descriptor, or [another subprocess](#subprocesspipefile-arguments-options).
- the [`encoding`](#optionsencoding) option is binary.

This can also be set to `'full'` by setting the `NODE_DEBUG=execa` environment variable in the current process.

By default, this applies to both `stdout` and `stderr`, but [different values can also be passed](#options).

#### options.buffer

Type: `boolean`\
Default: `true`

Whether to return the subprocess' output using the [`result.stdout`](#resultstdout), [`result.stderr`](#resultstderr), [`result.all`](#resultall) and [`result.stdio`](#resultstdio) properties.

On failure, the [`error.stdout`](#resultstdout), [`error.stderr`](#resultstderr), [`error.all`](#resultall) and [`error.stdio`](#resultstdio) properties are used instead.

When `buffer` is `false`, the output can still be read using the [`subprocess.stdout`](#subprocessstdout), [`subprocess.stderr`](#subprocessstderr), [`subprocess.stdio`](#subprocessstdio) and [`subprocess.all`](#subprocessall) streams. If the output is read, this should be done right away to avoid missing any data.

By default, this applies to both `stdout` and `stderr`, but [different values can also be passed](#options).

#### options.input

Type: `string | Uint8Array | stream.Readable`

Write some input to the subprocess' `stdin`.

See also the [`inputFile`](#optionsinputfile) and [`stdin`](#optionsstdin) options.

#### options.inputFile

Type: `string | URL`

Use a file as input to the subprocess' `stdin`.

See also the [`input`](#optionsinput) and [`stdin`](#optionsstdin) options.

#### options.stdin

Type: `string | number | stream.Readable | ReadableStream | TransformStream | URL | {file: string} | Uint8Array | Iterable<string | Uint8Array | unknown> | AsyncIterable<string | Uint8Array | unknown> | GeneratorFunction<string | Uint8Array | unknown> | AsyncGeneratorFunction<string | Uint8Array | unknown> | {transform: GeneratorFunction | AsyncGeneratorFunction | Duplex | TransformStream}` (or a tuple of those types)\
Default: `inherit` with [`$`](#file-arguments-options), `pipe` otherwise

How to setup the subprocess' standard input. This can be:
- `'pipe'`: Sets [`subprocess.stdin`](#subprocessstdin) stream.
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

This can also be a generator function, a [`Duplex`](docs/transform.md#duplextransform-streams) or a web [`TransformStream`](docs/transform.md#duplextransform-streams) to transform the input. [Learn more.](docs/transform.md)

[More info.](https://nodejs.org/api/child_process.html#child_process_options_stdio)

#### options.stdout

Type: `string | number | stream.Writable | WritableStream | TransformStream | URL | {file: string} | GeneratorFunction<string | Uint8Array | unknown> | AsyncGeneratorFunction<string | Uint8Array | unknown>  | {transform: GeneratorFunction | AsyncGeneratorFunction | Duplex | TransformStream}` (or a tuple of those types)\
Default: `pipe`

How to setup the subprocess' standard output. This can be:
- `'pipe'`: Sets [`result.stdout`](#resultstdout) (as a string or `Uint8Array`) and [`subprocess.stdout`](#subprocessstdout) (as a stream).
- `'overlapped'`: Like `'pipe'` but asynchronous on Windows.
- `'ignore'`: Do not use `stdout`.
- `'inherit'`: Re-use the current process' `stdout`.
- an integer: Re-use a specific file descriptor from the current process.
- a [Node.js `Writable` stream](#redirect-a-nodejs-stream-fromto-stdinstdoutstderr).
- `{ file: 'path' }` object.
- a file URL.
- a web [`WritableStream`](https://developer.mozilla.org/en-US/docs/Web/API/WritableStream).

This can be an [array of values](#redirect-stdinstdoutstderr-to-multiple-destinations) such as `['inherit', 'pipe']` or `[filePath, 'pipe']`.

This can also be a generator function, a [`Duplex`](docs/transform.md#duplextransform-streams) or a web [`TransformStream`](docs/transform.md#duplextransform-streams) to transform the output. [Learn more.](docs/transform.md)

[More info.](https://nodejs.org/api/child_process.html#child_process_options_stdio)

#### options.stderr

Type: `string | number | stream.Writable | WritableStream | TransformStream | URL | {file: string} | GeneratorFunction<string | Uint8Array | unknown> | AsyncGeneratorFunction<string | Uint8Array | unknown> | {transform: GeneratorFunction | AsyncGeneratorFunction | Duplex | TransformStream}` (or a tuple of those types)\
Default: `pipe`

How to setup the subprocess' standard error. This can be:
- `'pipe'`: Sets [`result.stderr`](#resultstderr) (as a string or `Uint8Array`) and [`subprocess.stderr`](#subprocessstderr) (as a stream).
- `'overlapped'`: Like `'pipe'` but asynchronous on Windows.
- `'ignore'`: Do not use `stderr`.
- `'inherit'`: Re-use the current process' `stderr`.
- an integer: Re-use a specific file descriptor from the current process.
- a [Node.js `Writable` stream](#redirect-a-nodejs-stream-fromto-stdinstdoutstderr).
- `{ file: 'path' }` object.
- a file URL.
- a web [`WritableStream`](https://developer.mozilla.org/en-US/docs/Web/API/WritableStream).

This can be an [array of values](#redirect-stdinstdoutstderr-to-multiple-destinations) such as `['inherit', 'pipe']` or `[filePath, 'pipe']`.

This can also be a generator function, a [`Duplex`](docs/transform.md#duplextransform-streams) or a web [`TransformStream`](docs/transform.md#duplextransform-streams) to transform the output. [Learn more.](docs/transform.md)

[More info.](https://nodejs.org/api/child_process.html#child_process_options_stdio)

#### options.stdio

Type: `string | Array<string | number | stream.Readable | stream.Writable | ReadableStream | WritableStream | TransformStream | URL | {file: string} | Uint8Array | Iterable<string> | Iterable<Uint8Array> | Iterable<unknown> | AsyncIterable<string | Uint8Array | unknown> | GeneratorFunction<string | Uint8Array | unknown> | AsyncGeneratorFunction<string | Uint8Array | unknown> | {transform: GeneratorFunction | AsyncGeneratorFunction | Duplex | TransformStream}>` (or a tuple of those types)\
Default: `pipe`

Like the [`stdin`](#optionsstdin), [`stdout`](#optionsstdout) and [`stderr`](#optionsstderr) options but for all file descriptors at once. For example, `{stdio: ['ignore', 'pipe', 'pipe']}` is the same as `{stdin: 'ignore', stdout: 'pipe', stderr: 'pipe'}`.

A single string can be used as a shortcut. For example, `{stdio: 'pipe'}` is the same as `{stdin: 'pipe', stdout: 'pipe', stderr: 'pipe'}`.

The array can have more than 3 items, to create additional file descriptors beyond `stdin`/`stdout`/`stderr`. For example, `{stdio: ['pipe', 'pipe', 'pipe', 'pipe']}` sets a fourth file descriptor.

[More info.](https://nodejs.org/api/child_process.html#child_process_options_stdio)

#### options.all

Type: `boolean`\
Default: `false`

Add a [`subprocess.all`](#subprocessall) stream and a [`result.all`](#resultall) property. They contain the combined/[interleaved](#ensuring-all-output-is-interleaved) output of the subprocess' `stdout` and `stderr`.

#### options.lines

Type: `boolean`\
Default: `false`

Set [`result.stdout`](#resultstdout), [`result.stderr`](#resultstdout), [`result.all`](#resultall) and [`result.stdio`](#resultstdio) as arrays of strings, splitting the subprocess' output into lines.

This cannot be used if the [`encoding`](#optionsencoding) option is binary.

By default, this applies to both `stdout` and `stderr`, but [different values can also be passed](#options).

#### options.encoding

Type: `string`\
Default: `'utf8'`

If the subprocess outputs text, specifies its character encoding, either `'utf8'` or `'utf16le'`.

If it outputs binary data instead, this should be either:
- `'buffer'`: returns the binary output as an `Uint8Array`.
- `'hex'`, `'base64'`, `'base64url'`, [`'latin1'`](https://nodejs.org/api/buffer.html#buffers-and-character-encodings) or [`'ascii'`](https://nodejs.org/api/buffer.html#buffers-and-character-encodings): encodes the binary output as a string.

The output is available with [`result.stdout`](#resultstdout), [`result.stderr`](#resultstderr) and [`result.stdio`](#resultstdio).

#### options.stripFinalNewline

Type: `boolean`\
Default: `true`

Strip the final [newline character](https://en.wikipedia.org/wiki/Newline) from the output.

If the [`lines`](#optionslines) option is true, this applies to each output line instead.

By default, this applies to both `stdout` and `stderr`, but [different values can also be passed](#options).

#### options.maxBuffer

Type: `number`\
Default: `100_000_000`

Largest amount of data allowed on [`stdout`](#resultstdout), [`stderr`](#resultstderr) and [`stdio`](#resultstdio).

When this threshold is hit, the subprocess fails and [`error.isMaxBuffer`](#resultismaxbuffer) becomes `true`.

This is measured:
- By default: in [characters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length).
- If the [`encoding`](#optionsencoding) option is `'buffer'`: in bytes.
- If the [`lines`](#optionslines) option is `true`: in lines.
- If a [transform in object mode](docs/transform.md#object-mode) is used: in objects.

By default, this applies to both `stdout` and `stderr`, but [different values can also be passed](#options).

#### options.ipc

Type: `boolean`\
Default: `true` if the [`node`](#optionsnode) option is enabled, `false` otherwise

Enables exchanging messages with the subprocess using [`subprocess.send(message)`](#subprocesssendmessage) and [`subprocess.on('message', (message) => {})`](#subprocessonmessage-message--void).

#### options.serialization

Type: `string`\
Default: `'advanced'`

Specify the kind of serialization used for sending messages between subprocesses when using the [`ipc`](#optionsipc) option:
- `json`: Uses `JSON.stringify()` and `JSON.parse()`.
- `advanced`: Uses [`v8.serialize()`](https://nodejs.org/api/v8.html#v8_v8_serialize_value)

[More info.](https://nodejs.org/api/child_process.html#child_process_advanced_serialization)

#### options.detached

Type: `boolean`\
Default: `false`

Prepare subprocess to run independently of the current process. Specific behavior depends on the platform.

[More info.](https://nodejs.org/api/child_process.html#child_process_options_detached).

#### options.cleanup

Type: `boolean`\
Default: `true`

Kill the subprocess when the current process exits unless either:
- the subprocess is [`detached`](#optionsdetached).
- the current process is terminated abruptly, for example, with `SIGKILL` as opposed to `SIGTERM` or a normal exit.

#### options.timeout

Type: `number`\
Default: `0`

If `timeout` is greater than `0`, the subprocess will be [terminated](#optionskillsignal) if it runs for longer than that amount of milliseconds.

#### options.cancelSignal

Type: [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)

You can abort the subprocess using [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).

When `AbortController.abort()` is called, [`result.isCanceled`](#resultiscanceled) becomes `true`.

#### options.forceKillAfterDelay

Type: `number | false`\
Default: `5000`

If the subprocess is terminated but does not exit, forcefully exit it by sending [`SIGKILL`](https://en.wikipedia.org/wiki/Signal_(IPC)#SIGKILL).

The grace period is 5 seconds by default. This feature can be disabled with `false`.

This works when the subprocess is terminated by either:
- the [`cancelSignal`](#optionscancelsignal), [`timeout`](#optionstimeout), [`maxBuffer`](#optionsmaxbuffer) or [`cleanup`](#optionscleanup) option
- calling [`subprocess.kill()`](#subprocesskillsignal-error) with no arguments

This does not work when the subprocess is terminated by either:
- calling [`subprocess.kill()`](#subprocesskillsignal-error) with an argument
- calling [`process.kill(subprocess.pid)`](https://nodejs.org/api/process.html#processkillpid-signal)
- sending a termination signal from another process

Also, this does not work on Windows, because Windows [doesn't support signals](https://nodejs.org/api/process.html#process_signal_events): `SIGKILL` and `SIGTERM` both terminate the subprocess immediately. Other packages (such as [`taskkill`](https://github.com/sindresorhus/taskkill)) can be used to achieve fail-safe termination on Windows.

#### options.killSignal

Type: `string | number`\
Default: `SIGTERM`

Signal used to terminate the subprocess when:
- using the [`cancelSignal`](#optionscancelsignal), [`timeout`](#optionstimeout), [`maxBuffer`](#optionsmaxbuffer) or [`cleanup`](#optionscleanup) option
- calling [`subprocess.kill()`](#subprocesskillsignal-error) with no arguments

This can be either a name (like `"SIGTERM"`) or a number (like `9`).

#### options.argv0

Type: `string`

Explicitly set the value of `argv[0]` sent to the subprocess. This will be set to `file` if not specified.

#### options.uid

Type: `number`

Sets the user identity of the subprocess.

#### options.gid

Type: `number`

Sets the group identity of the subprocess.

#### options.windowsVerbatimArguments

Type: `boolean`\
Default: `false`

If `true`, no quoting or escaping of arguments is done on Windows. Ignored on other platforms. This is set to `true` automatically when the `shell` option is `true`.

#### options.windowsHide

Type: `boolean`\
Default: `true`

On Windows, do not create a new console window. Please note this also prevents `CTRL-C` [from working](https://github.com/nodejs/node/issues/29837) on Windows.

## Tips

### Redirect stdin/stdout/stderr to multiple destinations

The [`stdin`](#optionsstdin), [`stdout`](#optionsstdout) and [`stderr`](#optionsstderr) options can be an array of values.
The following example redirects `stdout` to both the terminal and an `output.txt` file, while also retrieving its value programmatically.

```js
const {stdout} = await execa('npm', ['install'], {stdout: ['inherit', './output.txt', 'pipe']});
console.log(stdout);
```

When combining `inherit` with other values, please note that the subprocess will not be an interactive TTY, even if the current process is one.

### Redirect a Node.js stream from/to stdin/stdout/stderr

When passing a Node.js stream to the [`stdin`](#optionsstdin), [`stdout`](#optionsstdout) or [`stderr`](#optionsstderr) option, Node.js requires that stream to have an underlying file or socket, such as the streams created by the `fs`, `net` or `http` core modules. Otherwise the following error is thrown.

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

The `subprocess.all` [stream](#subprocessall) and `result.all` [string/`Uint8Array`](#resultall) property are guaranteed to interleave [`stdout`](#resultstdout) and [`stderr`](#resultstderr).

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
