<picture>
	<source media="(prefers-color-scheme: dark)" srcset="../media/logo_dark.svg">
	<img alt="execa logo" src="../media/logo.svg" width="400">
</picture>
<br>

# 📃 Text lines

## Simple splitting

If the [`lines`](api.md#optionslines) option is `true`, the output is split into lines, as an array of strings.

```js
import {execa} from 'execa';

const lines = await execa({lines: true})`npm run build`;
console.log(lines.join('\n'));
```

## Iteration

### Progressive splitting

The subprocess' return value is an [async iterable](api.md#subprocesssymbolasynciterator). It iterates over the output's lines while the subprocess is still running.

```js
for await (const line of execa`npm run build`) {
	if (line.includes('ERROR')) {
		console.log(line);
	}
}
```

Alternatively, [`subprocess.iterable()`](api.md#subprocessiterablereadableoptions) can be called to pass [iterable options](api.md#readableoptions).

The iteration waits for the subprocess to end (even when using [`break`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/break) or [`return`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/return)). It throws if the subprocess [fails](api.md#result). This means you do not need to `await` the subprocess' [promise](execution.md#result).

```js
for await (const line of execa`npm run build`.iterable())) {
	/* ... */
}
```

### Stdout/stderr

By default, the subprocess' [`stdout`](https://en.wikipedia.org/wiki/Standard_streams#Standard_output_(stdout)) is used. The [`from`](api.md#readableoptionsfrom) iterable option can select a different file descriptor, such as [`'stderr'`](https://en.wikipedia.org/wiki/Standard_streams#Standard_error_(stderr)), [`'all'`](output.md#interleaved-output) or [`'fd3'`](output.md#additional-file-descriptors).

```js
for await (const stderrLine of execa`npm run build`.iterable({from: 'stderr'})) {
	/* ... */
}
```

## Newlines

### Final newline

The final newline is stripped from the output's last line, unless the [`stripFinalNewline`](api.md#optionsstripfinalnewline) option is `false`.

```js
const {stdout} = await execa({stripFinalNewline: false})`npm run build`;
console.log(stdout.endsWith('\n')); // true
```

### Array of lines

When using the [`lines`](#simple-splitting) option, newlines are stripped from each line, unless the [`stripFinalNewline`](api.md#optionsstripfinalnewline) option is `false`.

```js
// Each line now ends with '\n'.
// The last `line` might or might not end with '\n', depending on the output.
const lines = await execa({lines: true, stripFinalNewline: false})`npm run build`;
console.log(lines.join(''));
```

### Iterable

When [iterating](#progressive-splitting) over lines, newlines are stripped from each line, unless the [`preserveNewlines`](api.md#readableoptionspreservenewlines) iterable option is `true`.

This option can also be used with [streams produced](streams.md#converting-a-subprocess-to-a-stream) by [`subprocess.readable()`](api.md#subprocessreadablereadableoptions) or [`subprocess.duplex()`](api.md#subprocessduplexduplexoptions), providing the [`binary`](binary.md#streams) option is `false`.

```js
// `line` now ends with '\n'.
// The last `line` might or might not end with '\n', depending on the output.
for await (const line of execa`npm run build`.iterable({preserveNewlines: true})) {
	/* ... */
}
```

### Transforms

When using [transforms](transform.md), newlines are stripped from each `line` argument, unless the [`preserveNewlines`](api.md#transformoptionspreservenewlines) transform option is `true`.

```js
// `line` now ends with '\n'.
// The last `line` might or might not end with '\n', depending on the output.
const transform = function * (line) { /* ... */ };

await execa({stdout: {transform, preserveNewlines: true}})`npm run build`;
```

Each `yield` produces at least one line. Calling `yield` multiple times or calling `yield *` produces multiples lines.

```js
const transform = function * (line) {
	yield 'Important note:';
	yield 'Read the comments below.';

	// Or:
	yield * [
		'Important note:',
		'Read the comments below.',
	];

	// Is the same as:
	yield 'Important note:\nRead the comments below.\n';

	yield line;
};

await execa({stdout: transform})`npm run build`;
```

However, if the [`preserveNewlines`](api.md#transformoptionspreservenewlines) transform option is `true`, multiple `yield`s produce a single line instead.

```js
const transform = function * (line) {
	yield 'Important note: ';
	yield 'Read the comments below.\n';

	// Is the same as:
	yield 'Important note: Read the comments below.\n';

	yield line;
};

await execa({stdout: {transform, preserveNewlines: true}})`npm run build`;
```

<hr>

[**Next**: 🤖 Binary data](binary.md)\
[**Previous**: 📢 Output](output.md)\
[**Top**: Table of contents](../readme.md#documentation)
