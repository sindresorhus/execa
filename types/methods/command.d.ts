import type {Options, SyncOptions} from '../arguments/options';
import type {ExecaSyncResult} from '../return/result';
import type {ExecaSubprocess} from '../subprocess/subprocess';
import type {SimpleTemplateString} from './template';

type ExecaCommand<OptionsType extends Options> = {
	<NewOptionsType extends Options = {}>(options: NewOptionsType): ExecaCommand<OptionsType & NewOptionsType>;

	(...templateString: SimpleTemplateString): ExecaSubprocess<OptionsType>;

	<NewOptionsType extends Options = {}>(
		command: string,
		options?: NewOptionsType,
	): ExecaSubprocess<OptionsType & NewOptionsType>;
};

/**
Executes a command. `command` is a string that includes both the `file` and its `arguments`.

This is only intended for very specific cases, such as a REPL. This should be avoided otherwise.

Just like `execa()`, this can bind options. It can also be run synchronously using `execaCommandSync()`.

@param command - The program/script to execute and its arguments.
@returns An `ExecaSubprocess` that is both:
- a `Promise` resolving or rejecting with a subprocess `result`.
- a [`child_process` instance](https://nodejs.org/api/child_process.html#child_process_class_childprocess) with some additional methods and properties.
@throws A subprocess `result` error

@example
```
import {execaCommand} from 'execa';

const {stdout} = await execaCommand('echo unicorns');
console.log(stdout);
//=> 'unicorns'
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
@returns A subprocess `result` object
@throws A subprocess `result` error

@example
```
import {execaCommandSync} from 'execa';

const {stdout} = execaCommandSync('echo unicorns');
console.log(stdout);
//=> 'unicorns'
```
*/
export declare const execaCommandSync: ExecaCommandSync<{}>;
