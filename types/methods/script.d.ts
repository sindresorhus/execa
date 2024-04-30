import type {
	CommonOptions,
	Options,
	SyncOptions,
	StricterOptions,
} from '../arguments/options';
import type {ExecaSyncResult} from '../return/result';
import type {ExecaSubprocess} from '../subprocess/subprocess';
import type {TemplateString} from './template';

type ExecaScriptCommon<OptionsType extends CommonOptions> = {
	<NewOptionsType extends CommonOptions = {}>(options: NewOptionsType): ExecaScript<OptionsType & NewOptionsType>;

	(...templateString: TemplateString): ExecaSubprocess<StricterOptions<OptionsType, Options>>;

	<NewOptionsType extends Options = {}>(
		file: string | URL,
		arguments?: readonly string[],
		options?: NewOptionsType,
	): ExecaSubprocess<StricterOptions<OptionsType & NewOptionsType, Options>>;

	<NewOptionsType extends Options = {}>(
		file: string | URL,
		options?: NewOptionsType,
	): ExecaSubprocess<StricterOptions<OptionsType & NewOptionsType, Options>>;
};

type ExecaScriptSync<OptionsType extends CommonOptions> = {
	<NewOptionsType extends SyncOptions = {}>(options: NewOptionsType): ExecaScriptSync<OptionsType & NewOptionsType>;

	(...templateString: TemplateString): ExecaSyncResult<StricterOptions<OptionsType, SyncOptions>>;

	<NewOptionsType extends SyncOptions = {}>(
		file: string | URL,
		arguments?: readonly string[],
		options?: NewOptionsType,
	): ExecaSyncResult<StricterOptions<OptionsType & NewOptionsType, SyncOptions>>;

	<NewOptionsType extends SyncOptions = {}>(
		file: string | URL,
		options?: NewOptionsType,
	): ExecaSyncResult<StricterOptions<OptionsType & NewOptionsType, SyncOptions>>;
};

type ExecaScript<OptionsType extends CommonOptions> = {
	sync: ExecaScriptSync<OptionsType>;
	s: ExecaScriptSync<OptionsType>;
} & ExecaScriptCommon<OptionsType>;

/**
Same as `execa()` but using script-friendly default options.

Just like `execa()`, this can use the template string syntax or bind options. It can also be run synchronously using `$.sync()` or `$.s()`.

This is the preferred method when executing multiple commands in a script file.

@returns An `ExecaSubprocess` that is both:
	- a `Promise` resolving or rejecting with a subprocess `result`.
	- a [`child_process` instance](https://nodejs.org/api/child_process.html#child_process_class_childprocess) with some additional methods and properties.
@throws A subprocess `result` error

@example <caption>Basic</caption>
```
import {$} from 'execa';

const branch = await $`git branch --show-current`;
await $`dep deploy --branch=${branch}`;
```

@example <caption>Verbose mode</caption>
```
$ node build.js
Building application...
Done building.
Running tests...
Error: the entrypoint is invalid.

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
export const $: ExecaScript<{}>;
