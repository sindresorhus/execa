<picture>
	<source media="(prefers-color-scheme: dark)" srcset="../media/logo_dark.svg">
	<img alt="execa logo" src="../media/logo.svg" width="400">
</picture>
<br>

# 💬 Escaping/quoting

## Array syntax

When using the [array syntax](execution.md#array-syntax), arguments are automatically escaped. They can contain any character, including spaces, tabs and newlines. However, they cannot contain [null bytes](https://en.wikipedia.org/wiki/Null_character): [binary inputs](binary.md#binary-input) should be used instead.

```js
import {execa} from 'execa';

await execa('npm', ['run', 'task with space']);
```

## Template string syntax

The same applies when using the [template string syntax](execution.md#template-string-syntax). However, spaces, tabs and newlines must use `${}`.

```js
await execa`npm run ${'task with space'}`;
```

## User-defined input

The above syntaxes allow the file and its arguments to be user-defined by passing a variable.

```js
const command = 'npm';
const commandArguments = ['run', 'task with space'];

await execa(command, commandArguments);
await execa`${command} ${commandArguments}`;
```

However, [`execaCommand()`](api.md#execacommandcommand-options) must be used instead if:
- _Both_ the file and its arguments are user-defined
- _And_ those are supplied as a single string

This is only intended for very specific cases, such as a [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop). This should be avoided otherwise.

```js
import {execaCommand} from 'execa';

for await (const commandAndArguments of getReplLine()) {
	await execaCommand(commandAndArguments);
}
```

Arguments passed to `execaCommand()` are automatically escaped. They can contain any character (except [null bytes](https://en.wikipedia.org/wiki/Null_character)), but spaces must be escaped with a backslash.

```js
await execaCommand('npm run task\\ with\\ space');
```

## Shells

[Shells](shell.md) ([Bash](https://en.wikipedia.org/wiki/Bash_(Unix_shell)), [cmd.exe](https://en.wikipedia.org/wiki/Cmd.exe), etc.) are not used unless the [`shell`](api.md#optionsshell) option is set. This means shell-specific characters and expressions (`$variable`, `&&`, `||`, `;`, `|`, etc.) have no special meaning and do not need to be escaped.

If you do set the `shell` option, arguments will not be automatically escaped anymore. Instead, they will be concatenated as a single string using spaces as delimiters.

```js
await execa({shell: true})`npm ${'run'} ${'task with space'}`;
// Is the same as:
await execa({shell: true})`npm run task with space`;
```

Therefore, you need to manually quote the arguments, using the shell-specific syntax.

```js
await execa({shell: true})`npm ${'run'} ${'"task with space"'}`;
// Is the same as:
await execa({shell: true})`npm run "task with space"`;
```

Sometimes a shell command is passed as argument to an executable that runs it indirectly. In that case, that shell command must quote its own arguments.

```js
$`ssh host ${'npm run "task with space"'}`;
```

<hr>

[**Next**: 💻 Shell](shell.md)\
[**Previous**: ️▶️ Basic execution](execution.md)\
[**Top**: Table of contents](../readme.md#documentation)
