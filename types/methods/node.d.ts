import type {Options} from '../arguments/options';
import type {ExecaSubprocess} from '../subprocess/subprocess';
import type {TemplateString} from './template';

type ExecaNode<OptionsType extends Options> = {
	<NewOptionsType extends Options = {}>(options: NewOptionsType): ExecaNode<OptionsType & NewOptionsType>;

	(...templateString: TemplateString): ExecaSubprocess<OptionsType>;

	<NewOptionsType extends Options = {}>(
		scriptPath: string | URL,
		arguments?: readonly string[],
		options?: NewOptionsType,
	): ExecaSubprocess<OptionsType & NewOptionsType>;

	<NewOptionsType extends Options = {}>(
		scriptPath: string | URL,
		options?: NewOptionsType,
	): ExecaSubprocess<OptionsType & NewOptionsType>;
};

/**
Same as `execa()` but using the `node: true` option.
Executes a Node.js file using `node scriptPath ...arguments`.

Just like `execa()`, this can use the template string syntax or bind options.

This is the preferred method when executing Node.js files.

@param scriptPath - Node.js script to execute, as a string or file URL
@param arguments - Arguments to pass to `scriptPath` on execution.
@returns An `ExecaSubprocess` that is both:
- a `Promise` resolving or rejecting with a subprocess `result`.
- a [`child_process` instance](https://nodejs.org/api/child_process.html#child_process_class_childprocess) with some additional methods and properties.
@throws A subprocess `result` error

@example
```
import {execaNode} from 'execa';

await execaNode('scriptPath', ['argument']);
```
*/
export declare const execaNode: ExecaNode<{}>;
