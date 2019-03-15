# execa [![Build Status](https://travis-ci.org/sindresorhus/execa.svg?branch=master)](https://travis-ci.org/sindresorhus/execa) [![Coverage Status](https://coveralls.io/repos/github/sindresorhus/execa/badge.svg?branch=master)](https://coveralls.io/github/sindresorhus/execa?branch=master)

> A better [`child_process`](https://nodejs.org/api/child_process.html)


## Why

- Promise interface.
- [Strips the final newline](#stripfinalnewline) from the output so you don't have to do `stdout.trim()`.
- Supports [shebang](https://en.wikipedia.org/wiki/Shebang_(Unix)) binaries cross-platform.
- [Improved Windows support.](https://github.com/IndigoUnited/node-cross-spawn#why)
- Higher max buffer. 10 MB instead of 200 KB.
- [Executes locally installed binaries by name.](#preferlocal)
- [Cleans up spawned processes when the parent process dies.](#cleanup)
- [Adds an `.all` property](#execafile-arguments-options) with interleaved output from `stdout` and `stderr`, similar to what the terminal sees. [*(Async only)*](#execasyncfile-arguments-options)


## Install

```
$ npm install execa
```

<a href="https://www.patreon.com/sindresorhus">
	<img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>


## Usage

```js
const execa = require('execa');

(async () => {
	const {stdout} = await execa('echo', ['unicorns']);
	console.log(stdout);
	//=> 'unicorns'
})();
```

Additional examples:

```js
const execa = require('execa');

(async () => {
	// Pipe the child process stdout to the current stdout
	execa('echo', ['unicorns']).stdout.pipe(process.stdout);


	// Run a shell command
	const {stdout} = await execa.shell('echo unicorns');
	//=> 'unicorns'

	// Cancelling a spawned process
	const spawned = execa("node");
	spawned.cancel();
	try {
		await spawned;
	} catch (error) {
		console.log(spawned.killed); // true
		console.log(error.canceled); // true
	}

	// Catching an error
	try {
		await execa.shell('exit 3');
	} catch (error) {
		console.log(error);
		/*
		{
			message: 'Command failed with exit code 3 (ESRCH): exit 3',
			code: 3,
			exitCode: 3,
			exitCodeName: 'ESRCH',
			stdout: '',
			stderr: '',
			all: '',
			failed: true,
			signal: null,
			cmd: 'exit 3',
			timedOut: false,
			killed: false
		}
		*/
	}
})();

// Catching an error with a sync method
try {
	execa.shellSync('exit 3');
} catch (error) {
	console.log(error);
	/*
	{
		message: 'Command failed with exit code 3 (ESRCH): exit 3',
		code: 3,
		exitCode: 3,
		exitCodeName: 'ESRCH',
		stdout: '',
		stderr: '',
		failed: true,
		signal: null,
		cmd: 'exit 3',
		timedOut: false
	}
	*/
}
```


## API

### execa(file, [arguments], [options])

Execute a file.

Think of this as a mix of `child_process.execFile` and `child_process.spawn`.

Returns a [`child_process` instance](https://nodejs.org/api/child_process.html#child_process_class_childprocess) which is enhanced to be a `Promise`.

It exposes an additional `.all` stream, with `stdout` and `stderr` interleaved.

The promise result is an `Object` with `stdout`, `stderr` and `all` properties.

### execa.stdout(file, [arguments], [options])

Same as `execa()`, but returns only `stdout`.

### execa.stderr(file, [arguments], [options])

Same as `execa()`, but returns only `stderr`.

### execa.shell(command, [options])

Execute a command through the system shell. Prefer `execa()` whenever possible, as it's both faster and safer.

Returns a [`child_process` instance](https://nodejs.org/api/child_process.html#child_process_class_childprocess).

The `child_process` instance is enhanced to also be promise for a result object with `stdout` and `stderr` properties.

### execa.sync(file, [arguments], [options])

Execute a file synchronously.

Returns the same result object as [`child_process.spawnSync`](https://nodejs.org/api/child_process.html#child_process_child_process_spawnsync_command_args_options).

It does not have the `.all` property that `execa()` has because the [underlying synchronous implementation](https://nodejs.org/api/child_process.html#child_process_child_process_execfilesync_file_args_options) only returns `stdout` and `stderr` at the end of the execution, so they cannot be interleaved.

This method throws an `Error` if the command fails.

### execa.shellSync(file, [options])

Execute a command synchronously through the system shell.

Returns the same result object as [`child_process.spawnSync`](https://nodejs.org/api/child_process.html#child_process_child_process_spawnsync_command_args_options).

### spawned.cancel()

Cancel a process spawned using execa. Calling this method kills it.

Throws an error with `error.canceled` equal to `true`, provided that the process gets canceled.
Process would not get canceled if it has already exited or has been killed by `spawned.kill()`.

### options

Type: `Object`

#### cwd

Type: `string`<br>
Default: `process.cwd()`

Current working directory of the child process.

#### env

Type: `Object`<br>
Default: `process.env`

Environment key-value pairs. Extends automatically from `process.env`. Set `extendEnv` to `false` if you don't want this.

#### extendEnv

Type: `boolean`<br>
Default: `true`

Set to `false` if you don't want to extend the environment variables when providing the `env` property.

#### argv0

Type: `string`

Explicitly set the value of `argv[0]` sent to the child process. This will be set to `command` or `file` if not specified.

#### stdio

Type: `string[]` `string`<br>
Default: `pipe`

Child's [stdio](https://nodejs.org/api/child_process.html#child_process_options_stdio) configuration.

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

Type: `boolean` `string`<br>
Default: `false`

If `true`, runs `command` inside of a shell. Uses `/bin/sh` on UNIX and `cmd.exe` on Windows. A different shell can be specified as a string. The shell should understand the `-c` switch on UNIX or `/d /s /c` on Windows.

#### stripFinalNewline

Type: `boolean`<br>
Default: `true`

Strip the final [newline character](https://en.wikipedia.org/wiki/Newline) from the output.

#### preferLocal

Type: `boolean`<br>
Default: `true`

Prefer locally installed binaries when looking for a binary to execute.<br>
If you `$ npm install foo`, you can then `execa('foo')`.

#### localDir

Type: `string`<br>
Default: `process.cwd()`

Preferred path to find locally installed binaries in (use with `preferLocal`).

#### input

Type: `string` `Buffer` `stream.Readable`

Write some input to the `stdin` of your binary.<br>
Streams are not allowed when using the synchronous methods.

#### reject

Type: `boolean`<br>
Default: `true`

Setting this to `false` resolves the promise with the error instead of rejecting it.

#### cleanup

Type: `boolean`<br>
Default: `true`

Keep track of the spawned process and `kill` it when the parent process exits.

#### encoding

Type: `string` `null`<br>
Default: `utf8`

Specify the character encoding used to decode the `stdout` and `stderr` output. If set to `null`, then `stdout` and `stderr` will be a `Buffer` instead of a string.

#### timeout

Type: `number`<br>
Default: `0`

If timeout is greater than `0`, the parent will send the signal identified by the `killSignal` property (the default is `SIGTERM`) if the child runs longer than timeout milliseconds.

#### buffer

Type: `boolean`<br>
Default: `true`

Buffer the output from the spawned process. When buffering is disabled you must consume the output of the `stdout` and `stderr` streams because the promise will not be resolved/rejected until they have completed.

#### maxBuffer

Type: `number`<br>
Default: `10000000` (10MB)

Largest amount of data in bytes allowed on `stdout` or `stderr`.

#### killSignal

Type: `string` `number`<br>
Default: `SIGTERM`

Signal value to be used when the spawned process will be killed.

#### stdin

Type: `string` `number` `Stream` `undefined` `null`<br>
Default: `pipe`

Same options as [`stdio`](https://nodejs.org/dist/latest-v6.x/docs/api/child_process.html#child_process_options_stdio).

#### stdout

Type: `string` `number` `Stream` `undefined` `null`<br>
Default: `pipe`

Same options as [`stdio`](https://nodejs.org/dist/latest-v6.x/docs/api/child_process.html#child_process_options_stdio).

#### stderr

Type: `string` `number` `Stream` `undefined` `null`<br>
Default: `pipe`

Same options as [`stdio`](https://nodejs.org/dist/latest-v6.x/docs/api/child_process.html#child_process_options_stdio).

#### windowsVerbatimArguments

Type: `boolean`<br>
Default: `false`

If `true`, no quoting or escaping of arguments is done on Windows. Ignored on other platforms. This is set to `true` automatically when the `shell` option is `true`.


## Tips

### Save and pipe output from a child process

Let's say you want to show the output of a child process in real-time while also saving it to a variable.

```js
const execa = require('execa');
const getStream = require('get-stream');

const stream = execa('echo', ['foo']).stdout;

stream.pipe(process.stdout);

getStream(stream).then(value => {
	console.log('child output:', value);
});
```


## Maintainers

- [Sindre Sorhus](https://github.com/sindresorhus)
- [@ehmicky](https://github.com/ehmicky)
