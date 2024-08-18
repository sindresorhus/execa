<picture>
	<source media="(prefers-color-scheme: dark)" srcset="../media/logo_dark.svg">
	<img alt="execa logo" src="../media/logo.svg" width="400">
</picture>
<br>

# 📎 Windows

Although each OS implements subprocesses very differently, Execa makes them cross-platform, except in a few instances.

## Shebang

On Unix, executable files can use [shebangs](https://en.wikipedia.org/wiki/Shebang_(Unix)).

```js
import {execa} from 'execa';

// If script.js starts with #!/usr/bin/env node
await execa`./script.js`;

// Then, the above is a shortcut for:
await execa`node ./script.js`;
```

Although Windows does not natively support shebangs, Execa adds support for them.

## Signals

Only few [signals](termination.md#other-signals) work on Windows with Node.js: [`SIGTERM`](termination.md#sigterm), [`SIGKILL`](termination.md#sigkill), [`SIGINT`](https://en.wikipedia.org/wiki/Signal_(IPC)#SIGINT) and [`SIGQUIT`](termination.md#sigquit). Also, sending signals from other processes is [not supported](termination.md#signal-name-and-description). Finally, the [`forceKillAfterDelay`](api.md#optionsforcekillafterdelay) option [is a noop](termination.md#forceful-termination) on Windows.

## Asynchronous I/O

The default value for the [`stdin`](api.md#optionsstdin), [`stdout`](api.md#optionsstdout) and [`stderr`](api.md#optionsstderr) options is [`'pipe'`](output.md#stdout-and-stderr). This returns the output as [`result.stdout`](api.md#resultstdout) and [`result.stderr`](api.md#resultstderr) and allows for [manual streaming](streams.md#manual-streaming).

Instead of `'pipe'`, `'overlapped'` can be used instead to use [asynchronous I/O](https://learn.microsoft.com/en-us/windows/win32/fileio/synchronous-and-asynchronous-i-o) under-the-hood on Windows, instead of the default behavior which is synchronous. On other platforms, asynchronous I/O is always used, so `'overlapped'` behaves the same way as `'pipe'`.

## Escaping

Windows requires files and arguments to be quoted when they contain spaces, tabs, backslashes or double quotes. Unlike Unix, this is needed even when no [shell](shell.md) is used.

When not using any shell, Execa performs that quoting automatically. This ensures files and arguments are split correctly.

```js
await execa`npm run ${'task with space'}`;
```

When using a [shell](shell.md), the user must manually perform shell-specific quoting, on both Unix and Windows. When the [`shell`](api.md#optionsshell) option is `true`, [`cmd.exe`](https://en.wikipedia.org/wiki/Cmd.exe) is used on Windows and `sh` on Unix. Unfortunately both shells use different quoting rules. With `cmd.exe`, this mostly involves double quoting arguments and prepending double quotes with a backslash.

```js
if (isWindows) {
	await execa({shell: true})`npm run ${'"task with space"'}`;
} else {
	await execa({shell: true})`npm run ${'\'task with space\''}`;
}
```

When using other Windows shells (such as Powershell or WSL), Execa performs `cmd.exe`-specific automatic quoting by default. This is a problem since Powershell uses different quoting rules. This can be disabled using the [`windowsVerbatimArguments: true`](api.md#optionswindowsverbatimarguments) option.

```js
if (isWindows) {
	await execa({windowsVerbatimArguments: true})`wsl ...`;
}
```

## Console window

If the [`windowsHide`](api.md#optionswindowshide) option is `false`, the subprocess is run in a new console window. This is necessary to make [`SIGINT` work](https://github.com/nodejs/node/issues/29837) on Windows, and to prevent subprocesses not being cleaned up in [some specific situations](https://github.com/sindresorhus/execa/issues/433).

## UID and GID

By default, subprocesses are run using the current [user](https://en.wikipedia.org/wiki/User_identifier) and [group](https://en.wikipedia.org/wiki/Group_identifier). The [`uid`](api.md#optionsuid) and [`gid`](api.md#optionsgid) options can be used to set a different user or group.

However, since Windows uses a different permission model, those options throw.

<hr>

[**Next**: 🔍 Differences with Bash and zx](bash.md)\
[**Previous**: 🐛 Debugging](debugging.md)\
[**Top**: Table of contents](../readme.md#documentation)
