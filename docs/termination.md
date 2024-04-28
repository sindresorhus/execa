<picture>
	<source media="(prefers-color-scheme: dark)" srcset="../media/logo_dark.svg">
	<img alt="execa logo" src="../media/logo.svg" width="400">
</picture>
<br>

# 🏁 Termination

## Canceling

The [`cancelSignal`](api.md#optionscancelsignal) option can be used to cancel a subprocess. When [`abortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) is [aborted](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort), a [`SIGTERM` signal](#default-signal) is sent to the subprocess.

```js
import {execa} from 'execa';

const abortController = new AbortController();

setTimeout(() => {
	abortController.abort();
}, 5000);

try {
	await execa({cancelSignal: abortController.signal})`npm run build`;
} catch (error) {
	if (error.isCanceled) {
		console.error('Aborted by cancelSignal.');
	}

	throw error;
}
```

## Timeout

If the subprocess lasts longer than the [`timeout`](api.md#optionstimeout) option, a [`SIGTERM` signal](#default-signal) is sent to it.

```js
try {
	await execa({timeout: 5000})`npm run build`;
} catch (error) {
	if (error.timedOut) {
		console.error('Timed out.');
	}

	throw error;
}
```

## Current process exit

If the current process exits, the subprocess is automatically [terminated](#default-signal) unless either:
- The [`cleanup`](api.md#optionscleanup) option is `false`.
- The subprocess is run in the background using the [`detached`](api.md#optionsdetached) option.
- The current process was terminated abruptly, for example, with [`SIGKILL`](#sigkill) as opposed to [`SIGTERM`](#sigterm) or a successful exit.

## Signal termination

[`subprocess.kill()`](api.md#subprocesskillsignal-error) sends a [signal](https://en.wikipedia.org/wiki/Signal_(IPC)) to the subprocess. This is an inter-process message handled by the OS. Most (but [not all](https://github.com/ehmicky/human-signals#action)) signals terminate the subprocess.

[More info.](https://nodejs.org/api/child_process.html#subprocesskillsignal)

### SIGTERM

[`SIGTERM`](https://en.wikipedia.org/wiki/Signal_(IPC)#SIGTERM) is the default signal. It terminates the subprocess.

```js
const subprocess = execa`npm run build`;
subprocess.kill();
// Is the same as:
subprocess.kill('SIGTERM');
```

The subprocess can [handle that signal](https://nodejs.org/api/process.html#process_signal_events) to run some cleanup logic.

```js
process.on('SIGTERM', () => {
	cleanup();
	process.exit(1);
})
```

### SIGKILL

[`SIGKILL`](https://en.wikipedia.org/wiki/Signal_(IPC)#SIGKILL) is like [`SIGTERM`](#sigterm) except it forcefully terminates the subprocess, i.e. it does not allow it to handle the signal.

```js
subprocess.kill('SIGKILL');
```

### Other signals

Other signals can be passed as argument. However, most other signals do not fully [work on Windows](https://github.com/ehmicky/cross-platform-node-guide/blob/main/docs/6_networking_ipc/signals.md#cross-platform-signals).

### Default signal

The [`killSignal`](api.md#optionskillsignal) option sets the default signal used by [`subprocess.kill()`](api.md#subprocesskillsignal-error) and the following options: [`cancelSignal`](#canceling), [`timeout`](#timeout), [`maxBuffer`](output.md#big-output) and [`cleanup`](#current-process-exit). It is [`SIGTERM`](#sigterm) by default.

```js
const subprocess = execa({killSignal: 'SIGKILL'})`npm run build`;
subprocess.kill(); // Forceful termination
```

### Signal name and description

When a subprocess was terminated by a signal, [`error.isTerminated`](api.md#resultisterminated) is `true`.

Also, [`error.signal`](api.md#resultsignal) and [`error.signalDescription`](api.md#resultsignaldescription) indicate the signal's name and [human-friendly description](https://github.com/ehmicky/human-signals). On Windows, those are only set if the current process terminated the subprocess, as opposed to [another process](#inter-process-termination).

```js
try {
	await execa`npm run build`;
} catch (error) {
	if (error.isTerminated) {
		console.error(error.signal); // SIGFPE
		console.error(error.signalDescription); // 'Floating point arithmetic error'
	}

	throw error;
}
```

## Forceful termination

If the subprocess is terminated but does not exit, [`SIGKILL`](#sigkill) is automatically sent to forcefully terminate it.

The grace period is set by the [`forceKillAfterDelay`](api.md#optionsforcekillafterdelay) option, which is 5 seconds by default. This feature can be disabled with `false`.

This works when the subprocess is terminated by either:
- Calling [`subprocess.kill()`](api.md#subprocesskillsignal-error) with no arguments.
- The [`cancelSignal`](#canceling), [`timeout`](#timeout), [`maxBuffer`](output.md#big-output) or [`cleanup`](#current-process-exit) option.

This does not work when the subprocess is terminated by either:
- Calling [`subprocess.kill()`](api.md#subprocesskillsignal-error) with a specific signal.
- Calling [`process.kill(subprocess.pid)`](api.md#subprocesspid).
- Sending a termination signal [from another process](#inter-process-termination).

Also, this does not work on Windows, because Windows [doesn't support signals](https://nodejs.org/api/process.html#process_signal_events): `SIGKILL` and `SIGTERM` both terminate the subprocess immediately. Other packages (such as [`taskkill`](https://github.com/sindresorhus/taskkill)) can be used to achieve fail-safe termination on Windows.

```js
// No forceful termination
const subprocess = execa({forceKillAfterDelay: false})`npm run build`;
subprocess.kill();
```

## Inter-process termination

[`subprocess.kill()`](api.md#subprocesskillsignal-error) only works when the current process terminates the subprocess. To terminate the subprocess from a different process, its [`subprocess.pid`](api.md#subprocesspid) can be used instead.

```js
const subprocess = execa`npm run build`;
console.log('PID:', subprocess.pid); // PID: 6513
await subprocess;
```

For example, from a terminal:

```sh
$ kill -SIGTERM 6513
```

Or from a different Node.js process:

```js
import process from 'node:process';

process.kill(subprocessPid);
```

## Error message and stack trace

When terminating a subprocess, it is possible to include an error message and stack trace by using [`subprocess.kill(error)`](api.md#subprocesskillerror). The `error` argument will be available at [`error.cause`](api.md#errorcause).

```js
try {
	const subprocess = execa`npm run build`;
	setTimeout(() => {
		subprocess.kill(new Error('Timed out after 5 seconds.'));
	}, 5000);
	await subprocess;
} catch (error) {
	if (error.isTerminated) {
		console.error(error.cause); // new Error('Timed out after 5 seconds.')
		console.error(error.cause.stack); // Stack trace from `error.cause`
		console.error(error.originalMessage); // 'Timed out after 5 seconds.'
	}

	throw error;
}
```

<hr>

[**Next**: 🎹 Input](input.md)\
[**Previous**: ❌ Errors](errors.md)\
[**Top**: Table of contents](../readme.md#documentation)
