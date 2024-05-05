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

Returns or throws a subprocess `result`. The `subprocess` is not returned: its methods and properties are not available.

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
