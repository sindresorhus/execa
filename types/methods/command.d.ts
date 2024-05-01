import type {Options, SyncOptions} from '../arguments/options';
import type {ExecaSyncResult} from '../return/result';
import type {ExecaResultPromise} from '../subprocess/subprocess';
import type {SimpleTemplateString} from './template';

type ExecaCommand<OptionsType extends Options> = {
	<NewOptionsType extends Options = {}>(options: NewOptionsType): ExecaCommand<OptionsType & NewOptionsType>;

	(...templateString: SimpleTemplateString): ExecaResultPromise<OptionsType>;

	<NewOptionsType extends Options = {}>(
		command: string,
		options?: NewOptionsType,
	): ExecaResultPromise<OptionsType & NewOptionsType>;
};

/**
Executes a command. `command` is a string that includes both the `file` and its `arguments`.

This is only intended for very specific cases, such as a REPL. This should be avoided otherwise.

Just like `execa()`, this can bind options. It can also be run synchronously using `execaCommandSync()`.

@param command - The program/script to execute and its arguments.
@returns An `ExecaResultPromise` that is both:
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

	(...templateString: SimpleTemplateString): ExecaSyncResult<OptionsType>;

	<NewOptionsType extends SyncOptions = {}>(
		command: string,
		options?: NewOptionsType,
	): ExecaSyncResult<OptionsType & NewOptionsType>;
};

/**
Same as `execaCommand()` but synchronous.

Returns or throws a subprocess `result`. The `subprocess` is not returned: its methods and properties are not available.

@param command - The program/script to execute and its arguments.
@returns `ExecaSyncResult`
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
