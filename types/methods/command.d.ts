import type {Options, SyncOptions} from '../arguments/options.js';
import type {SyncResult} from '../return/result.js';
import type {ResultPromise} from '../subprocess/subprocess.js';
import type {SimpleTemplateString} from './template.js';

type ExecaCommand<OptionsType extends Options> = {
	<NewOptionsType extends Options = {}>(options: NewOptionsType): ExecaCommand<OptionsType & NewOptionsType>;

	(...templateString: SimpleTemplateString): ResultPromise<OptionsType>;

	<NewOptionsType extends Options = {}>(
		command: string,
		options?: NewOptionsType,
	): ResultPromise<OptionsType & NewOptionsType>;
};

/**
Executes a command. `command` is a string that includes both the `file` and its `arguments`.

When `command` is a template string, it includes both the `file` and its `arguments`.

`execaCommand(options)` can be used to return a new instance of this method but with different default `options`. Consecutive calls are merged to previous ones.

This is only intended for very specific cases, such as a REPL. This should be avoided otherwise.

@param command - The program/script to execute and its arguments.
@returns A `ResultPromise` that is both:
- the subprocess.
- a `Promise` either resolving with its successful `result`, or rejecting with its `error`.
@throws `ExecaError`

@example
```
import {execaCommand} from 'execa';

for await (const commandAndArguments of getReplLine()) {
	await execaCommand(commandAndArguments);
}
```
*/
export declare const execaCommand: ExecaCommand<{}>;

type ExecaCommandSync<OptionsType extends SyncOptions> = {
	<NewOptionsType extends SyncOptions = {}>(options: NewOptionsType): ExecaCommandSync<OptionsType & NewOptionsType>;

	(...templateString: SimpleTemplateString): SyncResult<OptionsType>;

	<NewOptionsType extends SyncOptions = {}>(
		command: string,
		options?: NewOptionsType,
	): SyncResult<OptionsType & NewOptionsType>;
};

/**
Same as `execaCommand()` but synchronous.

When `command` is a template string, it includes both the `file` and its `arguments`.

`execaCommandSync(options)` can be used to return a new instance of this method but with different default `options`. Consecutive calls are merged to previous ones.

Returns a subprocess `result` or throws an `error`. The `subprocess` is not returned: its methods and properties are not available.

@param command - The program/script to execute and its arguments.
@returns `SyncResult`
@throws `ExecaSyncError`

@example
```
import {execaCommandSync} from 'execa';

for (const commandAndArguments of getReplLine()) {
	execaCommandSync(commandAndArguments);
}
```
*/
export declare const execaCommandSync: ExecaCommandSync<{}>;

/**
Split a `command` string into an array. For example, `'npm run build'` returns `['npm', 'run', 'build']` and `'argument otherArgument'` returns `['argument', 'otherArgument']`.

@param command - The file to execute and/or its arguments.
@returns fileOrArgument[]

@example
```
import {execa, parseCommandString} from 'execa';

const commandString = 'npm run task';
const commandArray = parseCommandString(commandString);
await execa`${commandArray}`;

const [file, ...commandArguments] = commandArray;
await execa(file, commandArguments);
```
*/
export function parseCommandString(command: string): string[];
