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
import {execa} from 'execa';

const file = 'npm';
const commandArguments = ['run', 'task with space'];
await execa`${file} ${commandArguments}`;

await execa(file, commandArguments);
```

If the file and/or multiple arguments are supplied as a single string, [`parseCommandString()`](api.md#parsecommandstringcommand) can split it into an array.

```js
import {execa, parseCommandString} from 'execa';

const commandString = 'npm run task';
const commandArray = parseCommandString(commandString);
await execa`${commandArray}`;

const [file, ...commandArguments] = commandArray;
await execa(file, commandArguments);
```

Spaces are used as delimiters. They can be escaped with a backslash.

```js
await execa`${parseCommandString('npm run task\\ with\\ space')}`;
```

## Shells

[Shells](shell.md) ([Bash](https://en.wikipedia.org/wiki/Bash_(Unix_shell)), [cmd.exe](https://en.wikipedia.org/wiki/Cmd.exe), etc.) are not used unless the [`shell`](api.md#optionsshell) option is set. This means shell-specific syntax has no special meaning and does not need to be escaped:
- Quotes: `"value"`, `'value'`, `$'value'`
- Characters: `$variable`, `&&`, `||`, `;`, `|`
- Globbing: `*`, `**`
- Expressions: `$?`, `~`

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
const command = 'npm run "task with space"';
await execa`ssh host ${command}`;
```

<hr>

[**Next**: 💻 Shell](shell.md)\
[**Previous**: ️▶️ Basic execution](execution.md)\
[**Top**: Table of contents](../readme.md#documentation)
