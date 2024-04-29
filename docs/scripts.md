<picture>
	<source media="(prefers-color-scheme: dark)" srcset="../media/logo_dark.svg">
	<img alt="execa logo" src="../media/logo.svg" width="400">
</picture>
<br>

# 📜 Scripts

## Script files

[Scripts](https://en.wikipedia.org/wiki/Shell_script) are Node.js files executing a series of commands. While those used to be written with a shell language like [Bash](https://en.wikipedia.org/wiki/Bash_(Unix_shell)), libraries like Execa provide with a better, modern experience.

Scripts use [`$`](api.md#file-arguments-options) instead of [`execa`](api.md#execafile-arguments-options). The only difference is that `$` includes script-friendly default options: [`stdin: 'inherit'`](input.md#terminal-input) and [`preferLocal: true`](environment.md#local-binaries).

[More info about the difference between Execa, Bash and zx.](bash.md)

```js
import {$} from 'execa';

const {stdout: name} = await $`cat package.json`
  .pipe`grep name`;
console.log(name);

const branch = await $`git branch --show-current`;
await $`dep deploy --branch=${branch}`;

await Promise.all([
	$`sleep 1`,
	$`sleep 2`,
	$`sleep 3`,
]);

const directoryName = 'foo bar';
await $`mkdir /tmp/${directoryName}`;
```

## Template string syntax

Just like [`execa`](api.md#execafile-arguments-options), [`$`](api.md#file-arguments-options) can use either the [template string syntax](execution.md#template-string-syntax) or the [array syntax](execution.md#array-syntax).

Conversely, the template string syntax can be used outside of script files: `$` is not required to use that syntax. For example, `execa` [can use it too](execution.md#template-string-syntax).

```js
import {execa, $} from 'execa';

const branch = await execa`git branch --show-current`;
await $('dep', ['deploy', `--branch=${branch}`]);
```

<hr>

[**Next**: 🐢 Node.js files](node.md)\
[**Previous**: 💻 Shell](shell.md)\
[**Top**: Table of contents](../readme.md#documentation)
