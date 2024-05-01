import type {Options} from '../arguments/options';
import type {ExecaResultPromise} from '../subprocess/subprocess';
import type {TemplateString} from './template';

type ExecaNode<OptionsType extends Options> = {
	<NewOptionsType extends Options = {}>(options: NewOptionsType): ExecaNode<OptionsType & NewOptionsType>;

	(...templateString: TemplateString): ExecaResultPromise<OptionsType>;

	<NewOptionsType extends Options = {}>(
		scriptPath: string | URL,
		arguments?: readonly string[],
		options?: NewOptionsType,
	): ExecaResultPromise<OptionsType & NewOptionsType>;

	<NewOptionsType extends Options = {}>(
		scriptPath: string | URL,
		options?: NewOptionsType,
	): ExecaResultPromise<OptionsType & NewOptionsType>;
};

/**
Same as `execa()` but using the `node: true` option.
Executes a Node.js file using `node scriptPath ...arguments`.

Just like `execa()`, this can use the template string syntax or bind options.

This is the preferred method when executing Node.js files.

@param scriptPath - Node.js script to execute, as a string or file URL
@param arguments - Arguments to pass to `scriptPath` on execution.
@returns An `ExecaResultPromise` that is both:
- the subprocess.
- a `Promise` either resolving with its successful `result`, or rejecting with its `error`.
@throws `ExecaError`

@example
```
import {execaNode, execa} from 'execa';

await execaNode`file.js argument`;
// Is the same as:
await execa({node: true})`file.js argument`;
// Or:
await execa`node file.js argument`;
```
*/
export declare const execaNode: ExecaNode<{}>;
