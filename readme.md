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
- 📔 [API reference](docs/api.md)

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

## Related

- [gulp-execa](https://github.com/ehmicky/gulp-execa) - Gulp plugin for Execa
- [nvexeca](https://github.com/ehmicky/nvexeca) - Run Execa using any Node.js version

## Maintainers

- [Sindre Sorhus](https://github.com/sindresorhus)
- [@ehmicky](https://github.com/ehmicky)
