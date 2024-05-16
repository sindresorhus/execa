<picture>
	<source media="(prefers-color-scheme: dark)" srcset="../media/logo_dark.svg">
	<img alt="execa logo" src="../media/logo.svg" width="400">
</picture>
<br>

# 🔍 Differences with Bash and zx

This page describes the differences between [Bash](https://en.wikipedia.org/wiki/Bash_(Unix_shell)), Execa, and [zx](https://github.com/google/zx) (which inspired this feature). Execa intends to be more:
- [Performant](#performance)
- [Cross-platform](#shell): [no shell](shell.md) is used, only JavaScript.
- [Secure](#escaping): no shell injection.
- [Simple](#simplicity): minimalistic API, no [globals](#global-variables), no [binary](#main-binary), no [builtin CLI utilities](#builtin-utilities).
- [Featureful](#simplicity): all Execa features are available ([text lines iteration](#iterate-over-output-lines), [subprocess piping](#piping-stdout-to-another-command), [IPC](#ipc), [transforms](#transforms), [background subprocesses](#background-subprocess), [cancelation](#cancelation), [local binaries](#local-binaries), [cleanup on exit](termination.md#current-process-exit), [interleaved output](#interleaved-output), [forceful termination](termination.md#forceful-termination), and [more](../readme.md#documentation)).
- [Easy to debug](#debugging): [verbose mode](#verbose-mode), [detailed errors](#errors), [messages and stack traces](#cancelation), stateless API.

## Flexibility

Unlike shell languages like Bash, libraries like Execa and zx enable you to write scripts with a more featureful programming language (JavaScript). This allows complex logic (such as [parallel execution](#parallel-commands)) to be expressed easily. This also lets you use [any Node.js package](#builtin-utilities).

## Shell

The main difference between Execa and zx is that Execa does not require any shell. Shell-specific keywords and features are [written in JavaScript](#variable-substitution) instead.

This is more cross-platform. For example, your code works the same on Windows machines without Bash installed.

Also, there is no shell syntax to remember: everything is just plain JavaScript.

If you really need a shell though, the [`shell`](shell.md) option can be used.

## Simplicity

Execa's scripting API mostly consists of only two methods: [`` $`command` ``](shell.md) and [`$(options)`](execution.md#globalshared-options).

[No special binary](#main-binary) is recommended, no [global variable](#global-variables) is injected: scripts are regular Node.js files.

Execa is a thin wrapper around the core Node.js [`child_process` module](https://nodejs.org/api/child_process.html). Unlike zx, it lets you use [any of its native features](#background-subprocess): [`pid`](#pid), [IPC](ipc.md), [`unref()`](https://nodejs.org/api/child_process.html#subprocessunref), [`detached`](environment.md#background-subprocess), [`uid`](windows.md#uid-and-gid), [`gid`](windows.md#uid-and-gid), [`cancelSignal`](termination.md#canceling), etc.

## Modularity

zx includes many builtin utilities: `fetch()`, `question()`, `sleep()`, `stdin()`, `retry()`, `spinner()`, `chalk`, `fs-extra`, `os`, `path`, `globby`, `yaml`, `minimist`, `which`, Markdown scripts, remote scripts.

Execa does not include [any utility](#builtin-utilities): it focuses on being small and modular instead. Any Node.js package can be used in your scripts.

## Performance

Spawning a shell for every command comes at a performance cost, which Execa avoids.

Also, [local binaries](#local-binaries) can be directly executed without using `npx`.

## Debugging

Subprocesses can be hard to debug, which is why Execa includes a [`verbose`](#verbose-mode) option.

Also, Execa's error messages and [properties](#errors) are very detailed to make it clear to determine why a subprocess failed. Error messages and stack traces can be set with [`subprocess.kill(error)`](termination.md#error-message-and-stack-trace).

Finally, unlike Bash and zx, which are stateful (options, current directory, etc.), Execa is [purely functional](#current-directory), which also helps with debugging.

## Examples

### Main binary

```sh
# Bash
bash file.sh
```

```js
// zx
zx file.js

// or a shebang can be used:
//   #!/usr/bin/env zx
```

```js
// Execa scripts are just regular Node.js files
node file.js
```

### Global variables

```js
// zx
await $`npm run build`;
```

```js
// Execa
import {$} from 'execa';

await $`npm run build`;
```

[More info.](execution.md)

### Command execution

```sh
# Bash
npm run build
```

```js
// zx
await $`npm run build`;
```

```js
// Execa
await $`npm run build`;
```

### Multiline commands

```sh
# Bash
npm run build \
	--example-flag-one \
	--example-flag-two
```

```js
// zx
await $`npm run build ${[
	'--example-flag-one',
	'--example-flag-two',
]}`;
```

```js
// Execa
await $`npm run build
	--example-flag-one
	--example-flag-two`;
```

[More info.](execution.md#multiple-lines)

### Concatenation

```sh
# Bash
tmpDirectory="/tmp"
mkdir "$tmpDirectory/filename"
```

```js
// zx
const tmpDirectory = '/tmp'
await $`mkdir ${tmpDirectory}/filename`;
```

```js
// Execa
const tmpDirectory = '/tmp'
await $`mkdir ${tmpDirectory}/filename`;
```

[More info.](execution.md#concatenation)

### Variable substitution

```sh
# Bash
echo $LANG
```

```js
// zx
await $`echo $LANG`;
```

```js
// Execa
await $`echo ${process.env.LANG}`;
```

[More info.](input.md#environment-variables)

### Escaping

```sh
# Bash
echo 'one two'
```

```js
// zx
await $`echo ${'one two'}`;
```

```js
// Execa
await $`echo ${'one two'}`;
```

[More info.](escaping.md)

### Escaping multiple arguments

```sh
# Bash
echo 'one two' '$'
```

```js
// zx
await $`echo ${['one two', '$']}`;
```

```js
// Execa
await $`echo ${['one two', '$']}`;
```

[More info.](execution.md#multiple-arguments)

### Subcommands

```sh
# Bash
echo "$(npm run build)"
```

```js
// zx
const result = await $`npm run build`;
await $`echo ${result}`;
```

```js
// Execa
const result = await $`npm run build`;
await $`echo ${result}`;
```

[More info.](execution.md#subcommands)

### Serial commands

```sh
# Bash
npm run build && npm run test
```

```js
// zx
await $`npm run build && npm run test`;
```

```js
// Execa
await $`npm run build`;
await $`npm run test`;
```

### Parallel commands

```sh
# Bash
npm run build &
npm run test &
```

```js
// zx
await Promise.all([$`npm run build`, $`npm run test`]);
```

```js
// Execa
await Promise.all([$`npm run build`, $`npm run test`]);
```

### Global/shared options

```sh
# Bash
options="timeout 5"
$options npm run init
$options npm run build
$options npm run test
```

```js
// zx
const timeout = '5s';
await $`npm run init`.timeout(timeout);
await $`npm run build`.timeout(timeout);
await $`npm run test`.timeout(timeout);
```

```js
// Execa
import {$ as $_} from 'execa';

const $ = $_({timeout: 5000});

await $`npm run init`;
await $`npm run build`;
await $`npm run test`;
```

[More info.](execution.md#globalshared-options)

### Environment variables

```sh
# Bash
EXAMPLE=1 npm run build
```

```js
// zx
$.env.EXAMPLE = '1';
await $`npm run build`;
delete $.env.EXAMPLE;
```

```js
// Execa
await $({env: {EXAMPLE: '1'}})`npm run build`;
```

[More info.](input.md#environment-variables)

### Local binaries

```sh
# Bash
npx tsc --version
```

```js
// zx
await $`npx tsc --version`;
```

```js
// Execa
await $`tsc --version`;
```

[More info.](environment.md#local-binaries)

### Builtin utilities

```js
// zx
const content = await stdin();
```

```js
// Execa
import getStdin from 'get-stdin';

const content = await getStdin();
```

### Printing to stdout

```sh
# Bash
echo example
```

```js
// zx
echo`example`;
```

```js
// Execa
console.log('example');
```

### Silent stderr

```sh
# Bash
npm run build 2> /dev/null
```

```js
// zx
await $`npm run build`.stdio('inherit', 'pipe', 'ignore');
```

```js
// Execa does not print stdout/stderr by default
await $`npm run build`;
```

### Verbose mode

```sh
# Bash
set -v
npm run build
```

```js
// zx >=8
await $`npm run build`.verbose();

// or:
$.verbose = true;
```

```js
// Execa
await $({verbose: 'full'})`npm run build`;
```

Or:

```
NODE_DEBUG=execa node file.js
```

Which prints:

```
[19:49:00.360] [0] $ npm run build
Building...
Done.
[19:49:00.383] [0] √ (done in 23ms)
```

[More info.](debugging.md#verbose-mode)

### Piping stdout to another command

```sh
# Bash
echo npm run build | sort | head -n2
```

```js
// zx
await $`npm run build | sort | head -n2`;
```

```js
// Execa
await $`npm run build`
	.pipe`sort`
	.pipe`head -n2`;
```

[More info.](pipe.md)

### Piping stdout and stderr to another command

```sh
# Bash
npm run build |& cat
```

```js
// zx
const subprocess = $`npm run build`;
const cat = $`cat`;
subprocess.pipe(cat);
subprocess.stderr.pipe(cat.stdin);
await Promise.all([subprocess, cat]);
```

```js
// Execa
await $({all: true})`npm run build`
	.pipe({from: 'all'})`cat`;
```

[More info.](pipe.md#source-file-descriptor)

### Piping stdout to a file

```sh
# Bash
npm run build > output.txt
```

```js
// zx
import {createWriteStream} from 'node:fs';

await $`npm run build`.pipe(createWriteStream('output.txt'));
```

```js
// Execa
await $({stdout: {file: 'output.txt'}})`npm run build`;
```

[More info.](output.md#file-output)

### Piping interleaved stdout and stderr to a file

```sh
# Bash
npm run build &> output.txt
```

```js
// zx
import {createWriteStream} from 'node:fs';

const subprocess = $`npm run build`;
const fileStream = createWriteStream('output.txt');
subprocess.pipe(fileStream);
subprocess.stderr.pipe(fileStream);
await subprocess;
```

```js
// Execa
const output = {file: 'output.txt'};
await $({stdout: output, stderr: output})`npm run build`;
```

[More info.](output.md#file-output)

### Piping stdin from a file

```sh
# Bash
cat < input.txt
```

```js
// zx
const cat = $`cat`;
fs.createReadStream('input.txt').pipe(cat.stdin);
await cat;
```

```js
// Execa
await $({inputFile: 'input.txt'})`cat`;
```

[More info.](input.md#file-input)

### Iterate over output lines

```sh
# Bash
while read
do
	if [[ "$REPLY" == *ERROR* ]]
	then
		echo "$REPLY"
	fi
done < <(npm run build)
```

```js
// zx does not allow proper iteration.
// For example, the iteration does not handle subprocess errors.
```

```js
// Execa
for await (const line of $`npm run build`) {
	if (line.includes('ERROR')) {
		console.log(line);
	}
}
```

[More info.](lines.md#progressive-splitting)

### Errors

```sh
# Bash communicates errors only through the exit code and stderr
timeout 1 sleep 2
echo $?
```

```js
// zx
const {
	stdout,
	stderr,
	exitCode,
	signal,
} = await $`sleep 2`.timeout('1s');
// file:///home/me/Desktop/node_modules/zx/build/core.js:146
//             let output = new ProcessOutput(code, signal, stdout, stderr, combined, message);
//                          ^
// ProcessOutput [Error]:
//     at file:///home/me/Desktop/example.js:2:20
//     exit code: null
//     signal: SIGTERM
//     at ChildProcess.<anonymous> (file:///home/me/Desktop/node_modules/zx/build/core.js:146:26)
//     at ChildProcess.emit (node:events:512:28)
//     at maybeClose (node:internal/child_process:1098:16)
//     at Socket.<anonymous> (node:internal/child_process:456:11)
//     at Socket.emit (node:events:512:28)
//     at Pipe.<anonymous> (node:net:316:12)
//     at Pipe.callbackTrampoline (node:internal/async_hooks:130:17) {
//   _code: null,
//   _signal: 'SIGTERM',
//   _stdout: '',
//   _stderr: '',
//   _combined: ''
// }
```

```js
// Execa
const {
	stdout,
	stderr,
	exitCode,
	signal,
	signalDescription,
	originalMessage,
	shortMessage,
	command,
	escapedCommand,
	failed,
	timedOut,
	isCanceled,
	isTerminated,
	isMaxBuffer,
	// and other error-related properties: code, etc.
} = await $({timeout: 1})`sleep 2`;
// ExecaError: Command timed out after 1 milliseconds: sleep 2
//     at file:///home/me/Desktop/example.js:2:20
//     at ... {
//   shortMessage: 'Command timed out after 1 milliseconds: sleep 2\nTimed out',
//   originalMessage: '',
//   command: 'sleep 2',
//   escapedCommand: 'sleep 2',
//   cwd: '/path/to/cwd',
//   durationMs: 19.95693,
//   failed: true,
//   timedOut: true,
//   isCanceled: false,
//   isTerminated: true,
//   isMaxBuffer: false,
//   signal: 'SIGTERM',
//   signalDescription: 'Termination',
//   stdout: '',
//   stderr: '',
//   stdio: [undefined, '', ''],
//   pipedFrom: []
// }
```

[More info.](errors.md)

### Exit codes

```sh
# Bash
npm run build
echo $?
```

```js
// zx
const {exitCode} = await $`npm run build`.nothrow();
echo`${exitCode}`;
```

```js
// Execa
const {exitCode} = await $({reject: false})`npm run build`;
console.log(exitCode);
```

[More info.](errors.md#exit-code)

### Timeouts

```sh
# Bash
timeout 5 npm run build
```

```js
// zx
await $`npm run build`.timeout('5s');
```

```js
// Execa
await $({timeout: 5000})`npm run build`;
```

[More info.](termination.md#timeout)

### Current filename

```sh
# Bash
echo "$(basename "$0")"
```

```js
// zx
await $`echo ${__filename}`;
```

```js
// Execa
await $`echo ${import.meta.filename}`;
```

### Current directory

```sh
# Bash
cd project
```

```js
// zx
cd('project');

// or:
$.cwd = 'project';
```

```js
// Execa
const $$ = $({cwd: 'project'});
```

[More info.](environment.md#current-directory)

### Multiple current directories

```sh
# Bash
pushd project
pwd
popd
pwd
```

```js
// zx
within(async () => {
	cd('project');
	await $`pwd`;
});

await $`pwd`;
```

```js
// Execa
await $({cwd: 'project'})`pwd`;
await $`pwd`;
```

[More info.](environment.md#current-directory)

### Background subprocess

```sh
# Bash
npm run build &
```

```js
// zx does not allow setting the `detached` option
```

```js
// Execa
await $({detached: true})`npm run build`;
```

[More info.](environment.md#background-subprocess)

### IPC

```sh
# Bash does not allow simple IPC
```

```js
// zx does not allow simple IPC
```

```js
// Execa
const subprocess = $({node: true})`script.js`;

for await (const message of subprocess.getEachMessage()) {
	if (message === 'ping') {
		await subprocess.sendMessage('pong');
	}
});
```

[More info.](ipc.md)

### Transforms

```sh
# Bash does not allow transforms
```

```js
// zx does not allow transforms
```

```js
// Execa
const transform = function * (line) {
	if (!line.includes('secret')) {
		yield line;
	}
};

await $({stdout: [transform, 'inherit']})`echo ${'This is a secret.'}`;
```

[More info.](transform.md)

### Cancelation

```sh
# Bash
kill $PID
```

```js
// zx
subprocess.kill();
```

```js
// Execa
// Can specify an error message and stack trace
subprocess.kill(error);

// Or use an `AbortSignal`
const controller = new AbortController();
await $({signal: controller.signal})`node long-script.js`;
```

[More info.](termination.md#canceling)

### Interleaved output

```sh
# Bash prints stdout and stderr interleaved
```

```js
// zx separates stdout and stderr
const {stdout, stderr} = await $`node example.js`;
```

```js
// Execa can interleave stdout and stderr
const {all} = await $({all: true})`node example.js`;
```

[More info.](output.md#interleaved-output)

### PID

```sh
# Bash
npm run build &
echo $!
```

```js
// zx does not return `subprocess.pid`
```

```js
// Execa
const {pid} = $`npm run build`;
```

[More info.](termination.md#inter-process-termination)

<hr>

[**Next**: 🤓 TypeScript](typescript.md)\
[**Previous**: 📎 Windows](windows.md)\
[**Top**: Table of contents](../readme.md#documentation)
