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

This is only intended for very specific cases, such as a REPL. This should be avoided otherwise.

Just like `execa()`, this can bind options. It can also be run synchronously using `execaCommandSync()`.

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

Returns or throws a subprocess `result`. The `subprocess` is not returned: its methods and properties are not available.

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
