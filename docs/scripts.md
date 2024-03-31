# Node.js scripts

With Execa, you can write scripts with Node.js instead of a shell language. [Compared to Bash and zx](#differences-with-bash-and-zx), this is more:
  - [performant](#performance)
  - [cross-platform](#shell): [no shell](../readme.md#shell-syntax) is used, only JavaScript.
  - [secure](#escaping): no shell injection.
  - [simple](#simplicity): minimalistic API, no [globals](#global-variables), no [binary](#main-binary), no [builtin CLI utilities](#builtin-utilities).
  - [featureful](#simplicity): all Execa features are available ([subprocess piping](#piping-stdout-to-another-command), [IPC](#ipc), [transforms](#transforms), [background subprocesses](#background-subprocesses), [cancellation](#cancellation), [local binaries](#local-binaries), [cleanup on exit](../readme.md#cleanup), [interleaved output](#interleaved-output), [forceful termination](../readme.md#forcekillafterdelay), etc.).
  - [easy to debug](#debugging): [verbose mode](#verbose-mode), [detailed errors](#errors), [messages and stack traces](#cancellation), stateless API.

```js
import {$} from 'execa';

const {stdout: name} = await $`cat package.json`
  .pipe`grep name`;
console.log(name);

const branch = await $`git branch --show-current`;
await $`dep deploy --branch=${branch}`;

await Promise.all([
  $`sleep 1`,
  $`sleep 2`,
  $`sleep 3`,
]);

const dirName = 'foo bar';
await $`mkdir /tmp/${dirName}`;
```

## Template string syntax

The examples below use the [template string syntax](../readme.md#template-string-syntax). However, the other syntax using [an array of arguments](../readme.md#execafile-arguments-options) is also available as `$(file, arguments?, options?)`.

Also, the template string syntax can be used outside of script files: `$` is not required to use that syntax. For example, `execa` can use it too.

The only difference between `$` and `execa` is that the former includes [script-friendly default options](../readme.md#file-arguments-options).

```js
import {execa, $} from 'execa';

const branch = await execa`git branch --show-current`;
await $('dep', ['deploy', `--branch=${branch}`]);
```

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
await $`echo example`;
```

```js
// Execa
import {$} from 'execa';

await $`echo example`;
```

### Command execution

```sh
# Bash
echo example
```

```js
// zx
await $`echo example`;
```

```js
// Execa
await $`echo example`;
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
	--example-flag-two`
```

### Concatenation

```sh
# Bash
tmpDir="/tmp"
mkdir "$tmpDir/filename"
```

```js
// zx
const tmpDir = '/tmp'
await $`mkdir ${tmpDir}/filename`;
```

```js
// Execa
const tmpDir = '/tmp'
await $`mkdir ${tmpDir}/filename`;
```

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

### Subcommands

```sh
# Bash
echo "$(echo example)"
```

```js
// zx
const example = await $`echo example`;
await $`echo ${example}`;
```

```js
// Execa
const example = await $`echo example`;
await $`echo ${example}`;
```

### Serial commands

```sh
# Bash
echo one && echo two
```

```js
// zx
await $`echo one && echo two`;
```

```js
// Execa
await $`echo one`;
await $`echo two`;
```

### Parallel commands

```sh
# Bash
echo one &
echo two &
```

```js
// zx
await Promise.all([$`echo one`, $`echo two`]);
```

```js
// Execa
await Promise.all([$`echo one`, $`echo two`]);
```

### Global/shared options

```sh
# Bash
options="timeout 5"
$options echo one
$options echo two
$options echo three
```

```js
// zx
const timeout = '5s';
await $`echo one`.timeout(timeout);
await $`echo two`.timeout(timeout);
await $`echo three`.timeout(timeout);
```

```js
// Execa
import {$ as $_} from 'execa';

const $ = $_({timeout: 5000});

await $`echo one`;
await $`echo two`;
await $`echo three`;
```

### Environment variables

```sh
# Bash
EXAMPLE=1 example_command
```

```js
// zx
$.env.EXAMPLE = '1';
await $`example_command`;
delete $.env.EXAMPLE;
```

```js
// Execa
await $({env: {EXAMPLE: '1'}})`example_command`;
```

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
echo example 2> /dev/null
```

```js
// zx
await $`echo example`.stdio('inherit', 'pipe', 'ignore');
```

```js
// Execa does not print stdout/stderr by default
await $`echo example`;
```

### Verbose mode

```sh
# Bash
set -v
echo example
```

```js
// zx >=8
await $`echo example`.verbose();

// or:
$.verbose = true;
```

```js
// Execa
import {$ as $_} from 'execa';

// `verbose: 'short'` is also available
const $ = $_({verbose: 'full'});

await $`echo example`;
```

Or:

```
NODE_DEBUG=execa node file.js
```

Which prints:

```
[19:49:00.360] [0] $ echo example
example
[19:49:00.383] [0] √ (done in 23ms)
```

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

### Piping stdout and stderr to another command

```sh
# Bash
echo example |& cat
```

```js
// zx
const echo = $`echo example`;
const cat = $`cat`;
echo.pipe(cat)
echo.stderr.pipe(cat.stdin);
await Promise.all([echo, cat]);
```

```js
// Execa
await $({all: true})`echo example`
	.pipe({from: 'all'})`cat`;
```

### Piping stdout to a file

```sh
# Bash
echo example > file.txt
```

```js
// zx
await $`echo example`.pipe(fs.createWriteStream('file.txt'));
```

```js
// Execa
await $({stdout: {file: 'file.txt'}})`echo example`;
```

### Piping stdin from a file

```sh
# Bash
echo example < file.txt
```

```js
// zx
const cat = $`cat`
fs.createReadStream('file.txt').pipe(cat.stdin)
await cat
```

```js
// Execa
await $({inputFile: 'file.txt'})`cat`
```

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

### Exit codes

```sh
# Bash
false
echo $?
```

```js
// zx
const {exitCode} = await $`false`.nothrow();
echo`${exitCode}`;
```

```js
// Execa
const {exitCode} = await $({reject: false})`false`;
console.log(exitCode);
```

### Timeouts

```sh
# Bash
timeout 5 echo example
```

```js
// zx
await $`echo example`.timeout('5s');
```

```js
// Execa
await $({timeout: 5000})`echo example`;
```

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
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const __filename = path.basename(fileURLToPath(import.meta.url));

await $`echo ${__filename}`;
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

### Background subprocesses

```sh
# Bash
echo one &
```

```js
// zx does not allow setting the `detached` option
```

```js
// Execa
await $({detached: true})`echo one`;
```

### IPC

```sh
# Bash does not allow simple IPC
```

```js
// zx does not allow simple IPC
```

```js
// Execa
const subprocess = $({ipc: true})`node script.js`;

subprocess.on('message', message => {
	if (message === 'ping') {
		subprocess.send('pong');
	}
});
```

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

### Cancellation

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

### PID

```sh
# Bash
echo example &
echo $!
```

```js
// zx does not return `subprocess.pid`
```

```js
// Execa
const {pid} = $`echo example`;
```

## Differences with Bash and zx

This section describes the differences between Bash, Execa, and [zx](https://github.com/google/zx) (which inspired this feature).

### Flexibility

Unlike shell languages like Bash, libraries like Execa and zx enable you to write scripts with a more featureful programming language (JavaScript). This allows complex logic (such as [parallel execution](#parallel-commands)) to be expressed easily. This also lets you use [any Node.js package](#builtin-utilities).

### Shell

The main difference between Execa and zx is that Execa does not require any shell. Shell-specific keywords and features are [written in JavaScript](#variable-substitution) instead.

This is more cross-platform. For example, your code works the same on Windows machines without Bash installed.

Also, there is no shell syntax to remember: everything is just plain JavaScript.

If you really need a shell though, the [`shell` option](../readme.md#shell) can be used.

### Simplicity

Execa's scripting API mostly consists of only two methods: [`` $`command` ``](../readme.md#file-arguments-options) and [`$(options)`](../readme.md#execaoptions).

[No special binary](#main-binary) is recommended, no [global variable](#global-variables) is injected: scripts are regular Node.js files.

Execa is a thin wrapper around the core Node.js [`child_process` module](https://nodejs.org/api/child_process.html). Unlike zx, it lets you use [any of its native features](#background-subprocesses): [`pid`](#pid), [IPC](https://nodejs.org/api/child_process.html#subprocesssendmessage-sendhandle-options-callback), [`unref()`](https://nodejs.org/api/child_process.html#subprocessunref), [`detached`](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options), [`uid`](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options), [`gid`](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options), [`cancelSignal`](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options), etc.

### Modularity

zx includes many builtin utilities: `fetch()`, `question()`, `sleep()`, `stdin()`, `retry()`, `spinner()`, `chalk`, `fs-extra`, `os`, `path`, `globby`, `yaml`, `minimist`, `which`, Markdown scripts, remote scripts.

Execa does not include [any utility](#builtin-utilities): it focuses on being small and modular instead. Any Node.js package can be used in your scripts.

### Performance

Spawning a shell for every command comes at a performance cost, which Execa avoids.

Also, [local binaries](#local-binaries) can be directly executed without using `npx`.

### Debugging

Subprocesses can be hard to debug, which is why Execa includes a [`verbose` option](#verbose-mode).

Also, Execa's error messages and [properties](#errors) are very detailed to make it clear to determine why a subprocess failed. Error messages and stack traces can be set with [`subprocess.kill(error)`](../readme.md#killerror).

Finally, unlike Bash and zx, which are stateful (options, current directory, etc.), Execa is [purely functional](#current-directory), which also helps with debugging.
