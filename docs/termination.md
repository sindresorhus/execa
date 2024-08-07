<picture>
	<source media="(prefers-color-scheme: dark)" srcset="../media/logo_dark.svg">
	<img alt="execa logo" src="../media/logo.svg" width="400">
</picture>
<br>

# 🏁 Termination

## Alternatives

Terminating a subprocess ends it abruptly. This prevents rolling back the subprocess' operations and leaves them incomplete.

Ideally subprocesses should end on their own. If that's not possible, [graceful termination](#graceful-termination) should be preferred.

## Canceling

The [`cancelSignal`](api.md#optionscancelsignal) option can be used to cancel a subprocess. When it is [aborted](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort), a [`SIGTERM` signal](#default-signal) is sent to the subprocess.

```js
import {execaNode} from 'execa';

const controller = new AbortController();
const cancelSignal = controller.signal;

setTimeout(() => {
	controller.abort();
}, 5000);

try {
	await execaNode({cancelSignal})`build.js`;
} catch (error) {
	if (error.isCanceled) {
		console.error('Canceled by cancelSignal.');
	}

	throw error;
}
```

## Graceful termination

### Share a `cancelSignal`

When the [`gracefulCancel`](api.md#optionsgracefulcancel) option is `true`, the [`cancelSignal`](api.md#optionscancelsignal) option does not send any [`SIGTERM`](#sigterm). Instead, the subprocess calls [`getCancelSignal()`](api.md#getcancelsignal) to retrieve and handle the [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal). This allows the subprocess to properly clean up and abort operations.

This option only works with Node.js files.

This is cross-platform. If you do not need to support Windows, [signal handlers](#handling-signals) can also be used.

```js
// main.js
import {execaNode} from 'execa';

const controller = new AbortController();
const cancelSignal = controller.signal;

setTimeout(() => {
	controller.abort();
}, 5000);

try {
	await execaNode({cancelSignal, gracefulCancel: true})`build.js`;
} catch (error) {
	if (error.isGracefullyCanceled) {
		console.error('Cancelled gracefully.');
	}

	throw error;
}
```

```js
// build.js
import {getCancelSignal} from 'execa';

const cancelSignal = await getCancelSignal();
```

### Abort operations

The [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) returned by [`getCancelSignal()`](api.md#getcancelsignal) can be passed to most long-running Node.js methods: [`setTimeout()`](https://nodejs.org/api/timers.html#timerspromisessettimeoutdelay-value-options), [`setInterval()`](https://nodejs.org/api/timers.html#timerspromisessetintervaldelay-value-options), [events](https://nodejs.org/api/events.html#eventsonemitter-eventname-options), [streams](https://nodejs.org/api/stream.html#new-streamreadableoptions), [REPL](https://nodejs.org/api/readline.html#rlquestionquery-options), HTTP/TCP [requests](https://nodejs.org/api/http.html#httprequesturl-options-callback) or [servers](https://nodejs.org/api/net.html#serverlistenoptions-callback), [reading](https://nodejs.org/api/fs.html#fspromisesreadfilepath-options) / [writing](https://nodejs.org/api/fs.html#fspromiseswritefilefile-data-options) / [watching](https://nodejs.org/api/fs.html#fspromiseswatchfilename-options) files, or spawning another subprocess.

When aborted, those methods throw the `Error` instance which was passed to [`abortController.abort(error)`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort). Since those methods keep the subprocess alive, aborting them makes the subprocess end on its own.

```js
import {getCancelSignal} from 'execa';
import {watch} from 'node:fs/promises';

const cancelSignal = await getCancelSignal();

try {
	for await (const fileChange of watch('./src', {signal: cancelSignal})) {
		onFileChange(fileChange);
	}
} catch (error) {
	if (error.isGracefullyCanceled) {
		console.log(error.cause === cancelSignal.reason); // true
	}
}
```

### Cleanup logic

For other kinds of operations, the [`abort`](https://nodejs.org/api/globals.html#event-abort) event should be listened to. Although [`cancelSignal.addEventListener('abort')`](https://nodejs.org/api/events.html#eventtargetaddeventlistenertype-listener-options) can be used, [`events.addAbortListener(cancelSignal)`](https://nodejs.org/api/events.html#eventsaddabortlistenersignal-listener) is preferred since it works even if the `cancelSignal` is already aborted.

### Graceful exit

We recommend explicitly [stopping](#abort-operations) each pending operation when the subprocess is aborted. This allows it to end on its own.

```js
import {getCancelSignal} from 'execa';
import {addAbortListener} from 'node:events';

const cancelSignal = await getCancelSignal();
addAbortListener(cancelSignal, async () => {
	await cleanup();
	process.exitCode = 1;
});
```

However, if any operation is still ongoing, the subprocess will keep running. It can be forcefully ended using [`process.exit(exitCode)`](https://nodejs.org/api/process.html#processexitcode) instead of [`process.exitCode`](https://nodejs.org/api/process.html#processexitcode_1).

If the subprocess is still alive after 5 seconds, it is forcefully terminated with [`SIGKILL`](#sigkill). This can be [configured or disabled](#forceful-termination) using the [`forceKillAfterDelay`](api.md#optionsforcekillafterdelay) option.

## Timeout

### Execution timeout

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

### Inactivity timeout

To terminate a subprocess when it becomes inactive, the [`cancelSignal`](#canceling) option can be combined with [transforms](transform.md) and some [debouncing logic](https://github.com/sindresorhus/debounce-fn). The following example terminates the subprocess if it has not printed to [`stdout`](api.md#resultstdout)/[`stderr`](api.md#resultstderr) in the last minute.

```js
import {execa} from 'execa';
import debounceFn from 'debounce-fn';

// 1 minute
const wait = 60_000;

const getInactivityOptions = () => {
	const controller = new AbortController();
	const cancelSignal = controller.signal;

	// Delay and debounce `cancelSignal` each time `controller.abort()` is called
	const abort = debounceFn(controller.abort.bind(controller), {wait});

	const onOutput = {
		* transform(data) {
			// When anything is printed, debounce `controller.abort()`
			abort();

			// Keep the output as is
			yield data;
		},
		// Debounce even if the output does not include any newline
		binary: true,
	};

	// Start debouncing
	abort();

	return {
		cancelSignal,
		stdout: onOutput,
		stderr: onOutput,
	};
};

const options = getInactivityOptions();

await execa(options)`npm run build`;
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

[`SIGTERM`](https://en.wikipedia.org/wiki/Signal_(IPC)#SIGTERM) is the default signal. It terminates the subprocess. On Unix, it can [be handled](#handling-signals) to run some cleanup logic.

```js
const subprocess = execa`npm run build`;
subprocess.kill();
// Is the same as:
subprocess.kill('SIGTERM');
```

### SIGINT

[`SIGINT`](https://en.wikipedia.org/wiki/Signal_(IPC)#SIGINT) terminates the process. Its [handler](#handling-signals) is triggered on `CTRL-C`.

```js
subprocess.kill('SIGINT');
```

### SIGKILL

[`SIGKILL`](https://en.wikipedia.org/wiki/Signal_(IPC)#SIGKILL) forcefully terminates the subprocess. It [cannot be handled](#handling-signals).

```js
subprocess.kill('SIGKILL');
```

### SIGQUIT

[`SIGQUIT`](https://en.wikipedia.org/wiki/Signal_(IPC)#SIGQUIT) terminates the process. On Unix, it creates a [core dump](https://en.wikipedia.org/wiki/Core_dump).

```js
subprocess.kill('SIGQUIT');
```

### Other signals

Other signals can be passed as argument. However, most other signals do not fully [work on Windows](https://github.com/ehmicky/cross-platform-node-guide/blob/main/docs/6_networking_ipc/signals.md#cross-platform-signals).

### Default signal

The [`killSignal`](api.md#optionskillsignal) option sets the default signal used by [`subprocess.kill()`](api.md#subprocesskillsignal-error) and the following options: [`cancelSignal`](#canceling), [`timeout`](#timeout), [`maxBuffer`](output.md#big-output) and [`cleanup`](#current-process-exit). It is [`SIGTERM`](#sigterm) by default.

```js
const subprocess = execa({killSignal: 'SIGKILL'})`npm run build`;
subprocess.kill(); // Forceful termination
```

### Handling signals

On Unix, most signals (not [`SIGKILL`](#sigkill)) can be intercepted to perform a graceful exit.

```js
process.on('SIGTERM', () => {
	cleanup();
	process.exit(1);
})
```

Unfortunately this [usually does not work](https://github.com/ehmicky/cross-platform-node-guide/blob/main/docs/6_networking_ipc/signals.md#cross-platform-signals) on Windows. The only signal that is somewhat cross-platform is [`SIGINT`](#sigint): on Windows, its handler is triggered when the user types `CTRL-C` in the terminal. However `subprocess.kill('SIGINT')` is only handled on Unix.

Execa provides the [`gracefulCancel`](#graceful-termination) option as a cross-platform alternative to signal handlers.

### Signal name and description

When a subprocess was terminated by a signal, [`error.isTerminated`](api.md#erroristerminated) is `true`.

Also, [`error.signal`](api.md#errorsignal) and [`error.signalDescription`](api.md#errorsignaldescription) indicate the signal's name and [human-friendly description](https://github.com/ehmicky/human-signals). On Windows, those are only set if the current process terminated the subprocess, as opposed to [another process](#inter-process-termination).

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

The [`error.isForcefullyTerminated`](api.md#errorisforcefullyterminated) boolean property can be used to check whether a subprocess was forcefully terminated by the `forceKillAfterDelay` option.

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
