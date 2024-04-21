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

- [Promise interface](docs/execution.md).
- [Script interface](docs/scripts.md) and [template strings](docs/execution.md#template-string-syntax), like `zx`.
- Improved [Windows support](docs/windows.md), including [shebang](docs/windows.md#shebang) binaries.
- Executes [locally installed binaries](docs/environment.md#local-binaries) without `npx`.
- [Cleans up](docs/termination.md#current-process-exit) subprocesses when the current process ends.
- Redirect [`stdin`](docs/input.md)/[`stdout`](docs/output.md)/[`stderr`](docs/output.md) from/to [files](docs/output.md#file-output), [streams](docs/streams.md), [iterables](docs/streams.md#iterables-as-input), [strings](docs/input.md#string-input), [`Uint8Array`](docs/binary.md#binary-input) or [objects](docs/transform.md#object-mode).
- [Transform](docs/transform.md) `stdin`/`stdout`/`stderr` with simple functions.
- Iterate over [each text line](docs/lines.md#progressive-splitting) output by the subprocess.
- [Fail-safe subprocess termination](docs/termination.md#forceful-termination).
- Get [interleaved output](docs/output.md#interleaved-output) from `stdout` and `stderr` similar to what is printed on the terminal.
- [Strips the final newline](docs/lines.md#final-newline) from the output so you don't have to do `stdout.trim()`.
- Convenience methods to [pipe multiple subprocesses](docs/pipe.md).
- [Verbose mode](docs/debugging.md#verbose-mode) for debugging.
- More descriptive [errors](docs/errors.md).
- Higher [max buffer](docs/output.md#big-output): 100 MB instead of 1 MB.

## Install

```sh
npm install execa
```

## Documentation

Execution:
- ▶️ [Basic execution](docs/execution.md)
- 💬 [Escaping/quoting](docs/escaping.md)
- 💻 [Shell](docs/shell.md)
- 📜 [Scripts](docs/scripts.md)
- 🐢 [Node.js files](docs/node.md)
- 🌐 [Environment](docs/environment.md)
- ❌ [Errors](docs/errors.md)
- 🏁 [Termination](docs/termination.md)

Input/output:
- 🎹 [Input](docs/input.md)
- 📢 [Output](docs/output.md)
- 📃 [Text lines](docs/lines.md)
- 🤖 [Binary data](docs/binary.md)
- 🧙 [Transforms](docs/transform.md)

Advanced usage:
- 🔀 [Piping multiple subprocesses](docs/pipe.md)
- ⏳️ [Streams](docs/streams.md)
- 📞 [Inter-process communication](docs/ipc.md)
- 🐛 [Debugging](docs/debugging.md)
- 📎 [Windows](docs/windows.md)
- 🔍 [Difference with Bash and zx](docs/bash.md)

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

More info on the [syntax](docs/execution.md#array-syntax) and [escaping](docs/escaping.md#array-syntax).

#### execa\`command\`
#### execa(options)\`command\`

`command`: `string`\
`options`: [`Options`](#options)\
_Returns_: [`Subprocess`](#subprocess)

Executes a command. `command` is a [template string](docs/execution.md#template-string-syntax) that includes both the `file` and its `arguments`.

More info on the [syntax](docs/execution.md#template-string-syntax) and [escaping](docs/escaping.md#template-string-syntax).

#### execa(options)

`options`: [`Options`](#options)\
_Returns_: [`execa`](#execafile-arguments-options)

Returns a new instance of Execa but with different default [`options`](#options). Consecutive calls are merged to previous ones.

[More info.](docs/execution.md#globalshared-options)

#### execaSync(file, arguments?, options?)
#### execaSync\`command\`

Same as [`execa()`](#execafile-arguments-options) but synchronous.

Returns or throws a subprocess [`result`](#result). The [`subprocess`](#subprocess) is not returned: its methods and properties are not available.

[More info.](docs/execution.md#synchronous-execution)

#### $(file, arguments?, options?)

`file`: `string | URL`\
`arguments`: `string[]`\
`options`: [`Options`](#options)\
_Returns_: [`Subprocess`](#subprocess)

Same as [`execa()`](#execafile-arguments-options) but using [script-friendly default options](docs/scripts.md#script-files).

Just like `execa()`, this can use the [template string syntax](docs/execution.md#template-string-syntax) or [bind options](docs/execution.md#globalshared-options). It can also be [run synchronously](#execasyncfile-arguments-options) using `$.sync()` or `$.s()`.

This is the preferred method when executing multiple commands in a script file.

[More info.](docs/scripts.md)

#### execaNode(scriptPath, arguments?, options?)

`scriptPath`: `string | URL`\
`arguments`: `string[]`\
`options`: [`Options`](#options)\
_Returns_: [`Subprocess`](#subprocess)

Same as [`execa()`](#execafile-arguments-options) but using the [`node: true`](#optionsnode) option.
Executes a Node.js file using `node scriptPath ...arguments`.

Just like `execa()`, this can use the [template string syntax](docs/execution.md#template-string-syntax) or [bind options](docs/execution.md#globalshared-options).

This is the preferred method when executing Node.js files.

[More info.](docs/node.md)

#### execaCommand(command, options?)

`command`: `string`\
`options`: [`Options`](#options)\
_Returns_: [`Subprocess`](#subprocess)

Executes a command. `command` is a string that includes both the `file` and its `arguments`.

This is only intended for very specific cases, such as a [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop). This should be avoided otherwise.

Just like `execa()`, this can [bind options](docs/execution.md#globalshared-options). It can also be [run synchronously](#execasyncfile-arguments-options) using `execaCommandSync()`.

[More info.](docs/escaping.md#user-defined-input)

### subprocess

The return value of all [asynchronous methods](#methods) is both:
- a `Promise` resolving or rejecting with a subprocess [`result`](#result).
- a [`child_process` instance](https://nodejs.org/api/child_process.html#child_process_class_childprocess) with the following methods and properties.

[More info.](docs/execution.md#subprocess)

#### subprocess.pipe(file, arguments?, options?)

`file`: `string | URL`\
`arguments`: `string[]`\
`options`: [`Options`](#options) and [`PipeOptions`](#pipeoptions)\
_Returns_: [`Promise<Result>`](#result)

[Pipe](https://nodejs.org/api/stream.html#readablepipedestination-options) the subprocess' [`stdout`](#subprocessstdout) to a second Execa subprocess' [`stdin`](#subprocessstdin). This resolves with that second subprocess' [result](#result). If either subprocess is rejected, this is rejected with that subprocess' [error](#execaerror) instead.

This follows the same syntax as [`execa(file, arguments?, options?)`](#execafile-arguments-options) except both [regular options](#options) and [pipe-specific options](#pipeoptions) can be specified.

[More info.](docs/pipe.md#array-syntax)

#### subprocess.pipe\`command\`
#### subprocess.pipe(options)\`command\`

`command`: `string`\
`options`: [`Options`](#options) and [`PipeOptions`](#pipeoptions)\
_Returns_: [`Promise<Result>`](#result)

Like [`subprocess.pipe(file, arguments?, options?)`](#subprocesspipefile-arguments-options) but using a [`command` template string](docs/scripts.md#piping-stdout-to-another-command) instead. This follows the same syntax as `execa` [template strings](docs/execution.md#template-string-syntax).

[More info.](docs/pipe.md#template-string-syntax)

#### subprocess.pipe(secondSubprocess, pipeOptions?)

`secondSubprocess`: [`execa()` return value](#subprocess)\
`pipeOptions`: [`PipeOptions`](#pipeoptions)\
_Returns_: [`Promise<Result>`](#result)

Like [`subprocess.pipe(file, arguments?, options?)`](#subprocesspipefile-arguments-options) but using the [return value](#subprocess) of another [`execa()`](#execafile-arguments-options) call instead.

[More info.](docs/pipe.md#advanced-syntax)

##### pipeOptions

Type: `object`

##### pipeOptions.from

Type: `"stdout" | "stderr" | "all" | "fd3" | "fd4" | ...`\
Default: `"stdout"`

Which stream to pipe from the source subprocess. A [file descriptor](https://en.wikipedia.org/wiki/File_descriptor) like `"fd3"` can also be passed.

`"all"` pipes both [`stdout`](#subprocessstdout) and [`stderr`](#subprocessstderr). This requires the [`all`](#optionsall) option to be `true`.

[More info.](docs/pipe.md#source-file-descriptor)

##### pipeOptions.to

Type: `"stdin" | "fd3" | "fd4" | ...`\
Default: `"stdin"`

Which [stream](#subprocessstdin) to pipe to the destination subprocess. A [file descriptor](https://en.wikipedia.org/wiki/File_descriptor) like `"fd3"` can also be passed.

[More info.](docs/pipe.md#destination-file-descriptor)

##### pipeOptions.unpipeSignal

Type: [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)

Unpipe the subprocess when the signal aborts.

[More info.](docs/pipe.md#unpipe)

#### subprocess.kill(signal, error?)
#### subprocess.kill(error?)

`signal`: `string | number`\
`error`: `Error`\
_Returns_: `boolean`

Sends a [signal](https://nodejs.org/api/os.html#signal-constants) to the subprocess. The default signal is the [`killSignal`](#optionskillsignal) option. `killSignal` defaults to `SIGTERM`, which [terminates](#resultisterminated) the subprocess.

This returns `false` when the signal could not be sent, for example when the subprocess has already exited.

When an error is passed as argument, it is set to the subprocess' [`error.cause`](#errorcause). The subprocess is then terminated with the default signal. This does not emit the [`error` event](https://nodejs.org/api/child_process.html#event-error).

[More info.](docs/termination.md)

#### subprocess.pid

_Type_: `number | undefined`

Process identifier ([PID](https://en.wikipedia.org/wiki/Process_identifier)).

This is `undefined` if the subprocess failed to spawn.

[More info.](docs/termination.md#inter-process-termination)

#### subprocess.send(message)

`message`: `unknown`\
_Returns_: `boolean`

Send a `message` to the subprocess. The type of `message` depends on the [`serialization`](#optionsserialization) option.
The subprocess receives it as a [`message` event](https://nodejs.org/api/process.html#event-message).

This returns `true` on success.

This requires the [`ipc`](#optionsipc) option to be `true`.

[More info.](docs/ipc.md#exchanging-messages)

#### subprocess.on('message', (message) => void)

`message`: `unknown`

Receives a `message` from the subprocess. The type of `message` depends on the [`serialization`](#optionsserialization) option.
The subprocess sends it using [`process.send(message)`](https://nodejs.org/api/process.html#processsendmessage-sendhandle-options-callback).

This requires the [`ipc`](#optionsipc) option to be `true`.

[More info.](docs/ipc.md#exchanging-messages)

#### subprocess.stdin

Type: [`Writable | null`](https://nodejs.org/api/stream.html#class-streamwritable)

The subprocess [`stdin`](https://en.wikipedia.org/wiki/Standard_streams#Standard_input_(stdin)) as a stream.

This is `null` if the [`stdin`](#optionsstdin) option is set to [`'inherit'`](docs/input.md#terminal-input), [`'ignore'`](docs/input.md#ignore-input), [`Readable`](docs/streams.md#input) or [`integer`](docs/input.md#terminal-input).

[More info.](docs/streams.md#manual-streaming)

#### subprocess.stdout

Type: [`Readable | null`](https://nodejs.org/api/stream.html#class-streamreadable)

The subprocess [`stdout`](https://en.wikipedia.org/wiki/Standard_streams#Standard_output_(stdout)) as a stream.

This is `null` if the [`stdout`](#optionsstdout) option is set to [`'inherit'`](docs/output.md#terminal-output), [`'ignore'`](docs/output.md#ignore-output), [`Writable`](docs/streams.md#output) or [`integer`](docs/output.md#terminal-output), or if the [`buffer`](#optionsbuffer) option is `false`.

[More info.](docs/streams.md#manual-streaming)

#### subprocess.stderr

Type: [`Readable | null`](https://nodejs.org/api/stream.html#class-streamreadable)

The subprocess [`stderr`](https://en.wikipedia.org/wiki/Standard_streams#Standard_error_(stderr)) as a stream.

This is `null` if the [`stderr`](#optionsstdout) option is set to [`'inherit'`](docs/output.md#terminal-output), [`'ignore'`](docs/output.md#ignore-output), [`Writable`](docs/streams.md#output) or [`integer`](docs/output.md#terminal-output), or if the [`buffer`](#optionsbuffer) option is `false`.

[More info.](docs/streams.md#manual-streaming)

#### subprocess.all

Type: [`Readable | undefined`](https://nodejs.org/api/stream.html#class-streamreadable)

Stream combining/interleaving [`subprocess.stdout`](#subprocessstdout) and [`subprocess.stderr`](#subprocessstderr).

This requires the [`all`](#optionsall) option to be `true`.

This is `undefined` if [`stdout`](#optionsstdout) and [`stderr`](#optionsstderr) options are set to [`'inherit'`](docs/output.md#terminal-output), [`'ignore'`](docs/output.md#ignore-output), [`Writable`](docs/streams.md#output) or [`integer`](docs/output.md#terminal-output), or if the [`buffer`](#optionsbuffer) option is `false`.

More info on [interleaving](docs/output.md#interleaved-output) and [streaming](docs/streams.md#manual-streaming).

#### subprocess.stdio

Type: [`[Writable | null, Readable | null, Readable | null, ...Array<Writable | Readable | null>]`](https://nodejs.org/api/stream.html#class-streamreadable)

The subprocess [`stdin`](#subprocessstdin), [`stdout`](#subprocessstdout), [`stderr`](#subprocessstderr) and [other files descriptors](#optionsstdio) as an array of streams.

Each array item is `null` if the corresponding [`stdin`](#optionsstdin), [`stdout`](#optionsstdout), [`stderr`](#optionsstderr) or [`stdio`](#optionsstdio) option is set to [`'inherit'`](docs/output.md#terminal-output), [`'ignore'`](docs/output.md#ignore-output), [`Stream`](docs/streams.md#output) or [`integer`](docs/output.md#terminal-output), or if the [`buffer`](#optionsbuffer) option is `false`.

[More info.](docs/streams.md#manual-streaming)

#### subprocess\[Symbol.asyncIterator\]()

_Returns_: [`AsyncIterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_async_iterator_and_async_iterable_protocols)

Subprocesses are [async iterables](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator). They iterate over each output line.

[More info.](docs/lines.md#progressive-splitting)

#### subprocess.iterable(readableOptions?)

`readableOptions`: [`ReadableOptions`](#readableoptions)\
_Returns_: [`AsyncIterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_async_iterator_and_async_iterable_protocols)

Same as [`subprocess[Symbol.asyncIterator]`](#subprocesssymbolasynciterator) except [options](#readableoptions) can be provided.

[More info.](docs/lines.md#progressive-splitting)

#### subprocess.readable(readableOptions?)

`readableOptions`: [`ReadableOptions`](#readableoptions)\
_Returns_: [`Readable`](https://nodejs.org/api/stream.html#class-streamreadable) Node.js stream

Converts the subprocess to a readable stream.

[More info.](docs/streams.md#converting-a-subprocess-to-a-stream)

#### subprocess.writable(writableOptions?)

`writableOptions`: [`WritableOptions`](#writableoptions)\
_Returns_: [`Writable`](https://nodejs.org/api/stream.html#class-streamwritable) Node.js stream

Converts the subprocess to a writable stream.

[More info.](docs/streams.md#converting-a-subprocess-to-a-stream)

#### subprocess.duplex(duplexOptions?)

`duplexOptions`: [`ReadableOptions | WritableOptions`](#readableoptions)\
_Returns_: [`Duplex`](https://nodejs.org/api/stream.html#class-streamduplex) Node.js stream

Converts the subprocess to a duplex stream.

[More info.](docs/streams.md#converting-a-subprocess-to-a-stream)

##### readableOptions

Type: `object`

##### readableOptions.from

Type: `"stdout" | "stderr" | "all" | "fd3" | "fd4" | ...`\
Default: `"stdout"`

Which stream to read from the subprocess. A [file descriptor](https://en.wikipedia.org/wiki/File_descriptor) like `"fd3"` can also be passed.

`"all"` reads both [`stdout`](#subprocessstdout) and [`stderr`](#subprocessstderr). This requires the [`all`](#optionsall) option to be `true`.

[More info.](docs/streams.md#different-file-descriptor)

##### readableOptions.binary

Type: `boolean`\
Default: `false` with [`subprocess.iterable()`](#subprocessiterablereadableoptions), `true` with [`subprocess.readable()`](#subprocessreadablereadableoptions)/[`subprocess.duplex()`](#subprocessduplexduplexoptions)

If `false`, iterates over lines. Each line is a string.

If `true`, iterates over arbitrary chunks of data. Each line is an [`Uint8Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) (with [`subprocess.iterable()`](#subprocessiterablereadableoptions)) or a [`Buffer`](https://nodejs.org/api/buffer.html#class-buffer) (with [`subprocess.readable()`](#subprocessreadablereadableoptions)/[`subprocess.duplex()`](#subprocessduplexduplexoptions)).

This is always `true` when the [`encoding`](#optionsencoding) option is binary.

More info for [iterables](docs/binary.md#iterable) and [streams](docs/binary.md#streams).

##### readableOptions.preserveNewlines

Type: `boolean`\
Default: `false` with [`subprocess.iterable()`](#subprocessiterablereadableoptions), `true` with [`subprocess.readable()`](#subprocessreadablereadableoptions)/[`subprocess.duplex()`](#subprocessduplexduplexoptions)

If both this option and the [`binary`](#readableoptionsbinary) option is `false`, [newlines](https://en.wikipedia.org/wiki/Newline) are stripped from each line.

[More info.](docs/lines.md#iterable)

##### writableOptions

Type: `object`

##### writableOptions.to

Type: `"stdin" | "fd3" | "fd4" | ...`\
Default: `"stdin"`

Which [stream](#subprocessstdin) to write to the subprocess. A [file descriptor](https://en.wikipedia.org/wiki/File_descriptor) like `"fd3"` can also be passed.

[More info.](docs/streams.md#different-file-descriptor)

### Result

Type: `object`

[Result](docs/execution.md#result) of a subprocess execution.

When the subprocess [fails](docs/errors.md#subprocess-failure), it is rejected with an [`ExecaError`](#execaerror) instead.

#### result.command

Type: `string`

The file and [arguments](docs/input.md#command-arguments) that were run.

[More info.](docs/debugging.md#command)

#### result.escapedCommand

Type: `string`

Same as [`command`](#resultcommand) but escaped.

[More info.](docs/debugging.md#command)

#### result.cwd

Type: `string`

The [current directory](#optionscwd) in which the command was run.

[More info.](docs/environment.md#current-directory)

#### result.durationMs

Type: `number`

Duration of the subprocess, in milliseconds.

[More info.](docs/debugging.md#duration)

#### result.stdout

Type: `string | Uint8Array | string[] | Uint8Array[] | unknown[] | undefined`

The output of the subprocess on [`stdout`](https://en.wikipedia.org/wiki/Standard_streams#Standard_output_(stdout)).

This is `undefined` if the [`stdout`](#optionsstdout) option is set to only [`'inherit'`](docs/output.md#terminal-output), [`'ignore'`](docs/output.md#ignore-output), [`Writable`](docs/streams.md#output) or [`integer`](docs/output.md#terminal-output), or if the [`buffer`](#optionsbuffer) option is `false`.

This is an array if the [`lines`](#optionslines) option is `true`, or if the `stdout` option is a [transform in object mode](docs/transform.md#object-mode).

[More info.](docs/output.md#stdout-and-stderr)

#### result.stderr

Type: `string | Uint8Array | string[] | Uint8Array[] | unknown[] | undefined`

The output of the subprocess on [`stderr`](https://en.wikipedia.org/wiki/Standard_streams#Standard_error_(stderr)).

This is `undefined` if the [`stderr`](#optionsstderr) option is set to only [`'inherit'`](docs/output.md#terminal-output), [`'ignore'`](docs/output.md#ignore-output), [`Writable`](docs/streams.md#output) or [`integer`](docs/output.md#terminal-output), or if the [`buffer`](#optionsbuffer) option is `false`.

This is an array if the [`lines`](#optionslines) option is `true`, or if the `stderr` option is a [transform in object mode](docs/transform.md#object-mode).

[More info.](docs/output.md#stdout-and-stderr)

#### result.all

Type: `string | Uint8Array | string[] | Uint8Array[] | unknown[] | undefined`

The output of the subprocess with [`result.stdout`](#resultstdout) and [`result.stderr`](#resultstderr) interleaved.

This requires the [`all`](#optionsall) option to be `true`.

This is `undefined` if both [`stdout`](#optionsstdout) and [`stderr`](#optionsstderr) options are set to only [`'inherit'`](docs/output.md#terminal-output), [`'ignore'`](docs/output.md#ignore-output), [`Writable`](docs/streams.md#output) or [`integer`](docs/output.md#terminal-output), or if the [`buffer`](#optionsbuffer) option is `false`.

This is an array if the [`lines`](#optionslines) option is `true`, or if either the `stdout` or `stderr` option is a [transform in object mode](docs/transform.md#object-mode).

[More info.](docs/output.md#interleaved-output)

#### result.stdio

Type: `Array<string | Uint8Array | string[] | Uint8Array[] | unknown[] | undefined>`

The output of the subprocess on [`stdin`](#optionsstdin), [`stdout`](#optionsstdout), [`stderr`](#optionsstderr) and [other file descriptors](#optionsstdio).

Items are `undefined` when their corresponding [`stdio`](#optionsstdio) option is set to [`'inherit'`](docs/output.md#terminal-output), [`'ignore'`](docs/output.md#ignore-output), [`Writable`](docs/streams.md#output) or [`integer`](docs/output.md#terminal-output), or if the [`buffer`](#optionsbuffer) option is `false`.

Items are arrays when their corresponding `stdio` option is a [transform in object mode](docs/transform.md#object-mode).

[More info.](docs/output.md#additional-file-descriptors)

#### result.failed

Type: `boolean`

Whether the subprocess failed to run.

[More info.](docs/errors.md#subprocess-failure)

#### result.timedOut

Type: `boolean`

Whether the subprocess timed out due to the [`timeout`](#optionstimeout) option.

[More info.](docs/termination.md#timeout)

#### result.isCanceled

Type: `boolean`

Whether the subprocess was canceled using the [`cancelSignal`](#optionscancelsignal) option.

[More info.](docs/termination.md#canceling)

#### result.isTerminated

Type: `boolean`

Whether the subprocess was terminated by a [signal](docs/termination.md#signal-termination) (like [`SIGTERM`](docs/termination.md#sigterm)) sent by either:
- The current process.
- [Another process](docs/termination.md#inter-process-termination). This case is [not supported on Windows](https://nodejs.org/api/process.html#signal-events).

[More info.](docs/termination.md#signal-name-and-description)

#### result.isMaxBuffer

Type: `boolean`

Whether the subprocess failed because its output was larger than the [`maxBuffer`](#optionsmaxbuffer) option.

[More info.](docs/output.md#big-output)

#### result.exitCode

Type: `number | undefined`

The numeric [exit code](https://en.wikipedia.org/wiki/Exit_status) of the subprocess that was run.

This is `undefined` when the subprocess could not be spawned or was terminated by a [signal](#resultsignal).

[More info.](docs/errors.md#exit-code)

#### result.signal

Type: `string | undefined`

The name of the [signal](docs/termination.md#signal-termination) (like [`SIGTERM`](docs/termination.md#sigterm)) that terminated the subprocess, sent by either:
- The current process.
- [Another process](docs/termination.md#inter-process-termination). This case is [not supported on Windows](https://nodejs.org/api/process.html#signal-events).

If a signal terminated the subprocess, this property is defined and included in the [error message](#errormessage). Otherwise it is `undefined`.

[More info.](docs/termination.md#signal-name-and-description)

#### result.signalDescription

Type: `string | undefined`

A human-friendly description of the [signal](docs/termination.md#signal-termination) that was used to terminate the subprocess.

If a signal terminated the subprocess, this property is defined and included in the error message. Otherwise it is `undefined`. It is also `undefined` when the signal is very uncommon which should seldomly happen.

[More info.](docs/termination.md#signal-name-and-description)

#### result.pipedFrom

Type: [`Array<Result | ExecaError>`](#result)

[Results](#result) of the other subprocesses that were [piped](#pipe-multiple-subprocesses) into this subprocess.

This array is initially empty and is populated each time the [`subprocess.pipe()`](#subprocesspipefile-arguments-options) method resolves.

[More info.](docs/pipe.md#errors)

### ExecaError
### ExecaSyncError

Type: `Error`

Exception thrown when the subprocess [fails](docs/errors.md#subprocess-failure).

This has the same shape as [successful results](#result), with the following additional properties.

[More info.](docs/errors.md)

#### error.message

Type: `string`

Error message when the subprocess [failed](docs/errors.md#subprocess-failure) to run.

[More info.](docs/errors.md#error-message)

#### error.shortMessage

Type: `string`

This is the same as [`error.message`](#errormessage) except it does not include the subprocess [output](docs/output.md).

[More info.](docs/errors.md#error-message)

#### error.originalMessage

Type: `string | undefined`

Original error message. This is the same as [`error.message`](#errormessage) excluding the subprocess [output](docs/output.md) and some additional information added by Execa.

[More info.](docs/errors.md#error-message)

#### error.cause

Type: `unknown | undefined`

Underlying error, if there is one. For example, this is set by [`subprocess.kill(error)`](#subprocesskillerror).

This is usually an `Error` instance.

[More info.](docs/termination.md#error-message-and-stack-trace)

#### error.code

Type: `string | undefined`

Node.js-specific [error code](https://nodejs.org/api/errors.html#errorcode), when available.

### options

Type: `object`

This lists all options for [`execa()`](#execafile-arguments-options) and the [other methods](#methods).

The following options [can specify different values](docs/output.md#stdoutstderr-specific-options) for [`stdout`](#optionsstdout) and [`stderr`](#optionsstderr): [`verbose`](#optionsverbose), [`lines`](#optionslines), [`stripFinalNewline`](#optionsstripfinalnewline), [`buffer`](#optionsbuffer), [`maxBuffer`](#optionsmaxbuffer).

#### options.reject

Type: `boolean`\
Default: `true`

Setting this to `false` resolves the [result's promise](#subprocess) with the [error](#execaerror) instead of rejecting it.

[More info.](docs/errors.md#preventing-exceptions)

#### options.shell

Type: `boolean | string | URL`\
Default: `false`

If `true`, runs the command inside of a [shell](https://en.wikipedia.org/wiki/Shell_(computing)).

Uses [`/bin/sh`](https://en.wikipedia.org/wiki/Unix_shell) on UNIX and [`cmd.exe`](https://en.wikipedia.org/wiki/Cmd.exe) on Windows. A different shell can be specified as a string. The shell should understand the `-c` switch on UNIX or `/d /s /c` on Windows.

We [recommend against](docs/shell.md#avoiding-shells) using this option.

[More info.](docs/shell.md)

#### options.cwd

Type: `string | URL`\
Default: `process.cwd()`

Current [working directory](https://en.wikipedia.org/wiki/Working_directory) of the subprocess.

This is also used to resolve the [`nodePath`](#optionsnodepath) option when it is a relative path.

[More info.](docs/environment.md#current-directory)

#### options.env

Type: `object`\
Default: [`process.env`](https://nodejs.org/api/process.html#processenv)

[Environment variables](https://en.wikipedia.org/wiki/Environment_variable).

Unless the [`extendEnv`](#optionsextendenv) option is `false`, the subprocess also uses the current process' environment variables ([`process.env`](https://nodejs.org/api/process.html#processenv)).

[More info.](docs/input.md#environment-variables)

#### options.extendEnv

Type: `boolean`\
Default: `true`

If `true`, the subprocess uses both the [`env`](#optionsenv) option and the current process' environment variables ([`process.env`](https://nodejs.org/api/process.html#processenv)).
If `false`, only the `env` option is used, not `process.env`.

[More info.](docs/input.md#environment-variables)

#### options.preferLocal

Type: `boolean`\
Default: `true` with [`$`](#file-arguments-options), `false` otherwise

Prefer locally installed binaries when looking for a binary to execute.

[More info.](docs/environment.md#local-binaries)

#### options.localDir

Type: `string | URL`\
Default: [`cwd`](#optionscwd) option

Preferred path to find locally installed binaries, when using the [`preferLocal`](#optionspreferlocal) option.

[More info.](docs/environment.md#local-binaries)

#### options.node

Type: `boolean`\
Default: `true` with [`execaNode()`](#execanodescriptpath-arguments-options), `false` otherwise

If `true`, runs with Node.js. The first argument must be a Node.js file.

[More info.](docs/node.md)

#### options.nodeOptions

Type: `string[]`\
Default: [`process.execArgv`](https://nodejs.org/api/process.html#process_process_execargv) (current Node.js CLI options)

List of [CLI flags](https://nodejs.org/api/cli.html#cli_options) passed to the [Node.js executable](#optionsnodepath).

Requires the [`node`](#optionsnode) option to be `true`.

[More info.](docs/node.md#nodejs-cli-flags)

#### options.nodePath

Type: `string | URL`\
Default: [`process.execPath`](https://nodejs.org/api/process.html#process_process_execpath) (current Node.js executable)

Path to the Node.js executable.

Requires the [`node`](#optionsnode) option to be `true`.

[More info.](docs/node.md#nodejs-version)

#### options.verbose

Type: `'none' | 'short' | 'full'`\
Default: `'none'`

If `verbose` is `'short'`, prints the command on [`stderr`](https://en.wikipedia.org/wiki/Standard_streams#Standard_error_(stderr)): its file, arguments, duration and (if it failed) error message.

If `verbose` is `'full'`, the command's [`stdout`](https://en.wikipedia.org/wiki/Standard_streams#Standard_output_(stdout)) and `stderr` are also printed.

By default, this applies to both `stdout` and `stderr`, but [different values can also be passed](docs/output.md#stdoutstderr-specific-options).

[More info.](docs/debugging.md#verbose-mode)

#### options.buffer

Type: `boolean`\
Default: `true`

When `buffer` is `false`, the [`result.stdout`](#resultstdout), [`result.stderr`](#resultstderr), [`result.all`](#resultall) and [`result.stdio`](#resultstdio) properties are not set.

By default, this applies to both `stdout` and `stderr`, but [different values can also be passed](docs/output.md#stdoutstderr-specific-options).

[More info.](docs/output.md#low-memory)

#### options.input

Type: `string | Uint8Array | stream.Readable`

Write some input to the subprocess' [`stdin`](https://en.wikipedia.org/wiki/Standard_streams#Standard_input_(stdin)).

See also the [`inputFile`](#optionsinputfile) and [`stdin`](#optionsstdin) options.

[More info.](docs/input.md#string-input)

#### options.inputFile

Type: `string | URL`

Use a file as input to the subprocess' [`stdin`](https://en.wikipedia.org/wiki/Standard_streams#Standard_input_(stdin)).

See also the [`input`](#optionsinput) and [`stdin`](#optionsstdin) options.

[More info.](docs/input.md#file-input)

#### options.stdin

Type: `string | number | stream.Readable | ReadableStream | TransformStream | URL | {file: string} | Uint8Array | Iterable<string | Uint8Array | unknown> | AsyncIterable<string | Uint8Array | unknown> | GeneratorFunction<string | Uint8Array | unknown> | AsyncGeneratorFunction<string | Uint8Array | unknown> | {transform: GeneratorFunction | AsyncGeneratorFunction | Duplex | TransformStream}` (or a tuple of those types)\
Default: `'inherit'` with [`$`](#file-arguments-options), `'pipe'` otherwise

How to setup the subprocess' [standard input](https://en.wikipedia.org/wiki/Standard_streams#Standard_input_(stdin)). This can be [`'pipe'`](docs/streams.md#manual-streaming), [`'overlapped'`](docs/windows.md#asynchronous-io), [`'ignore`](docs/input.md#ignore-input), [`'inherit'`](docs/input.md#terminal-input), a [file descriptor integer](docs/input.md#terminal-input), a [Node.js `Readable` stream](docs/streams.md#input), a web [`ReadableStream`](docs/streams.md#web-streams), a [`{ file: 'path' }` object](docs/input.md#file-input), a [file URL](docs/input.md#file-input), an [`Iterable`](docs/streams.md#iterables-as-input) (including an [array of strings](docs/input.md#string-input)), an [`AsyncIterable`](docs/streams.md#iterables-as-input), an [`Uint8Array`](docs/binary.md#binary-input), a [generator function](docs/transform.md), a [`Duplex`](docs/transform.md#duplextransform-streams) or a web [`TransformStream`](docs/transform.md#duplextransform-streams).

This can be an [array of values](docs/output.md#multiple-targets) such as `['inherit', 'pipe']` or `[fileUrl, 'pipe']`.

More info on [available values](docs/input.md), [streaming](docs/streams.md) and [transforms](docs/transform.md).

#### options.stdout

Type: `string | number | stream.Writable | WritableStream | TransformStream | URL | {file: string} | GeneratorFunction<string | Uint8Array | unknown> | AsyncGeneratorFunction<string | Uint8Array | unknown>  | {transform: GeneratorFunction | AsyncGeneratorFunction | Duplex | TransformStream}` (or a tuple of those types)\
Default: `pipe`

How to setup the subprocess' [standard output](https://en.wikipedia.org/wiki/Standard_streams#Standard_input_(stdin)). This can be [`'pipe'`](docs/output.md#stdout-and-stderr), [`'overlapped'`](docs/windows.md#asynchronous-io), [`'ignore`](docs/output.md#ignore-output), [`'inherit'`](docs/output.md#terminal-output), a [file descriptor integer](docs/output.md#terminal-output), a [Node.js `Writable` stream](docs/streams.md#output), a web [`WritableStream`](docs/streams.md#web-streams), a [`{ file: 'path' }` object](docs/output.md#file-output), a [file URL](docs/output.md#file-output), a [generator function](docs/transform.md), a [`Duplex`](docs/transform.md#duplextransform-streams) or a web [`TransformStream`](docs/transform.md#duplextransform-streams).

This can be an [array of values](docs/output.md#multiple-targets) such as `['inherit', 'pipe']` or `[fileUrl, 'pipe']`.

More info on [available values](docs/output.md), [streaming](docs/streams.md) and [transforms](docs/transform.md).

#### options.stderr

Type: `string | number | stream.Writable | WritableStream | TransformStream | URL | {file: string} | GeneratorFunction<string | Uint8Array | unknown> | AsyncGeneratorFunction<string | Uint8Array | unknown> | {transform: GeneratorFunction | AsyncGeneratorFunction | Duplex | TransformStream}` (or a tuple of those types)\
Default: `pipe`

How to setup the subprocess' [standard error](https://en.wikipedia.org/wiki/Standard_streams#Standard_input_(stdin)). This can be [`'pipe'`](docs/output.md#stdout-and-stderr), [`'overlapped'`](docs/windows.md#asynchronous-io), [`'ignore`](docs/output.md#ignore-output), [`'inherit'`](docs/output.md#terminal-output), a [file descriptor integer](docs/output.md#terminal-output), a [Node.js `Writable` stream](docs/streams.md#output), a web [`WritableStream`](docs/streams.md#web-streams), a [`{ file: 'path' }` object](docs/output.md#file-output), a [file URL](docs/output.md#file-output), a [generator function](docs/transform.md), a [`Duplex`](docs/transform.md#duplextransform-streams) or a web [`TransformStream`](docs/transform.md#duplextransform-streams).

This can be an [array of values](docs/output.md#multiple-targets) such as `['inherit', 'pipe']` or `[fileUrl, 'pipe']`.

More info on [available values](docs/output.md), [streaming](docs/streams.md) and [transforms](docs/transform.md).

#### options.stdio

Type: `string | Array<string | number | stream.Readable | stream.Writable | ReadableStream | WritableStream | TransformStream | URL | {file: string} | Uint8Array | Iterable<string> | Iterable<Uint8Array> | Iterable<unknown> | AsyncIterable<string | Uint8Array | unknown> | GeneratorFunction<string | Uint8Array | unknown> | AsyncGeneratorFunction<string | Uint8Array | unknown> | {transform: GeneratorFunction | AsyncGeneratorFunction | Duplex | TransformStream}>` (or a tuple of those types)\
Default: `pipe`

Like the [`stdin`](#optionsstdin), [`stdout`](#optionsstdout) and [`stderr`](#optionsstderr) options but for all [file descriptors](https://en.wikipedia.org/wiki/File_descriptor) at once. For example, `{stdio: ['ignore', 'pipe', 'pipe']}` is the same as `{stdin: 'ignore', stdout: 'pipe', stderr: 'pipe'}`.

A single string can be used [as a shortcut](docs/output.md#shortcut).

The array can have more than 3 items, to create [additional file descriptors](docs/output.md#additional-file-descriptors) beyond [`stdin`](#optionsstdin)/[`stdout`](#optionsstdout)/[`stderr`](#optionsstderr).

More info on [available values](docs/output.md), [streaming](docs/streams.md) and [transforms](docs/transform.md).

#### options.all

Type: `boolean`\
Default: `false`

Add a [`subprocess.all`](#subprocessall) stream and a [`result.all`](#resultall) property.

[More info.](docs/output.md#interleaved-output)

#### options.lines

Type: `boolean`\
Default: `false`

Set [`result.stdout`](#resultstdout), [`result.stderr`](#resultstdout), [`result.all`](#resultall) and [`result.stdio`](#resultstdio) as arrays of strings, splitting the subprocess' output into lines.

This cannot be used if the [`encoding`](#optionsencoding) option is [binary](docs/binary.md#binary-output).

By default, this applies to both `stdout` and `stderr`, but [different values can also be passed](docs/output.md#stdoutstderr-specific-options).

[More info.](docs/lines.md#simple-splitting)

#### options.encoding

Type: `'utf8' | 'utf16le' | 'buffer' | 'hex' | 'base64' | 'base64url' | 'latin1' | 'ascii'`\
Default: `'utf8'`

If the subprocess outputs text, specifies its character encoding, either [`'utf8'`](https://en.wikipedia.org/wiki/UTF-8) or [`'utf16le'`](https://en.wikipedia.org/wiki/UTF-16).

If it outputs binary data instead, this should be either:
- `'buffer'`: returns the binary output as an [`Uint8Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array).
- [`'hex'`](https://en.wikipedia.org/wiki/Hexadecimal), [`'base64'`](https://en.wikipedia.org/wiki/Base64), [`'base64url'`](https://en.wikipedia.org/wiki/Base64#URL_applications), [`'latin1'`](https://nodejs.org/api/buffer.html#buffers-and-character-encodings) or [`'ascii'`](https://nodejs.org/api/buffer.html#buffers-and-character-encodings): encodes the binary output as a string.

The output is available with [`result.stdout`](#resultstdout), [`result.stderr`](#resultstderr) and [`result.stdio`](#resultstdio).

[More info.](docs/binary.md)

#### options.stripFinalNewline

Type: `boolean`\
Default: `true`

Strip the final [newline character](https://en.wikipedia.org/wiki/Newline) from the output.

If the [`lines`](#optionslines) option is true, this applies to each output line instead.

By default, this applies to both `stdout` and `stderr`, but [different values can also be passed](docs/output.md#stdoutstderr-specific-options).

[More info.](docs/lines.md#newlines)

#### options.maxBuffer

Type: `number`\
Default: `100_000_000`

Largest amount of data allowed on [`stdout`](#resultstdout), [`stderr`](#resultstderr) and [`stdio`](#resultstdio).

By default, this applies to both `stdout` and `stderr`, but [different values can also be passed](docs/output.md#stdoutstderr-specific-options).

[More info.](docs/output.md#big-output)

#### options.ipc

Type: `boolean`\
Default: `true` if the [`node`](#optionsnode) option is enabled, `false` otherwise

Enables exchanging messages with the subprocess using [`subprocess.send(message)`](#subprocesssendmessage) and [`subprocess.on('message', (message) => {})`](#subprocessonmessage-message--void).

[More info.](docs/ipc.md)

#### options.serialization

Type: `'json' | 'advanced'`\
Default: `'advanced'`

Specify the kind of serialization used for sending messages between subprocesses when using the [`ipc`](#optionsipc) option.

[More info.](docs/ipc.md#message-type)

#### options.detached

Type: `boolean`\
Default: `false`

Run the subprocess independently from the current process.

[More info.](docs/environment.md#background-subprocess)

#### options.cleanup

Type: `boolean`\
Default: `true`

Kill the subprocess when the current process exits.

[More info.](docs/termination.md#current-process-exit)

#### options.timeout

Type: `number`\
Default: `0`

If `timeout` is greater than `0`, the subprocess will be [terminated](#optionskillsignal) if it runs for longer than that amount of milliseconds.

On timeout, [`result.timedOut`](#resulttimedout) becomes `true`.

[More info.](docs/termination.md#timeout)

#### options.cancelSignal

Type: [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)

You can abort the subprocess using [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).

When `AbortController.abort()` is called, [`result.isCanceled`](#resultiscanceled) becomes `true`.

[More info.](docs/termination.md#canceling)

#### options.forceKillAfterDelay

Type: `number | false`\
Default: `5000`

If the subprocess is terminated but does not exit, forcefully exit it by sending [`SIGKILL`](https://en.wikipedia.org/wiki/Signal_(IPC)#SIGKILL).

[More info.](docs/termination.md#forceful-termination)

#### options.killSignal

Type: `string | number`\
Default: `'SIGTERM'`

Default [signal](https://en.wikipedia.org/wiki/Signal_(IPC)) used to terminate the subprocess.

This can be either a name (like [`'SIGTERM'`](docs/termination.md#sigterm)) or a number (like `9`).

[More info.](docs/termination.md#default-signal)

#### options.argv0

Type: `string`\
Default: file being executed

Value of [`argv[0]`](https://nodejs.org/api/process.html#processargv0) sent to the subprocess.

#### options.uid

Type: `number`\
Default: current user identifier

Sets the [user identifier](https://en.wikipedia.org/wiki/User_identifier) of the subprocess.

[More info.](docs/windows.md#uid-and-gid)

#### options.gid

Type: `number`\
Default: current group identifier

Sets the [group identifier](https://en.wikipedia.org/wiki/Group_identifier) of the subprocess.

[More info.](docs/windows.md#uid-and-gid)

#### options.windowsVerbatimArguments

Type: `boolean`\
Default: `true` if the [`shell`](#optionsshell) option is `true`, `false` otherwise

If `false`, escapes the command arguments on Windows.

[More info.](docs/windows.md#cmdexe-escaping)

#### options.windowsHide

Type: `boolean`\
Default: `true`

On Windows, do not create a new console window.

[More info.](docs/windows.md#console-window)

### Transform options

A transform or an [array of transforms](docs/transform.md#combining) can be passed to the [`stdin`](#optionsstdin), [`stdout`](#optionsstdout), [`stderr`](#optionsstderr) or [`stdio`](#optionsstdio) option.

A transform is either a [generator function](#transformoptionstransform) or a plain object with the following members.

[More info.](docs/transform.md)

#### transformOptions.transform

Type: `GeneratorFunction<string | Uint8Array | unknown>` | `AsyncGeneratorFunction<string | Uint8Array | unknown>`

Map or [filter](docs/transform.md#filtering) the [input](docs/input.md) or [output](docs/output.md) of the subprocess.

More info [here](docs/transform.md#summary) and [there](docs/transform.md#sharing-state).

#### transformOptions.final

Type: `GeneratorFunction<string | Uint8Array | unknown>` | `AsyncGeneratorFunction<string | Uint8Array | unknown>`

Create additional lines after the last one.

[More info.](docs/transform.md#finalizing)

#### transformOptions.binary

Type: `boolean`\
Default: `false`

If `true`, iterate over arbitrary chunks of `Uint8Array`s instead of line `string`s.

[More info.](docs/binary.md#transforms)

#### transformOptions.preserveNewlines

Type: `boolean`\
Default: `false`

If `true`, keep newlines in each `line` argument. Also, this allows multiple `yield`s to produces a single line.

[More info.](docs/lines.md#transforms)

#### transformOptions.objectMode

Type: `boolean`\
Default: `false`

If `true`, allow [`transformOptions.transform`](#transformoptionstransform) and [`transformOptions.final`](#transformoptionsfinal) to return any type, not just `string` or `Uint8Array`.

[More info.](docs/transform.md#object-mode)

## Related

- [gulp-execa](https://github.com/ehmicky/gulp-execa) - Gulp plugin for Execa
- [nvexeca](https://github.com/ehmicky/nvexeca) - Run Execa using any Node.js version

## Maintainers

- [Sindre Sorhus](https://github.com/sindresorhus)
- [@ehmicky](https://github.com/ehmicky)
