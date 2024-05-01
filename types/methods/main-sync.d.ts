import type {SyncOptions} from '../arguments/options';
import type {ExecaSyncResult} from '../return/result';
import type {TemplateString} from './template';

type ExecaSync<OptionsType extends SyncOptions> = {
	<NewOptionsType extends SyncOptions = {}>(options: NewOptionsType): ExecaSync<OptionsType & NewOptionsType>;

	(...templateString: TemplateString): ExecaSyncResult<OptionsType>;

	<NewOptionsType extends SyncOptions = {}>(
		file: string | URL,
		arguments?: readonly string[],
		options?: NewOptionsType,
	): ExecaSyncResult<OptionsType & NewOptionsType>;

	<NewOptionsType extends SyncOptions = {}>(
		file: string | URL,
		options?: NewOptionsType,
	): ExecaSyncResult<OptionsType & NewOptionsType>;
};

/**
Same as `execa()` but synchronous.

Returns or throws a subprocess `result`. The `subprocess` is not returned: its methods and properties are not available.

@param file - The program/script to execute, as a string or file URL
@param arguments - Arguments to pass to `file` on execution.
@returns `ExecaSyncResult`
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
