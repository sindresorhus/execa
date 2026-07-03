<picture>
	<source media="(prefers-color-scheme: dark)" srcset="../media/logo_dark.svg">
	<img alt="execa logo" src="../media/logo.svg" width="400">
</picture>
<br>

# 💻 Shell

## Avoiding shells

In general, [shells](https://en.wikipedia.org/wiki/Shell_(computing)) should be avoided because they are:
- Not cross-platform, encouraging shell-specific syntax.
- Slower, because of the additional shell interpretation.
- Unsafe, potentially allowing [command injection](https://en.wikipedia.org/wiki/Code_injection#Shell_injection) (see the [escaping section](escaping.md#shells)).

In almost all cases, plain JavaScript is a better alternative to shells. The [following page](bash.md) shows how to convert Bash into JavaScript.

## When a shell is not needed

On Windows, a shell is often used to work around limitations of the OS. This is not needed with Execa. In particular, `shell: true` is not required to:
- run `.cmd` and `.bat` files, such as `npm.cmd`
- [resolve a command](windows.md#file-extensions) by name using `PATHEXT`
- run [shebang](windows.md#shebang) scripts
- [escape](windows.md#escaping) file paths and arguments

A shell is only needed to use shell-specific syntax, such as pipes `|`, redirections `>`, globbing `*` or environment variable expansion `$VAR`.

## Specific shell

```js
import {execa} from 'execa';

await execa({shell: '/bin/bash'})`npm run "$TASK" && npm run test`;
```

## OS-specific shell

When the [`shell`](api.md#optionsshell) option is `true`, `sh` is used on Unix and [`cmd.exe`](https://en.wikipedia.org/wiki/Cmd.exe) is used on Windows.

`sh` and `cmd.exe` syntaxes are very different. Therefore, this is usually not useful.

```js
await execa({shell: true})`npm run build`;
```

<hr>

[**Next**: 📜 Scripts](scripts.md)\
[**Previous**: 💬 Escaping/quoting](escaping.md)\
[**Top**: Table of contents](../readme.md#documentation)
