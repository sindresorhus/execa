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
@returns A subprocess `result` object
@throws A subprocess `result` error

@example <caption>Promise interface</caption>
```
import {execa} from 'execa';

const {stdout} = execaSync('echo', ['unicorns']);
console.log(stdout);
//=> 'unicorns'
```

@example <caption>Redirect input from a file</caption>
```
import {execa} from 'execa';

// Similar to `cat < stdin.txt` in Bash
const {stdout} = execaSync('cat', {inputFile: 'stdin.txt'});
console.log(stdout);
//=> 'unicorns'
```

@example <caption>Handling errors</caption>
```
import {execa} from 'execa';

// Catching an error
try {
	execaSync('unknown', ['command']);
} catch (error) {
	console.log(error);
	/*
	{
		message: 'Command failed with ENOENT: unknown command\nspawnSync unknown ENOENT',
		errno: -2,
		code: 'ENOENT',
		syscall: 'spawnSync unknown',
		path: 'unknown',
		spawnargs: ['command'],
		shortMessage: 'Command failed with ENOENT: unknown command\nspawnSync unknown ENOENT',
		originalMessage: 'spawnSync unknown ENOENT',
		command: 'unknown command',
		escapedCommand: 'unknown command',
		cwd: '/path/to/cwd',
		failed: true,
		timedOut: false,
		isCanceled: false,
		isTerminated: false,
		isMaxBuffer: false,
		stdio: [],
		pipedFrom: []
	}
	\*\/
}
```
*/
export declare const execaSync: ExecaSync<{}>;
