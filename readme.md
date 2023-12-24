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
- [Cleans up](#cleanup) child processes when the parent process ends.
- [Graceful termination](#optionsforcekillaftertimeout).
- Get [interleaved output](#all) from `stdout` and `stderr` similar to what is printed on the terminal.
- [Strips the final newline](#stripfinalnewline) from the output so you don't have to do `stdout.trim()`.
- Convenience methods to pipe processes' [input](#input) and [output](#redirect-output-to-a-file).
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

#### Shared options

```js
import {$} from 'execa';

const $$ = $({stdio: 'inherit'});

await $$`echo unicorns`;
//=> 'unicorns'

await $$`echo rainbows`;
//=> 'rainbows'
```

#### Verbose mode

```sh
> node file.js
unicorns
rainbows

> NODE_DEBUG=execa node file.js
[16:50:03.305] echo unicorns
unicorns
[16:50:03.308] echo rainbows
rainbows
```

### Input/output

#### Redirect output to a file

```js
import {execa} from 'execa';

// Similar to `echo unicorns > stdout.txt` in Bash
await execa('echo', ['unicorns']).pipeStdout('stdout.txt');

// Similar to `echo unicorns 2> stdout.txt` in Bash
await execa('echo', ['unicorns']).pipeStderr('stderr.txt');

// Similar to `echo unicorns &> stdout.txt` in Bash
await execa('echo', ['unicorns'], {all: true}).pipeAll('all.txt');
```

#### Redirect input from a file

```js
import {execa} from 'execa';

// Similar to `cat < stdin.txt` in Bash
const {stdout} = await execa('cat', {inputFile: 'stdin.txt'});
console.log(stdout);
//=> 'unicorns'
```

#### Save and pipe output from a child process

```js
import {execa} from 'execa';

const {stdout} = await execa('echo', ['unicorns']).pipeStdout(process.stdout);
// Prints `unicorns`
console.log(stdout);
// Also returns 'unicorns'
```

#### Pipe multiple processes

```js
import {execa} from 'execa';

// Similar to `echo unicorns | cat` in Bash
const {stdout} = await execa('echo', ['unicorns']).pipeStdout(execa('cat'));
console.log(stdout);
//=> 'unicorns'
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
	{
		message: 'Command failed with ENOENT: unknown command spawn unknown ENOENT',
		errno: -2,
		code: 'ENOENT',
		syscall: 'spawn unknown',
		path: 'unknown',
		spawnargs: ['command'],
		originalMessage: 'spawn unknown ENOENT',
		shortMessage: 'Command failed with ENOENT: unknown command spawn unknown ENOENT',
		command: 'unknown command',
		escapedCommand: 'unknown command',
		stdout: '',
		stderr: '',
		failed: true,
		timedOut: false,
		isCanceled: false,
		isTerminated: false
	}
	*/
}
```

### Graceful termination

Using SIGTERM, and after 2 seconds, kill it with SIGKILL.

```js
const subprocess = execa('node');

setTimeout(() => {
	subprocess.kill('SIGTERM', {
		forceKillAfterTimeout: 2000
	});
}, 1000);
```

## API

### Methods

#### execa(file, arguments?, options?)

Executes a command using `file ...arguments`. `file` is a string or a file URL. `arguments` are an array of strings. Returns a [`childProcess`](#childprocess).

Arguments are [automatically escaped](#shell-syntax). They can contain any character, including spaces.

This is the preferred method when executing single commands.

#### execaNode(scriptPath, arguments?, options?)

Executes a Node.js file using `node scriptPath ...arguments`. `file` is a string or a file URL. `arguments` are an array of strings. Returns a [`childProcess`](#childprocess).

Arguments are [automatically escaped](#shell-syntax). They can contain any character, including spaces.

This is the preferred method when executing Node.js files.

Like [`child_process#fork()`](https://nodejs.org/api/child_process.html#child_process_child_process_fork_modulepath_args_options):
- the current Node version and options are used. This can be overridden using the [`nodePath`](#nodepath-for-node-only) and [`nodeOptions`](#nodeoptions-for-node-only) options.
- the [`shell`](#shell) option cannot be used
- an extra channel [`ipc`](https://nodejs.org/api/child_process.html#child_process_options_stdio) is passed to [`stdio`](#stdio)

#### $\`command\`

Executes a command. The `command` string includes both the `file` and its `arguments`. Returns a [`childProcess`](#childprocess).

Arguments are [automatically escaped](#shell-syntax). They can contain any character, but spaces must use `${}` like `` $`echo ${'has space'}` ``.

This is the preferred method when executing multiple commands in a script file.

The `command` string can inject any `${value}` with the following types: string, number, [`childProcess`](#childprocess) or an array of those types. For example: `` $`echo one ${'two'} ${3} ${['four', 'five']}` ``. For `${childProcess}`, the process's `stdout` is used.

For more information, please see [this section](#scripts-interface) and [this page](docs/scripts.md).

#### $(options)

Returns a new instance of [`$`](#command) but with different default `options`. Consecutive calls are merged to previous ones.

This can be used to either:
- Set options for a specific command: `` $(options)`command` ``
- Share options for multiple commands: `` const $$ = $(options); $$`command`; $$`otherCommand`; ``

#### execaCommand(command, options?)

Executes a command. The `command` string includes both the `file` and its `arguments`. Returns a [`childProcess`](#childprocess).

Arguments are [automatically escaped](#shell-syntax). They can contain any character, but spaces must be escaped with a backslash like `execaCommand('echo has\\ space')`.

This is the preferred method when executing a user-supplied `command` string, such as in a REPL.

### execaSync(file, arguments?, options?)

Same as [`execa()`](#execacommandcommand-options) but synchronous.

Returns or throws a [`childProcessResult`](#childProcessResult).

### $.sync\`command\`
### $.s\`command\`

Same as [$\`command\`](#command) but synchronous.

Returns or throws a [`childProcessResult`](#childProcessResult).

### execaCommandSync(command, options?)

Same as [`execaCommand()`](#execacommand-command-options) but synchronous.

Returns or throws a [`childProcessResult`](#childProcessResult).

### Shell syntax

For all the [methods above](#methods), no shell interpreter (Bash, cmd.exe, etc.) is used unless the [`shell` option](#shell) is set. This means shell-specific characters and expressions (`$variable`, `&&`, `||`, `;`, `|`, etc.) have no special meaning and do not need to be escaped.

### childProcess

The return value of all [asynchronous methods](#methods) is both:
- a `Promise` resolving or rejecting with a [`childProcessResult`](#childProcessResult).
- a [`child_process` instance](https://nodejs.org/api/child_process.html#child_process_class_childprocess) with the following additional methods and properties.

#### kill(signal?, options?)

Same as the original [`child_process#kill()`](https://nodejs.org/api/child_process.html#child_process_subprocess_kill_signal) except: if `signal` is `SIGTERM` (the default value) and the child process is not terminated after 5 seconds, force it by sending `SIGKILL`.

Note that this graceful termination does not work on Windows, because Windows [doesn't support signals](https://nodejs.org/api/process.html#process_signal_events) (`SIGKILL` and `SIGTERM` has the same effect of force-killing the process immediately.) If you want to achieve graceful termination on Windows, you have to use other means, such as [`taskkill`](https://github.com/sindresorhus/taskkill).

##### options.forceKillAfterTimeout

Type: `number | false`\
Default: `5000`

Milliseconds to wait for the child process to terminate before sending `SIGKILL`.

Can be disabled with `false`.

#### all

Type: `ReadableStream | undefined`

Stream [combining/interleaving](#ensuring-all-output-is-interleaved) [`stdout`](https://nodejs.org/api/child_process.html#child_process_subprocess_stdout) and [`stderr`](https://nodejs.org/api/child_process.html#child_process_subprocess_stderr).

This is `undefined` if either:
- the [`all` option](#all-2) is `false` (the default value)
- the [synchronous methods](#execasyncfile-arguments-options) are used
- both [`stdout`](#stdout-1) and [`stderr`](#stderr-1) options are set to [`'inherit'`, `'ipc'`, `'ignore'`, `Stream` or `integer`](https://nodejs.org/api/child_process.html#child_process_options_stdio)

#### pipeStdout(target)

[Pipe](https://nodejs.org/api/stream.html#readablepipedestination-options) the child process's `stdout` to `target`, which can be:
- Another [`execa()` return value](#pipe-multiple-processes)
- A [writable stream](#save-and-pipe-output-from-a-child-process)
- A [file path string](#redirect-output-to-a-file)

If the `target` is another [`execa()` return value](#execacommandcommand-options), it is returned. Otherwise, the original `execa()` return value is returned. This allows chaining `pipeStdout()` then `await`ing the [final result](#childprocessresult).

The [`stdout` option](#stdout-1) must be kept as `pipe`, its default value.

#### pipeStderr(target)

Like [`pipeStdout()`](#pipestdouttarget) but piping the child process's `stderr` instead.

The [`stderr` option](#stderr-1) must be kept as `pipe`, its default value.

#### pipeAll(target)

Combines both [`pipeStdout()`](#pipestdouttarget) and [`pipeStderr()`](#pipestderrtarget).

Either the [`stdout` option](#stdout-1) or the [`stderr` option](#stderr-1) must be kept as `pipe`, their default value. Also, the [`all` option](#all-2) must be set to `true`.

### childProcessResult

Type: `object`

Result of a child process execution. On success this is a plain object. On failure this is also an `Error` instance.

The child process [fails](#failed) when:
- its [exit code](#exitcode) is not `0`
- it was [terminated](#isterminated) with a [signal](#signal)
- [timing out](#timedout)
- [being canceled](#iscanceled)
- there's not enough memory or there are already too many child processes

#### command

Type: `string`

The file and arguments that were run, for logging purposes.

This is not escaped and should not be executed directly as a process, including using [`execa()`](#execafile-arguments-options) or [`execaCommand()`](#execacommandcommand-options).

#### escapedCommand

Type: `string`

Same as [`command`](#command-1) but escaped.

This is meant to be copy and pasted into a shell, for debugging purposes.
Since the escaping is fairly basic, this should not be executed directly as a process, including using [`execa()`](#execafile-arguments-options) or [`execaCommand()`](#execacommandcommand-options).

#### exitCode

Type: `number`

The numeric exit code of the process that was run.

#### stdout

Type: `string | Uint8Array | undefined`

The output of the process on `stdout`.

This is `undefined` if the [`stdout`](#stdout-1) option is set to [`'inherit'`, `'ipc'`, `'ignore'`, `Stream` or `integer`](https://nodejs.org/api/child_process.html#child_process_options_stdio).

#### stderr

Type: `string | Uint8Array | undefined`

The output of the process on `stderr`.

This is `undefined` if the [`stderr`](#stderr-1) option is set to [`'inherit'`, `'ipc'`, `'ignore'`, `Stream` or `integer`](https://nodejs.org/api/child_process.html#child_process_options_stdio).

#### all

Type: `string | Uint8Array | undefined`

The output of the process with `stdout` and `stderr` [interleaved](#ensuring-all-output-is-interleaved).

This is `undefined` if either:
- the [`all` option](#all-2) is `false` (the default value)
- the [synchronous methods](#execasyncfile-arguments-options) are used
- both [`stdout`](#stdout-1) and [`stderr`](#stderr-1) options are set to [`'inherit'`, `'ipc'`, `'ignore'`, `Stream` or `integer`](https://nodejs.org/api/child_process.html#child_process_options_stdio)

#### failed

Type: `boolean`

Whether the process failed to run.

#### timedOut

Type: `boolean`

Whether the process timed out.

#### isCanceled

Type: `boolean`

Whether the process was canceled.

You can cancel the spawned process using the [`signal`](#signal-1) option.

#### isTerminated

Type: `boolean`

Whether the process was terminated using either:
- [`childProcess.kill()`](#killsignal-options).
- A signal sent by another process. This case is [not supported on Windows](https://nodejs.org/api/process.html#signal-events).

#### signal

Type: `string | undefined`

The name of the signal (like `SIGFPE`) that terminated the process using either:
- [`childProcess.kill()`](#killsignal-options).
- A signal sent by another process. This case is [not supported on Windows](https://nodejs.org/api/process.html#signal-events).

If a signal terminated the process, this property is defined and included in the error message. Otherwise it is `undefined`.

#### signalDescription

Type: `string | undefined`

A human-friendly description of the signal that was used to terminate the process. For example, `Floating point arithmetic error`.

If a signal terminated the process, this property is defined and included in the error message. Otherwise it is `undefined`. It is also `undefined` when the signal is very uncommon which should seldomly happen.

#### cwd

Type: `string`

The `cwd` of the command if provided in the [command options](#cwd-1). Otherwise it is `process.cwd()`.

#### message

Type: `string`

Error message when the child process failed to run. In addition to the [underlying error message](#originalMessage), it also contains some information related to why the child process errored.

The child process [`stderr`](#stderr) then [`stdout`](#stdout) are appended to the end, separated with newlines and not interleaved.

#### shortMessage

Type: `string`

This is the same as the [`message` property](#message) except it does not include the child process `stdout`/`stderr`.

#### originalMessage

Type: `string | undefined`

Original error message. This is the same as the `message` property excluding the child process `stdout`/`stderr` and some additional information added by Execa.

This is `undefined` unless the child process exited due to an `error` event or a timeout.

### options

Type: `object`

#### cleanup

Type: `boolean`\
Default: `true`

Kill the spawned process when the parent process exits unless either:
	- the spawned process is [`detached`](https://nodejs.org/api/child_process.html#child_process_options_detached)
	- the parent process is terminated abruptly, for example, with `SIGKILL` as opposed to `SIGTERM` or a normal exit

#### preferLocal

Type: `boolean`\
Default: `true` with [`$`](#command), `false` otherwise

Prefer locally installed binaries when looking for a binary to execute.\
If you `$ npm install foo`, you can then `execa('foo')`.

#### localDir

Type: `string | URL`\
Default: `process.cwd()`

Preferred path to find locally installed binaries in (use with `preferLocal`).

#### execPath

Type: `string | URL`\
Default: `process.execPath` (Current Node.js executable)

Path to the Node.js executable to use in child processes.

This can be either an absolute path or a path relative to the [`cwd` option](#cwd).

Requires [`preferLocal`](#preferlocal) to be `true`.

For example, this can be used together with [`get-node`](https://github.com/ehmicky/get-node) to run a specific Node.js version in a child process.

#### buffer

Type: `boolean`\
Default: `true`

Buffer the output from the spawned process. When set to `false`, you must read the output of [`stdout`](#stdout-1) and [`stderr`](#stderr-1) (or [`all`](#all) if the [`all`](#all-2) option is `true`). Otherwise the returned promise will not be resolved/rejected.

If the spawned process fails, [`error.stdout`](#stdout), [`error.stderr`](#stderr), and [`error.all`](#all) will contain the buffered data.

#### input

Type: `string | Uint8Array | stream.Readable`

Write some input to the child process' `stdin`.\
Streams are not allowed when using the [synchronous methods](#execasyncfile-arguments-options).

See also the [`inputFile`](#inputfile) and [`stdin`](#stdin) options.

#### inputFile

Type: `string | URL`

Use a file as input to the child process' `stdin`.

See also the [`input`](#input) and [`stdin`](#stdin) options.

#### stdin

Type: `string | number | stream.Readable | ReadableStream | URL | Iterable<string | Uint8Array> | AsyncIterable<string | Uint8Array>` (or a tuple of those types)\
Default: `inherit` with [`$`](#command), `pipe` otherwise

[How to setup](https://nodejs.org/api/child_process.html#child_process_options_stdio) the child process' standard input. This can be:
- `'pipe'`: Sets [`childProcess.stdin`](https://nodejs.org/api/child_process.html#subprocessstdin) stream.
- `'overlapped'`: Like `'pipe'` but asynchronous on Windows.
- `'ignore'`: Do not use `stdin`.
- `'ipc'`: Sets an [IPC channel](https://nodejs.org/api/child_process.html#subprocesssendmessage-sendhandle-options-callback). You can also use [`execaNode()`](#execanodescriptpath-arguments-options) instead.
- `'inherit'`: Re-use the current process' `stdin`.
- an integer: Re-use a specific file descriptor from the current process.
- a Node.js `Readable` stream. It must have an underlying file or socket, such as the streams created by the `fs`, `net` or `http` core modules.

Unless either the [synchronous methods](#execasyncfile-arguments-options), the [`input` option](#input) or the [`inputFile` option](#inputfile) is used, the value can also be a:
- file path. If relative, it must start with `.`.
- file URL.
- web [`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream).
- [`Iterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterable_protocol) or [`AsyncIterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_async_iterator_and_async_iterable_protocols)

This can be an [array of values](#redirect-stdinstdoutstderr-to-multiple-destinations) such as `['inherit', 'pipe']` or `[filePath, 'pipe']`.

#### stdout

Type: `string | number | stream.Writable | WritableStream | URL` (or a tuple of those types)\
Default: `pipe`

[How to setup](https://nodejs.org/api/child_process.html#child_process_options_stdio) the child process' standard output. This can be:
- `'pipe'`: Sets [`childProcessResult.stdout`](#stdout) (as a string or `Uint8Array`) and [`childProcess.stdout`](https://nodejs.org/api/child_process.html#subprocessstdout) (as a stream).
- `'overlapped'`: Like `'pipe'` but asynchronous on Windows.
- `'ignore'`: Do not use `stdout`.
- `'ipc'`: Sets an [IPC channel](https://nodejs.org/api/child_process.html#subprocesssendmessage-sendhandle-options-callback). You can also use [`execaNode()`](#execanodescriptpath-arguments-options) instead.
- `'inherit'`: Re-use the current process' `stdout`.
- an integer: Re-use a specific file descriptor from the current process.
- a Node.js `Writable` stream. It must have an underlying file or socket, such as the streams created by the `fs`, `net` or `http` core modules.

Unless either [synchronous methods](#execasyncfile-arguments-options), the value can also be a:
- file path. If relative, it must start with `.`.
- file URL.
- web [`WritableStream`](https://developer.mozilla.org/en-US/docs/Web/API/WritableStream).

This can be an [array of values](#redirect-stdinstdoutstderr-to-multiple-destinations) such as `['inherit', 'pipe']` or `[filePath, 'pipe']`.

#### stderr

Type: `string | number | stream.Writable | WritableStream | URL` (or a tuple of those types)`\
Default: `pipe`

[How to setup](https://nodejs.org/api/child_process.html#child_process_options_stdio) the child process' standard error. This can be:
- `'pipe'`: Sets [`childProcessResult.stderr`](#stderr) (as a string or `Uint8Array`) and [`childProcess.stderr`](https://nodejs.org/api/child_process.html#subprocessstderr) (as a stream).
- `'overlapped'`: Like `'pipe'` but asynchronous on Windows.
- `'ignore'`: Do not use `stderr`.
- `'ipc'`: Sets an [IPC channel](https://nodejs.org/api/child_process.html#subprocesssendmessage-sendhandle-options-callback). You can also use [`execaNode()`](#execanodescriptpath-arguments-options) instead.
- `'inherit'`: Re-use the current process' `stderr`.
- an integer: Re-use a specific file descriptor from the current process.
- a Node.js `Writable` stream. It must have an underlying file or socket, such as the streams created by the `fs`, `net` or `http` core modules.

Unless either [synchronous methods](#execasyncfile-arguments-options), the value can also be a:
- file path. If relative, it must start with `.`.
- file URL.
- web [`WritableStream`](https://developer.mozilla.org/en-US/docs/Web/API/WritableStream).

This can be an [array of values](#redirect-stdinstdoutstderr-to-multiple-destinations) such as `['inherit', 'pipe']` or `[filePath, 'pipe']`.

#### stdio

Type: `string | Array<string | number | stream.Readable | stream.Writable | ReadableStream | WritableStream | URL | Iterable<string | Uint8Array> | AsyncIterable<string | Uint8Array>>` (or a tuple of those types)\
Default: `pipe`

Like the [`stdin`](#stdin), [`stdout`](#stdout-1) and [`stderr`](#stderr-1) options but for all file descriptors at once. For example, `{stdio: ['ignore', 'pipe', 'pipe']}` is the same as `{stdin: 'ignore', stdout: 'pipe', stderr: 'pipe'}`.

A single string can be used as a shortcut. For example, `{stdio: 'pipe'}` is the same as `{stdin: 'pipe', stdout: 'pipe', stderr: 'pipe'}`.

The array can have more than 3 items, to create additional file descriptors beyond `stdin`/`stdout`/`stderr`. For example, `{stdio: ['pipe', 'pipe', 'pipe', 'ipc']}` sets a fourth file descriptor `'ipc'`.

#### all

Type: `boolean`\
Default: `false`

Add an `.all` property on the [promise](#all) and the [resolved value](#all-1). The property contains the output of the process with `stdout` and `stderr` [interleaved](#ensuring-all-output-is-interleaved).

#### reject

Type: `boolean`\
Default: `true`

Setting this to `false` resolves the promise with the error instead of rejecting it.

#### stripFinalNewline

Type: `boolean`\
Default: `true`

Strip the final [newline character](https://en.wikipedia.org/wiki/Newline) from the output.

#### extendEnv

Type: `boolean`\
Default: `true`

Set to `false` if you don't want to extend the environment variables when providing the `env` property.

---

Execa also accepts the below options which are the same as the options for [`child_process#spawn()`](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options)/[`child_process#exec()`](https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback)

#### cwd

Type: `string | URL`\
Default: `process.cwd()`

Current working directory of the child process.

#### env

Type: `object`\
Default: `process.env`

Environment key-value pairs. Extends automatically from `process.env`. Set [`extendEnv`](#extendenv) to `false` if you don't want this.

#### argv0

Type: `string`

Explicitly set the value of `argv[0]` sent to the child process. This will be set to `file` if not specified.

#### serialization

Type: `string`\
Default: `'json'`

Specify the kind of serialization used for sending messages between processes when using the [`stdio: 'ipc'`](#stdio) option or [`execaNode()`](#execanodescriptpath-arguments-options):
	- `json`: Uses `JSON.stringify()` and `JSON.parse()`.
	- `advanced`: Uses [`v8.serialize()`](https://nodejs.org/api/v8.html#v8_v8_serialize_value)

[More info.](https://nodejs.org/api/child_process.html#child_process_advanced_serialization)

#### detached

Type: `boolean`

Prepare child to run independently of its parent process. Specific behavior [depends on the platform](https://nodejs.org/api/child_process.html#child_process_options_detached).

#### uid

Type: `number`

Sets the user identity of the process.

#### gid

Type: `number`

Sets the group identity of the process.

#### shell

Type: `boolean | string | URL`\
Default: `false`

If `true`, runs `file` inside of a shell. Uses `/bin/sh` on UNIX and `cmd.exe` on Windows. A different shell can be specified as a string. The shell should understand the `-c` switch on UNIX or `/d /s /c` on Windows.

We recommend against using this option since it is:
- not cross-platform, encouraging shell-specific syntax.
- slower, because of the additional shell interpretation.
- unsafe, potentially allowing command injection.

#### encoding

Type: `string`\
Default: `utf8`

Specify the character encoding used to decode the `stdout` and `stderr` output. If set to `'buffer'`, then `stdout` and `stderr` will be a `Uint8Array` instead of a string.

#### timeout

Type: `number`\
Default: `0`

If timeout is greater than `0`, the parent will send the signal identified by the `killSignal` property (the default is `SIGTERM`) if the child runs longer than timeout milliseconds.

#### maxBuffer

Type: `number`\
Default: `100_000_000` (100 MB)

Largest amount of data in bytes allowed on `stdout` or `stderr`.

#### killSignal

Type: `string | number`\
Default: `SIGTERM`

Signal value to be used when the spawned process will be killed.

#### signal

Type: [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)

You can abort the spawned process using [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).

When `AbortController.abort()` is called, [`.isCanceled`](#iscanceled) becomes `true`.

#### windowsVerbatimArguments

Type: `boolean`\
Default: `false`

If `true`, no quoting or escaping of arguments is done on Windows. Ignored on other platforms. This is set to `true` automatically when the `shell` option is `true`.

#### windowsHide

Type: `boolean`\
Default: `true`

On Windows, do not create a new console window. Please note this also prevents `CTRL-C` [from working](https://github.com/nodejs/node/issues/29837) on Windows.

#### verbose

Type: `boolean`\
Default: `false`

[Print each command](#verbose-mode) on `stderr` before executing it.

This can also be enabled by setting the `NODE_DEBUG=execa` environment variable in the current process.

#### nodePath *(For `.node()` only)*

Type: `string | URL`\
Default: [`process.execPath`](https://nodejs.org/api/process.html#process_process_execpath)

Node.js executable used to create the child process.

#### nodeOptions *(For `.node()` only)*

Type: `string[]`\
Default: [`process.execArgv`](https://nodejs.org/api/process.html#process_process_execargv)

List of [CLI options](https://nodejs.org/api/cli.html#cli_options) passed to the Node.js executable.

## Tips

### Redirect stdin/stdout/stderr to multiple destinations

The [`stdin`](#stdin), [`stdout`](#stdout-1) and [`stderr`](#stderr-1) options can be an array of values.
The following example redirects `stdout` to both the terminal and an `output.txt` file, while also retrieving its value programmatically.

```js
const {stdout} = await execa('npm', ['install'], {stdout: ['inherit', './output.txt', 'pipe']})
console.log(stdout);
```

When combining `inherit` with other values, please note that the child process will not be an interactive TTY, even if the parent process is one.

### Retry on error

Gracefully handle failures by using automatic retries and exponential backoff with the [`p-retry`](https://github.com/sindresorhus/p-retry) package:

```js
import pRetry from 'p-retry';

const run = async () => {
	const results = await execa('curl', ['-sSL', 'https://sindresorhus.com/unicorn']);
	return results;
};

console.log(await pRetry(run, {retries: 5}));
```

### Cancelling a spawned process

```js
import {execa} from 'execa';

const abortController = new AbortController();
const subprocess = execa('node', [], {signal: abortController.signal});

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

However, for performance reasons, the child process might buffer and merge multiple simultaneous writes to `stdout` or `stderr`. This prevents proper interleaving.

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
