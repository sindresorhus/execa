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
`execa` with the template string syntax allows the `file` or the `arguments` to be user-defined (by injecting them with `${}`). However, if _both_ the `file` and the `arguments` are user-defined, _and_ those are supplied as a single string, then `execaCommand(command)` must be used instead.

This is only intended for very specific cases, such as a REPL. This should be avoided otherwise.

Just like `execa()`, this can bind options. It can also be run synchronously using `execaCommandSync()`.

Arguments are automatically escaped. They can contain any character, but spaces must be escaped with a backslash like `execaCommand('echo has\\ space')`.

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

The following features cannot be used:
- Streams: `subprocess.stdin`, `subprocess.stdout`, `subprocess.stderr`, `subprocess.readable()`, `subprocess.writable()`, `subprocess.duplex()`.
- The `stdin`, `stdout`, `stderr` and `stdio` options cannot be `'overlapped'`, an async iterable, an async transform, a `Duplex`, nor a web stream. Node.js streams can be passed but only if either they [have a file descriptor](#redirect-a-nodejs-stream-fromto-stdinstdoutstderr), or the `input` option is used.
- Signal termination: `subprocess.kill()`, `subprocess.pid`, `cleanup` option, `cancelSignal` option, `forceKillAfterDelay` option.
- Piping multiple processes: `subprocess.pipe()`.
- `subprocess.iterable()`.
- `ipc` and `serialization` options.
- `result.all` is not interleaved.
- `detached` option.
- The `maxBuffer` option is always measured in bytes, not in characters, lines nor objects. Also, it ignores transforms and the `encoding` option.

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
