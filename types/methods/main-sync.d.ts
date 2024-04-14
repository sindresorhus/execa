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
