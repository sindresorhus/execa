<picture>
	<source media="(prefers-color-scheme: dark)" srcset="media/logo_dark.svg">
	<img alt="execa logo" src="media/logo.svg" width="400">
</picture>
<br>

[![Coverage Status](https://codecov.io/gh/sindresorhus/execa/branch/main/graph/badge.svg)](https://codecov.io/gh/sindresorhus/execa)

> Process execution for humans

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

```js
import {execa} from 'execa';

const {stdout} = await execa('echo', ['unicorns']);
console.log(stdout);
//=> 'unicorns'
```

### Scripts interface

For more information, please see [this page](docs/scripts.md).

#### Basic

```js
import {$} from 'execa';

const {stdout} = await $`echo unicorns`;
// const {stdout} = await $`echo ${'unicorns'}`;
// const {stdout} = await $`echo ${['unicorns', 'rainbows']}`;

console.log(stdout);
//=> 'unicorns'
```

#### With options

```js
import {$} from 'execa';

await $({stdio: 'inherit'})`echo unicorns`;
//=> 'unicorns'
```

#### With pre-defined options

```js
import {$} from 'execa';

const $$ = $({stdio: 'inherit'});

await $$`echo unicorns`;
//=> 'unicorns'
await $$({shell: true})`echo unicorns && echo rainbows`;
//=> 'unicorns'
//=> 'rainbows'
```

#### Synchronous

```js
import {$} from 'execa';

const {stdout} = $.sync`echo unicorns`;
console.log(stdout);
//=> 'unicorns'

$({stdio: 'inherit'}).sync`echo rainbows`;
//=> 'rainbows'
```

#### With results from `$` or `$.sync`

```js
import {$} from 'execa';

const unicorns = await $`echo unicorns`;

$({stdio: 'inherit'}).sync`echo ${unicorns} rainbows`;
//=> 'unicorns rainbows'
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

### Redirect output to a file

```js
import {execa} from 'execa';

// Similar to `echo unicorns > stdout.txt` in Bash
await execa('echo', ['unicorns']).pipeStdout('stdout.txt');

// Similar to `echo unicorns 2> stdout.txt` in Bash
await execa('echo', ['unicorns']).pipeStderr('stderr.txt');

// Similar to `echo unicorns &> stdout.txt` in Bash
await execa('echo', ['unicorns'], {all:true}).pipeAll('all.txt');
```

### Redirect input from a file

```js
import {execa} from 'execa';

// Similar to `cat < stdin.txt` in Bash
const {stdout} = await execa('cat', {input:fs.createReadStream('stdin.txt')});
console.log(stdout);
//=> 'unicorns'
```

### Save and pipe output from a child process

```js
import {execa} from 'execa';

const {stdout} = await execa('echo', ['unicorns']).pipeStdout(process.stdout);
// Prints `unicorns`
console.log(stdout);
// Also returns 'unicorns'
```

### Pipe multiple processes

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
		all: '',
		failed: true,
		timedOut: false,
		isCanceled: false,
		killed: false
	}
	*/
}
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
	console.log(subprocess.killed); // true
	console.log(error.isCanceled); // true
}
```

### Catching an error with the sync method

```js
import {execaSync} from 'execa';

try {
	execaSync('unknown', ['command']);
} catch (error) {
	console.log(error);
	/*
	{
		message: 'Command failed with ENOENT: unknown command spawnSync unknown ENOENT',
		errno: -2,
		code: 'ENOENT',
		syscall: 'spawnSync unknown',
		path: 'unknown',
		spawnargs: ['command'],
		originalMessage: 'spawnSync unknown ENOENT',
		shortMessage: 'Command failed with ENOENT: unknown command spawnSync unknown ENOENT',
		command: 'unknown command',
		escapedCommand: 'unknown command',
		stdout: '',
		stderr: '',
		all: '',
		failed: true,
		timedOut: false,
		isCanceled: false,
		killed: false
	}
	*/
}
```

### Kill a process

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

### execa(file, arguments, options?)

Execute a file. Think of this as a mix of [`child_process.execFile()`](https://nodejs.org/api/child_process.html#child_process_child_process_execfile_file_args_options_callback) and [`child_process.spawn()`](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options). This returns a [`childProcess`](#childprocess).

No escaping/quoting is needed.

Unless the [`shell`](#shell) option is used, no shell interpreter (Bash, `cmd.exe`, etc.) is used, so shell features such as variables substitution (`echo $PATH`) are not allowed.

### $\`command\`

Same as [`execa()`](#execafile-arguments-options) (including its [return value](#childprocess)) except both file and arguments are specified in a single tagged template string. For example, `` $`echo unicorns` `` is the same as `execa('echo', ['unicorns'])`.

It's important to note that quotes, backslashes, and spaces are automatically escaped and have no special meaning unless the [`shell` option](#shell) is used. This escaping behavior also applies to interpolated expressions such as strings (`` $`echo ${'string'}` ``), arrays of strings (`` $`echo ${['array', 'of strings']}` ``), and so on.

The [`shell` option](#shell) must be used if the `command` uses shell-specific features (for example, `&&` or `||`), as opposed to being a simple `file` followed by its `arguments`.

As a convenience, the result from previous [`` $`command` ``](#command) or [`` $.sync`command` ``](#synccommand) calls can be used as template expressions in subsequent commands and `$`/`$.sync` will use the `stdout` value. See the example above [with results from `$` or `$.sync`](#with-results-from--or-sync) for more details.

For more information, please see [this page](docs/scripts.md).

### $(options)

Binds options to the [`$`](#command) API. For example, you can use `$(options)` to create a new `$` instance with specific default options, which are then bound to both the asynchronous [`` $`command` ``](#command) and synchronous [`` $.sync`command` ``](#synccommand) APIs.

> **Note:** Consecutive calls to this API will shallow merge the options.

### execaCommand(command, options?)

Same as [`execa()`](#execafile-arguments-options) (including its [return value](#childprocess)) except both file and arguments are specified in a single `command` string. For example, `execa('echo', ['unicorns'])` is the same as `execaCommand('echo unicorns')`.

If the file or an argument contains spaces, they must be escaped with backslashes. This matters especially if `command` is not a constant but a variable, for example with `__dirname` or `process.cwd()`. Except for spaces, no escaping/quoting is needed.

The [`shell` option](#shell) must be used if the `command` uses shell-specific features (for example, `&&` or `||`), as opposed to being a simple `file` followed by its `arguments`.

### execaNode(scriptPath, arguments?, options?)

Execute a Node.js script as a child process.

Same as `execa('node', [scriptPath, ...arguments], options)` except (like [`child_process#fork()`](https://nodejs.org/api/child_process.html#child_process_child_process_fork_modulepath_args_options)):
  - the current Node version and options are used. This can be overridden using the [`nodePath`](#nodepath-for-node-only) and [`nodeOptions`](#nodeoptions-for-node-only) options.
  - the [`shell`](#shell) option cannot be used
  - an extra channel [`ipc`](https://nodejs.org/api/child_process.html#child_process_options_stdio) is passed to [`stdio`](#stdio)

### childProcess

This is both:
  - a `Promise` resolving or rejecting with a [`childProcessResult`](#childProcessResult).
  - a [`child_process` instance](https://nodejs.org/api/child_process.html#child_process_class_childprocess) with the following additional methods and properties.

#### kill(signal?, options?)

Same as the original [`child_process#kill()`](https://nodejs.org/api/child_process.html#child_process_subprocess_kill_signal) except: if `signal` is `SIGTERM` (the default value) and the child process is not terminated after 5 seconds, force it by sending `SIGKILL`.

##### options.forceKillAfterTimeout

Type: `number | false`\
Default: `5000`

Milliseconds to wait for the child process to terminate before sending `SIGKILL`.

Can be disabled with `false`.

#### all

Type: `ReadableStream | undefined`

Stream combining/interleaving [`stdout`](https://nodejs.org/api/child_process.html#child_process_subprocess_stdout) and [`stderr`](https://nodejs.org/api/child_process.html#child_process_subprocess_stderr).

This is `undefined` if either:
  - the [`all` option](#all-2) is `false` (the default value)
  - both [`stdout`](#stdout-1) and [`stderr`](#stderr-1) options are set to [`'inherit'`, `'ipc'`, `Stream` or `integer`](https://nodejs.org/dist/latest-v6.x/docs/api/child_process.html#child_process_options_stdio)

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

### execaSync(file, arguments?, options?)

Same as [`execa()`](#execacommandcommand-options) but synchronous.

Returns or throws a [`childProcessResult`](#childProcessResult).

### $.sync\`command\`

Same as [$\`command\`](#command) but synchronous.

Returns or throws a [`childProcessResult`](#childProcessResult).

### execaCommandSync(command, options?)

Same as [`execaCommand()`](#execacommand-command-options) but synchronous.

Returns or throws a [`childProcessResult`](#childProcessResult).

### childProcessResult

Type: `object`

Result of a child process execution. On success this is a plain object. On failure this is also an `Error` instance.

The child process [fails](#failed) when:
- its [exit code](#exitcode) is not `0`
- it was [killed](#killed) with a [signal](#signal)
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

Type: `string | Buffer`

The output of the process on stdout.

#### stderr

Type: `string | Buffer`

The output of the process on stderr.

#### all

Type: `string | Buffer | undefined`

The output of the process with `stdout` and `stderr` interleaved.

This is `undefined` if either:
  - the [`all` option](#all-2) is `false` (the default value)
  - `execaSync()` was used

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

#### killed

Type: `boolean`

Whether the process was killed.

#### signal

Type: `string | undefined`

The name of the signal that was used to terminate the process. For example, `SIGFPE`.

If a signal terminated the process, this property is defined and included in the error message. Otherwise it is `undefined`.

#### signalDescription

Type: `string | undefined`

A human-friendly description of the signal that was used to terminate the process. For example, `Floating point arithmetic error`.

If a signal terminated the process, this property is defined and included in the error message. Otherwise it is `undefined`. It is also `undefined` when the signal is very uncommon which should seldomly happen.

#### message

Type: `string`

Error message when the child process failed to run. In addition to the [underlying error message](#originalMessage), it also contains some information related to why the child process errored.

The child process [stderr](#stderr) then [stdout](#stdout) are appended to the end, separated with newlines and not interleaved.

#### shortMessage

Type: `string`

This is the same as the [`message` property](#message) except it does not include the child process stdout/stderr.

#### originalMessage

Type: `string | undefined`

Original error message. This is the same as the `message` property except it includes neither the child process stdout/stderr nor some additional information added by Execa.

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
Default: `true` with [`$`](#command)/[`$.sync`](#synccommand), `false` otherwise

Prefer locally installed binaries when looking for a binary to execute.\
If you `$ npm install foo`, you can then `execa('foo')`.

#### localDir

Type: `string | URL`\
Default: `process.cwd()`

Preferred path to find locally installed binaries in (use with `preferLocal`).

#### execPath

Type: `string`\
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

Type: `string | Buffer | stream.Readable`

Write some input to the `stdin` of your binary.\
Streams are not allowed when using the synchronous methods.

#### stdin

Type: `string | number | Stream | undefined`\
Default: `pipe`

Same options as [`stdio`](https://nodejs.org/dist/latest-v6.x/docs/api/child_process.html#child_process_options_stdio).

#### stdout

Type: `string | number | Stream | undefined`\
Default: `pipe`

Same options as [`stdio`](https://nodejs.org/dist/latest-v6.x/docs/api/child_process.html#child_process_options_stdio).

#### stderr

Type: `string | number | Stream | undefined`\
Default: `pipe`

Same options as [`stdio`](https://nodejs.org/dist/latest-v6.x/docs/api/child_process.html#child_process_options_stdio).

#### all

Type: `boolean`\
Default: `false`

Add an `.all` property on the [promise](#all) and the [resolved value](#all-1). The property contains the output of the process with `stdout` and `stderr` interleaved.

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

#### stdio

Type: `string | string[]`\
Default: `pipe`

Child's [stdio](https://nodejs.org/api/child_process.html#child_process_options_stdio) configuration.

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

Type: `boolean | string`\
Default: `false`

If `true`, runs `file` inside of a shell. Uses `/bin/sh` on UNIX and `cmd.exe` on Windows. A different shell can be specified as a string. The shell should understand the `-c` switch on UNIX or `/d /s /c` on Windows.

We recommend against using this option since it is:
- not cross-platform, encouraging shell-specific syntax.
- slower, because of the additional shell interpretation.
- unsafe, potentially allowing command injection.

#### encoding

Type: `string | null`\
Default: `utf8`

Specify the character encoding used to decode the `stdout` and `stderr` output. If set to `null`, then `stdout` and `stderr` will be a `Buffer` instead of a string.

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

When `AbortController.abort()` is called, [`.isCanceled`](#iscanceled) becomes `false`.

*Requires Node.js 16 or later.*

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

Type: `string`\
Default: [`process.execPath`](https://nodejs.org/api/process.html#process_process_execpath)

Node.js executable used to create the child process.

#### nodeOptions *(For `.node()` only)*

Type: `string[]`\
Default: [`process.execArgv`](https://nodejs.org/api/process.html#process_process_execargv)

List of [CLI options](https://nodejs.org/api/cli.html#cli_options) passed to the Node.js executable.

## Tips

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

### Execute the current package's binary

```js
import {getBinPathSync} from 'get-bin-path';

const binPath = getBinPathSync();
const subprocess = execa(binPath);
```

`execa` can be combined with [`get-bin-path`](https://github.com/ehmicky/get-bin-path) to test the current package's binary. As opposed to hard-coding the path to the binary, this validates that the `package.json` `bin` field is correctly set up.

## Related

- [gulp-execa](https://github.com/ehmicky/gulp-execa) - Gulp plugin for `execa`
- [nvexeca](https://github.com/ehmicky/nvexeca) - Run `execa` using any Node.js version
- [sudo-prompt](https://github.com/jorangreef/sudo-prompt) - Run commands with elevated privileges.

## Maintainers

- [Sindre Sorhus](https://github.com/sindresorhus)
- [@ehmicky](https://github.com/ehmicky)

---

<div align="center">
	<b>
		<a href="https://tidelift.com/subscription/pkg/npm-execa?utm_source=npm-execa&utm_medium=referral&utm_campaign=readme">Get professional support for this package with a Tidelift subscription</a>
	</b>
	<br>
	<sub>
		Tidelift helps make open source sustainable for maintainers while giving companies<br>assurances about security, maintenance, and licensing for their dependencies.
	</sub>
</div>
