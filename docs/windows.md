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

## `cmd.exe` escaping

If the [`windowsVerbatimArguments`](api.md#optionswindowsverbatimarguments) option is `false`, the [command arguments](input.md#command-arguments) are automatically escaped on Windows. When using a [`cmd.exe`](https://en.wikipedia.org/wiki/Cmd.exe) [shell](api.md#optionsshell), this is `true` by default instead.

This is ignored on other platforms: those are [automatically escaped](escaping.md) by default.

## Console window

If the [`windowsHide`](api.md#optionswindowshide) option is `false`, the subprocess is run in a new console window. This is necessary to make [`SIGINT` work](https://github.com/nodejs/node/issues/29837) on Windows, and to prevent subprocesses not being cleaned up in [some specific situations](https://github.com/sindresorhus/execa/issues/433).

## UID and GID

By default, subprocesses are run using the current [user](https://en.wikipedia.org/wiki/User_identifier) and [group](https://en.wikipedia.org/wiki/Group_identifier). The [`uid`](api.md#optionsuid) and [`gid`](api.md#optionsgid) options can be used to set a different user or group.

However, since Windows uses a different permission model, those options throw.

<hr>

[**Next**: 🔍 Differences with Bash and zx](bash.md)\
[**Previous**: 🐛 Debugging](debugging.md)\
[**Top**: Table of contents](../readme.md#documentation)
