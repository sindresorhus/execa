import type {Options} from '../arguments/options.js';
import type {ResultPromise} from '../subprocess/subprocess.js';
import type {TemplateString} from './template.js';

type Execa<OptionsType extends Options> = {
	<NewOptionsType extends Options = {}>(options: NewOptionsType): Execa<OptionsType & NewOptionsType>;

	(...templateString: TemplateString): ResultPromise<OptionsType>;

	<NewOptionsType extends Options = {}>(
		file: string | URL,
		arguments?: readonly string[],
		options?: NewOptionsType,
	): ResultPromise<OptionsType & NewOptionsType>;

	<NewOptionsType extends Options = {}>(
		file: string | URL,
		options?: NewOptionsType,
	): ResultPromise<OptionsType & NewOptionsType>;
};

/**
Executes a command using `file ...arguments`.

When `command` is a template string, it includes both the `file` and its `arguments`.

`execa(options)` can be used to return a new instance of Execa but with different default `options`. Consecutive calls are merged to previous ones.

@param file - The program/script to execute, as a string or file URL
@param arguments - Arguments to pass to `file` on execution.
@returns A `ResultPromise` that is both:
- the subprocess.
- a `Promise` either resolving with its successful `result`, or rejecting with its `error`.
@throws `ExecaError`

@example <caption>Simple syntax</caption>

```
import {execa} from 'execa';

const {stdout} = await execa`npm run build`;
// Print command's output
console.log(stdout);
```

@example <caption>Script</caption>

```
import {$} from 'execa';

const {stdout: name} = await $`cat package.json`.pipe`grep name`;
console.log(name);

const branch = await $`git branch --show-current`;
await $`dep deploy --branch=${branch}`;

await Promise.all([
	$`sleep 1`,
	$`sleep 2`,
	$`sleep 3`,
]);

const directoryName = 'foo bar';
await $`mkdir /tmp/${directoryName}`;
```

@example <caption>Local binaries</caption>

```
$ npm install -D eslint
```

```
await execa({preferLocal: true})`eslint`;
```

@example <caption>Pipe multiple subprocesses</caption>

```
const {stdout, pipedFrom} = await execa`npm run build`
	.pipe`sort`
	.pipe`head -n 2`;

// Output of `npm run build | sort | head -n 2`
console.log(stdout);
// Output of `npm run build | sort`
console.log(pipedFrom[0].stdout);
// Output of `npm run build`
console.log(pipedFrom[0].pipedFrom[0].stdout);
```

@example <caption>Interleaved output</caption>

```
const {all} = await execa({all: true})`npm run build`;
// stdout + stderr, interleaved
console.log(all);
```

@example <caption>Programmatic + terminal output</caption>

```
const {stdout} = await execa({stdout: ['pipe', 'inherit']})`npm run build`;
// stdout is also printed to the terminal
console.log(stdout);
```

@example <caption>Files</caption>

```
// Similar to: npm run build > output.txt
await execa({stdout: {file: './output.txt'}})`npm run build`;
```

@example <caption>Simple input</caption>

```
const {stdout} = await execa({input: getInputString()})`sort`;
console.log(stdout);
```

@example <caption>Split into text lines</caption>

```
const {stdout} = await execa({lines: true})`npm run build`;
// Print first 10 lines
console.log(stdout.slice(0, 10).join('\n'));
```

@example <caption>Iterate over text lines</caption>

```
for await (const line of execa`npm run build`) {
	if (line.includes('WARN')) {
		console.warn(line);
	}
}
```

@example <caption>Transform/filter output</caption>

```
let count = 0;

// Filter out secret lines, then prepend the line number
const transform = function * (line) {
	if (!line.includes('secret')) {
		yield `[${count++}] ${line}`;
	}
};

await execa({stdout: transform})`npm run build`;
```

@example <caption>Web streams</caption>

```
const response = await fetch('https://example.com');
await execa({stdin: response.body})`sort`;
```

@example <caption>Convert to Duplex stream</caption>

```
import {execa} from 'execa';
import {pipeline} from 'node:stream/promises';
import {createReadStream, createWriteStream} from 'node:fs';

await pipeline(
	createReadStream('./input.txt'),
	execa`node ./transform.js`.duplex(),
	createWriteStream('./output.txt'),
);
```

@example <caption>Detailed error</caption>

```
import {execa, ExecaError} from 'execa';

try {
	await execa`unknown command`;
} catch (error) {
	if (error instanceof ExecaError) {
		console.log(error);
	}
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
	*\/
}
```

@example <caption>Verbose mode</caption>

```
await execa`npm run build`;
await execa`npm run test`;
```

```
$ NODE_DEBUG=execa node build.js
[00:57:44.581] [0] $ npm run build
[00:57:44.653] [0]   Building application...
[00:57:44.653] [0]   Done building.
[00:57:44.658] [0] ✔ (done in 78ms)
[00:57:44.658] [1] $ npm run test
[00:57:44.740] [1]   Running tests...
[00:57:44.740] [1]   Error: the entrypoint is invalid.
[00:57:44.747] [1] ✘ Command failed with exit code 1: npm run test
[00:57:44.747] [1] ✘ (done in 89ms)
```
*/
export declare const execa: Execa<{}>;
