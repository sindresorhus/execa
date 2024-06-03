<picture>
	<source media="(prefers-color-scheme: dark)" srcset="../media/logo_dark.svg">
	<img alt="execa logo" src="../media/logo.svg" width="400">
</picture>
<br>

# 🔍 Differences with Bash and zx

This page describes the differences between [Bash](https://en.wikipedia.org/wiki/Bash_(Unix_shell)), Execa, and [zx](https://github.com/google/zx). Execa intends to be more:
- [Simple](#simplicity): minimalistic API, no [globals](#global-variables), no [binary](#main-binary), no builtin CLI utilities.
- [Cross-platform](#shell): [no shell](shell.md) is used, only JavaScript.
- [Secure](#escaping): no shell injection.
- [Featureful](#simplicity): all Execa features are available ([text lines iteration](#iterate-over-output-lines), [advanced piping](#piping-stdout-to-another-command), [simple IPC](#ipc), [passing any input type](#pass-any-input-type), [returning any output type](#return-any-output-type), [transforms](#transforms), [web streams](#web-streams), [convert to Duplex stream](#convert-to-duplex-stream), [cleanup on exit](termination.md#current-process-exit), [graceful termination](#graceful-termination), [forceful termination](termination.md#forceful-termination), and [more](../readme.md#documentation)).
- [Easy to debug](#debugging): [verbose mode](#verbose-mode-single-command), [detailed errors](#detailed-errors), [messages and stack traces](#cancelation), stateless API.
- [Performant](#performance)

## Flexibility

Unlike shell languages like Bash, libraries like Execa and zx enable you to write scripts with a more featureful programming language (JavaScript). This allows complex logic (such as [parallel execution](#parallel-commands)) to be expressed easily. This also lets you use any Node.js package.

## Shell

The main difference between Execa and zx is that Execa does not require any shell. Shell-specific keywords and features are [written in JavaScript](#variable-substitution) instead.

This is more cross-platform. For example, your code works the same on Windows machines without Bash installed.

Also, there is no shell syntax to remember: everything is just plain JavaScript.

If you really need a shell though, the [`shell`](shell.md) option can be used.

## Simplicity

Execa's scripting API mostly consists of only two methods: [`` $`command` ``](shell.md) and [`$(options)`](execution.md#globalshared-options).

[No special binary](#main-binary) is recommended, no [global variable](#global-variables) is injected: scripts are regular Node.js files.

Execa is a thin wrapper around the core Node.js [`child_process` module](https://nodejs.org/api/child_process.html). It lets you use any of its native features.

## Modularity

zx includes many builtin utilities: [`fetch()`](#http-requests), [`question()`](#cli-prompts), [`sleep()`](#sleep), [`echo()`](#printing-to-stdout), [`stdin()`](#retrieve-stdin), [`retry()`](#retry-on-error), [`spinner()`](#cli-spinner), [`globby`](#globbing), [`chalk`](https://github.com/chalk/chalk), [`fs`](https://github.com/jprichardson/node-fs-extra), [`os`](https://nodejs.org/api/os.html), [`path`](https://nodejs.org/api/path.html), [`yaml`](https://github.com/eemeli/yaml), [`which`](https://github.com/npm/node-which), [`ps`](https://github.com/webpod/ps), [`tmpfile()`](#temporary-file), [`argv`](#cli-arguments), Markdown scripts, remote scripts.

Execa does not include any utility: it focuses on being small and modular instead. [Any Node.js package](https://github.com/sindresorhus/awesome-nodejs#command-line-utilities) can be used in your scripts.

## Performance

Spawning a shell for every command comes at a performance cost, which Execa avoids.

## Debugging

Subprocesses can be hard to debug, which is why Execa includes a [`verbose`](#verbose-mode-single-command) option. It includes [more information](debugging.md#full-mode) than zx: timestamps, command completion and duration, interleaved commands, IPC messages.

Also, Execa's error messages and [properties](#detailed-errors) are very detailed to make it clear to determine why a subprocess failed. Error messages and stack traces can be set with [`subprocess.kill(error)`](termination.md#error-message-and-stack-trace).

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

[More info.](execution.md)

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
const $$ = $({verbose: true});

await $$`npm run init`;
await $$`npm run build`;
await $$`npm run test`;
```

```js
// Execa
import {$ as $_} from 'execa';

const $ = $_({verbose: true});

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
await $({env: {EXAMPLE: '1'}})`npm run build`;
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
await $({preferLocal: true})`tsc --version`;
```

```js
// Execa
await $({preferLocal: true})`tsc --version`;
```

[More info.](environment.md#local-binaries)

### Retrieve stdin

```sh
# Bash
read content
```

```js
// zx
const content = await stdin();
```

```js
// Execa
import getStdin from 'get-stdin';

const content = await getStdin();
```

[More info.](https://github.com/sindresorhus/get-stdin)

### Pass input to stdin

```sh
# Bash
cat <<<"example"
```

```js
// zx
$({input: 'example'})`cat`;
```

```js
// Execa
$({input: 'example'})`cat`;
```

### Pass any input type

```sh
# Bash only allows passing strings as input
```

```js
// zx only allows passing specific input types
```

```js
// Execa - main.js
const ipcInput = [
	{task: 'lint', ignore: /test\.js/},
	{task: 'copy', files: new Set(['main.js', 'index.js']),
}];
await $({ipcInput})`node build.js`;
```

```js
// Execa - build.js
import {getOneMessage} from 'execa';

const ipcInput = await getOneMessage();
```

[More info.](ipc.md#send-an-initial-message)

### Return any output type

```sh
# Bash only allows returning strings as output
```

```js
// zx only allows returning specific output types
```

```js
// Execa - main.js
const {ipcOutput} = await $({ipc: true})`node build.js`;
console.log(ipcOutput[0]); // {kind: 'start', timestamp: date}
console.log(ipcOutput[1]); // {kind: 'stop', timestamp: date}
```

```js
// Execa - build.js
import {sendMessage} from 'execa';

await sendMessage({kind: 'start', timestamp: new Date()});
await runBuild();
await sendMessage({kind: 'stop', timestamp: new Date()});
```

[More info.](ipc.md#retrieve-all-messages)

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

### Silent stdout

```sh
# Bash
npm run build > /dev/null
```

```js
// zx
await $`npm run build`.quiet();
```

```js
// Execa does not print stdout by default
await $`npm run build`;
```

### Binary output

```sh
# Bash usually requires redirecting binary output
zip -r - input.txt > output.txt
```

```js
// zx
const stdout = await $`zip -r - input.txt`.buffer();
```

```js
// Execa
const {stdout} = await $({encoding: 'buffer'})`zip -r - input.txt`;
```

[More info.](binary.md#binary-output)

### Verbose mode (single command)

```sh
# Bash
set -v
npm run build
set +v
```

```js
// zx
await $`npm run build`.verbose();
```

```js
// Execa
await $({verbose: 'full'})`npm run build`;
```

[More info.](debugging.md#verbose-mode)

### Verbose mode (global)

```sh
# Bash
set -v
npm run build
```

```
// zx
$ zx --verbose file.js
$ npm run build
Building...
Done.
```

```
$ NODE_DEBUG=execa node file.js
[19:49:00.360] [0] $ npm run build
[19:49:00.360] [0]   Building...
[19:49:00.360] [0]   Done.
[19:49:00.383] [0] √ (done in 23ms)
```

[More info.](debugging.md#global-mode)

### Piping stdout to another command

```sh
# Bash
echo npm run build | sort | head -n2
```

```js
// zx
await $`npm run build`
	.pipe($`sort`)
	.pipe($`head -n2`);
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

### Web streams

```js
// zx does not support web streams
```

```js
// Execa
const response = await fetch('https://example.com');
await $({stdin: response.body})`npm run build`;
```

[More info.](streams.md#web-streams)

### Convert to Duplex stream

```js
// zx does not support converting subprocesses to streams
```

```js
// Execa
import {pipeline} from 'node:stream/promises';
import {createReadStream, createWriteStream} from 'node:fs';

await pipeline(
	createReadStream('./input.txt'),
	$`node ./transform.js`.duplex(),
	createWriteStream('./output.txt'),
);
```

[More info.](streams.md#convert)

### Handle pipeline errors

```sh
# Bash
set -e
npm run crash | sort | head -n2
```

```js
// zx
try {
	await $`npm run crash`
		.pipe($`sort`)
		.pipe($`head -n2`);
// This is never reached.
// The process crashes instead.
} catch (error) {
	console.error(error);
}
```

```js
// Execa
try {
	await $`npm run build`
		.pipe`sort`
		.pipe`head -n2`;
} catch (error) {
	console.error(error);
}
```

[More info.](pipe.md#errors)

### Return all pipeline results

```sh
# Bash only allows returning each command's exit code
npm run crash | sort | head -n2
# 1 0 0
echo "${PIPESTATUS[@]}"
```

```js
// zx only returns the last command's result
```

```js
// Execa
const destinationResult = await execa`npm run build`
	.pipe`head -n 2`;
console.log(destinationResult.stdout); // First 2 lines of `npm run build`

const sourceResult = destinationResult.pipedFrom[0];
console.log(sourceResult.stdout); // Full output of `npm run build`
```

[More info.](pipe.md#result)

### Split output into lines

```sh
# Bash
npm run build | IFS='\n' read -ra lines
```

```js
// zx
const lines = await $`npm run build`.lines();
```

```js
// Execa
const lines = await $({lines: true})`npm run build`;
```

[More info.](lines.md#simple-splitting)

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
// zx does not allow easily iterating over output lines.
// Also, the iteration does not handle subprocess errors.
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

### Detailed errors

```sh
# Bash communicates errors only through the exit code and stderr
timeout 1 sleep 2
echo $?
```

```js
// zx
await $`sleep 2`.timeout('1ms');
// Error:
//   at file:///home/me/Desktop/example.js:6:12
//   exit code: null
//   signal: SIGTERM
```

```js
// Execa
await $({timeout: 1})`sleep 2`;
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
```

```js
// Execa
const {exitCode} = await $({reject: false})`npm run build`;
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
const $$ = $({cwd: 'project'});

// Or:
cd('project');
```

```js
// Execa
const $$ = $({cwd: 'project'});
```

[More info.](environment.md#current-directory)

### Background subprocess

```sh
# Bash
npm run build &
```

```js
// zx
await $({detached: true})`npm run build`;
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

### Signal termination

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
subprocess.kill();

// Or with an error message and stack trace:
subprocess.kill(error);
```

[More info.](termination.md#signal-termination)

### Default signal

```sh
# Bash does not allow changing the default termination signal
```

```js
// zx only allows changing the signal used for timeouts
const $$ = $({timeoutSignal: 'SIGINT'});
```

```js
// Execa
const $ = $_({killSignal: 'SIGINT'});
```

[More info.](termination.md#default-signal)

### Cancelation

```sh
# Bash
kill $PID
```

```js
// zx
const controller = new AbortController();
await $({signal: controller.signal})`node long-script.js`;
```

```js
// Execa
const controller = new AbortController();
await $({cancelSignal: controller.signal})`node long-script.js`;
```

[More info.](termination.md#canceling)

### Graceful termination

```sh
# Bash
trap cleanup SIGTERM
```

```js
// zx
// This does not work on Windows
process.on('SIGTERM', () => {
	// ...
});
```

```js
// Execa - main.js
const controller = new AbortController();
await $({
	cancelSignal: controller.signal,
	gracefulCancel: true,
})`node build.js`;
```

```js
// Execa - build.js
import {getCancelSignal} from 'execa';

const cancelSignal = await getCancelSignal();
await fetch('https://example.com', {signal: cancelSignal});
```

### Interleaved output

```sh
# Bash prints stdout and stderr interleaved
```

```js
// zx
const all = String(await $`node example.js`);
```

```js
// Execa
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

### CLI arguments

```js
// zx
const {myCliFlag} = argv;
```

```js
// Execa
import {parseArgs} from 'node:util';

const {myCliFlag} = parseArgs({strict: false}).values;
```

[More info.](https://nodejs.org/api/util.html#utilparseargsconfig)

### CLI prompts

```sh
# Bash
read -p "Question? " answer
```

```js
// zx
const answer = await question('Question? ');
```

```js
// Execa
import input from '@inquirer/input';

const answer = await input({message: 'Question?'});
```

[More info.](https://github.com/SBoudrias/Inquirer.js)

### CLI spinner

```sh
# Bash does not provide with a builtin spinner
```

```js
// zx
await spinner(() => $`node script.js`);
```

```js
// Execa
import {oraPromise} from 'ora';

await oraPromise($`node script.js`);
```

[More info.](https://github.com/sindresorhus/ora)

### Sleep

```sh
# Bash
sleep 5
```

```js
// zx
await sleep(5000);
```

```js
// Execa
import {setTimeout} from 'node:timers/promises';

await setTimeout(5000);
```

[More info.](https://nodejs.org/api/timers.html#timerspromisessettimeoutdelay-value-options)

### Globbing

```sh
# Bash
ls packages/*
```

```js
// zx
const files = await glob(['packages/*']);
```

```js
// Execa
import {glob} from 'node:fs/promises';

const files = await Array.fromAsync(glob('packages/*'));
```

[More info.](https://nodejs.org/api/fs.html#fspromisesglobpattern-options)

### Temporary file

```js
// zx
const filePath = tmpfile();
```

```js
// Execa
import tempfile from 'tempfile';

const filePath = tempfile();
```

[More info.](https://github.com/sindresorhus/tempfile)

### HTTP requests

```sh
# Bash
curl https://github.com
```

```js
// zx
await fetch('https://github.com');
```

```js
// Execa
await fetch('https://github.com');
```

[More info.](https://nodejs.org/api/globals.html#fetch)

### Retry on error

```js
// zx
await retry(
	5,
	() => $`curl -sSL https://sindresorhus.com/unicorn`,
)
```

```js
// Execa
import pRetry from 'p-retry';

await pRetry(
	() => $`curl -sSL https://sindresorhus.com/unicorn`,
	{retries: 5},
);
```

[More info.](https://github.com/sindresorhus/p-retry)

<hr>

[**Next**: 🤓 TypeScript](typescript.md)\
[**Previous**: 📎 Windows](windows.md)\
[**Top**: Table of contents](../readme.md#documentation)
