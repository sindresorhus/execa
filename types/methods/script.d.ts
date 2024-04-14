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
Same as `execa()` but using the `stdin: 'inherit'` and `preferLocal: true` options.

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
> node file.js
unicorns
rainbows

> NODE_DEBUG=execa node file.js
[19:49:00.360] [0] $ echo unicorns
unicorns
[19:49:00.383] [0] √ (done in 23ms)
[19:49:00.383] [1] $ echo rainbows
rainbows
[19:49:00.404] [1] √ (done in 21ms)
```
*/
export const $: ExecaScript<{}>;
