import type {Options} from '../arguments/options';
import type {ExecaSubprocess} from '../subprocess/subprocess';
import type {TemplateString} from './template';

type Execa<OptionsType extends Options> = {
	<NewOptionsType extends Options = {}>(options: NewOptionsType): Execa<OptionsType & NewOptionsType>;

	(...templateString: TemplateString): ExecaSubprocess<OptionsType>;

	<NewOptionsType extends Options = {}>(
		file: string | URL,
		arguments?: readonly string[],
		options?: NewOptionsType,
	): ExecaSubprocess<OptionsType & NewOptionsType>;

	<NewOptionsType extends Options = {}>(
		file: string | URL,
		options?: NewOptionsType,
	): ExecaSubprocess<OptionsType & NewOptionsType>;
};

/**
Executes a command using `file ...arguments`.

Arguments are automatically escaped. They can contain any character, including spaces, tabs and newlines.

When `command` is a template string, it includes both the `file` and its `arguments`.

The `command` template string can inject any `${value}` with the following types: string, number, `subprocess` or an array of those types. For example: `` execa`echo one ${'two'} ${3} ${['four', 'five']}` ``. For `${subprocess}`, the subprocess's `stdout` is used.

When `command` is a template string, arguments can contain any character, but spaces, tabs and newlines must use `${}` like `` execa`echo ${'has space'}` ``.

The `command` template string can use multiple lines and indentation.

`execa(options)` can be used to return a new instance of Execa but with different default `options`. Consecutive calls are merged to previous ones. This allows setting global options or sharing options between multiple commands.

@param file - The program/script to execute, as a string or file URL
@param arguments - Arguments to pass to `file` on execution.
@returns An `ExecaSubprocess` that is both:
- a `Promise` resolving or rejecting with a subprocess `result`.
- a [`child_process` instance](https://nodejs.org/api/child_process.html#child_process_class_childprocess) with some additional methods and properties.
@throws A subprocess `result` error

@example <caption>Promise interface</caption>
```
import {execa} from 'execa';

const {stdout} = await execa('echo', ['unicorns']);
console.log(stdout);
//=> 'unicorns'
```

@example <caption>Global/shared options</caption>
```
import {execa as execa_} from 'execa';

const execa = execa_({verbose: 'full'});

await execa('echo', ['unicorns']);
//=> 'unicorns'
```

@example <caption>Template string interface</caption>

```
import {execa} from 'execa';

const arg = 'unicorns';
const {stdout} = await execa`echo ${arg} & rainbows!`;
console.log(stdout);
//=> 'unicorns & rainbows!'
```

@example <caption>Template string multiple arguments</caption>

```
import {execa} from 'execa';

const args = ['unicorns', '&', 'rainbows!'];
const {stdout} = await execa`echo ${args}`;
console.log(stdout);
//=> 'unicorns & rainbows!'
```

@example <caption>Template string with options</caption>

```
import {execa} from 'execa';

await execa({verbose: 'full'})`echo unicorns`;
//=> 'unicorns'
```

@example <caption>Redirect output to a file</caption>
```
import {execa} from 'execa';

// Similar to `echo unicorns > stdout.txt` in Bash
await execa('echo', ['unicorns'], {stdout: {file: 'stdout.txt'}});

// Similar to `echo unicorns 2> stdout.txt` in Bash
await execa('echo', ['unicorns'], {stderr: {file: 'stderr.txt'}});

// Similar to `echo unicorns &> stdout.txt` in Bash
await execa('echo', ['unicorns'], {stdout: {file: 'all.txt'}, stderr: {file: 'all.txt'}});
```

@example <caption>Redirect input from a file</caption>
```
import {execa} from 'execa';

// Similar to `cat < stdin.txt` in Bash
const {stdout} = await execa('cat', {inputFile: 'stdin.txt'});
console.log(stdout);
//=> 'unicorns'
```

@example <caption>Save and pipe output from a subprocess</caption>
```
import {execa} from 'execa';

const {stdout} = await execa('echo', ['unicorns'], {stdout: ['pipe', 'inherit']});
// Prints `unicorns`
console.log(stdout);
// Also returns 'unicorns'
```

@example <caption>Pipe multiple subprocesses</caption>
```
import {execa} from 'execa';

// Similar to `echo unicorns | cat` in Bash
const {stdout} = await execa('echo', ['unicorns']).pipe(execa('cat'));
console.log(stdout);
//=> 'unicorns'
```

@example <caption>Pipe with template strings</caption>
```
import {execa} from 'execa';

await execa`npm run build`
	.pipe`sort`
	.pipe`head -n2`;
```

@example <caption>Iterate over output lines</caption>
```
import {execa} from 'execa';

for await (const line of execa`npm run build`)) {
	if (line.includes('ERROR')) {
		console.log(line);
	}
}
```

@example <caption>Handling errors</caption>
```
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
	\*\/
}
```
*/
export declare const execa: Execa<{}>;
