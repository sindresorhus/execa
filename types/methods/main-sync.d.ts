import type {SyncOptions} from '../arguments/options.js';
import type {SyncResult} from '../return/result.js';
import type {TemplateString} from './template.js';

type ExecaSync<OptionsType extends SyncOptions> = {
	<NewOptionsType extends SyncOptions = {}>(options: NewOptionsType): ExecaSync<OptionsType & NewOptionsType>;

	(...templateString: TemplateString): SyncResult<OptionsType>;

	<NewOptionsType extends SyncOptions = {}>(
		file: string | URL,
		arguments?: readonly string[],
		options?: NewOptionsType,
	): SyncResult<OptionsType & NewOptionsType>;

	<NewOptionsType extends SyncOptions = {}>(
		file: string | URL,
		options?: NewOptionsType,
	): SyncResult<OptionsType & NewOptionsType>;
};

/**
Same as `execa()` but synchronous.

Returns a subprocess `result` or throws an `error`. The `subprocess` is not returned: its methods and properties are not available.

When `command` is a template string, it includes both the `file` and its `arguments`.

`execaSync(options)` can be used to return a new instance of this method but with different default `options`. Consecutive calls are merged to previous ones.

This method is discouraged as it holds the CPU and lacks multiple features.

@param file - The program/script to execute, as a string or file URL
@param arguments - Arguments to pass to `file` on execution.
@returns `SyncResult`
@throws `ExecaSyncError`

@example

```
import {execaSync} from 'execa';

const {stdout} = execaSync`npm run build`;
// Print command's output
console.log(stdout);
```
*/
export declare const execaSync: ExecaSync<{}>;
