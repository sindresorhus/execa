<picture>
	<source media="(prefers-color-scheme: dark)" srcset="../media/logo_dark.svg">
	<img alt="execa logo" src="../media/logo.svg" width="400">
</picture>
<br>

# 🔀 Piping multiple subprocesses

## Array syntax

A subprocess' [output](output.md) can be [piped](https://en.wikipedia.org/wiki/Pipeline_(Unix)) to another subprocess' [input](input.md). The syntax is the same as [`execa(file, arguments?, options?)`](execution.md#array-syntax).

```js
import {execa} from 'execa';

// Similar to `npm run build | head -n 2` in shells
const {stdout} = await execa('npm', ['run', 'build'])
	.pipe('head', ['-n', '2']);
```

## Template string syntax

```js
const {stdout} = await execa`npm run build`
	.pipe`head -n 2`;
```

## Advanced syntax

```js
const subprocess = execa`head -n 2`;
const {stdout} = await execa`npm run build`
	.pipe(subprocess);
```

## Options

[Options](api.md#options-1) can be passed to either the source or the destination subprocess. Some [pipe-specific options](api.md#pipeoptions) can also be set by the destination subprocess.

```js
const {stdout} = await execa('npm', ['run', 'build'], subprocessOptions)
	.pipe('head', ['-n', '2'], subprocessOrPipeOptions);
```

```js
const {stdout} = await execa(subprocessOptions)`npm run build`
	.pipe(subprocessOrPipeOptions)`head -n 2`;
```

```js
const subprocess = execa(subprocessOptions)`head -n 2`;
const {stdout} = await execa(subprocessOptions)`npm run build`
	.pipe(subprocess, pipeOptions);
```

## Result

When both subprocesses succeed, the [`result`](api.md#result) of the destination subprocess is returned. The [`result`](api.md#result) of the source subprocess is available in a [`result.pipedFrom`](api.md#resultpipedfrom) array.

```js
const destinationResult = await execa`npm run build`
	.pipe`head -n 2`;
console.log(destinationResult.stdout); // First 2 lines of `npm run build`

const sourceResult = destinationResult.pipedFrom[0];
console.log(sourceResult.stdout); // Full output of `npm run build`
```

## Errors

When either subprocess fails, `subprocess.pipe()` is rejected with that subprocess' error. If the destination subprocess fails, [`error.pipedFrom`](api.md#resultpipedfrom) includes the source subprocess' result, which is useful for debugging.

```js
try {
	await execa`npm run build`
		.pipe`head -n 2`;
} catch (error) {
	if (error.pipedFrom.length === 0) {
		// `npm run build` failure
		console.error(error);
	} else {
		// `head -n 2` failure
		console.error(error);
		// `npm run build` output
		console.error(error.pipedFrom[0].stdout);
	}

	throw error;
}
```

## Series of subprocesses

```js
await execa`npm run build`
	.pipe`sort`
	.pipe`head -n 2`;
```

## 1 source, multiple destinations

```js
const subprocess = execa`npm run build`;
const [sortedResult, truncatedResult] = await Promise.all([
	subprocess.pipe`sort`,
	subprocess.pipe`head -n 2`,
]);
```

## Multiple sources, 1 destination

```js
const destination = execa`./log-remotely.js`;
await Promise.all([
	execa`npm run build`.pipe(destination),
	execa`npm run test`.pipe(destination),
]);
```

## Source file descriptor

By default, the source's [`stdout`](api.md#subprocessstdout) is used, but this can be changed using the [`from`](api.md#pipeoptionsfrom) piping option.

```js
await execa`npm run build`
	.pipe({from: 'stderr'})`head -n 2`;
```

## Destination file descriptor

By default, the destination's [`stdin`](api.md#subprocessstdin) is used, but this can be changed using the [`to`](api.md#pipeoptionsto) piping option.

```js
await execa`npm run build`
	.pipe({to: 'fd3'})`./log-remotely.js`;
```

## Unpipe

Piping can be stopped using the [`unpipeSignal`](api.md#pipeoptionsunpipesignal) piping option.

The [`subprocess.pipe()`](api.md#subprocesspipefile-arguments-options) method will be rejected with a cancelation error. However, each subprocess will keep running.

```js
const abortController = new AbortController();

process.on('SIGUSR1', () => {
	abortController.abort();
});

// If the process receives SIGUSR1, `npm run build` stopped being logged remotely.
// However, it keeps running successfully.
try {
	await execa`npm run build`
		.pipe({unpipeSignal: abortController.signal})`./log-remotely.js`;
} catch (error) {
	if (!abortController.signal.aborted) {
		throw error;
	}
}
```

<hr>

[**Next**: ⏳️ Streams](streams.md)\
[**Previous**: 🧙 Transforms](transform.md)\
[**Top**: Table of contents](../readme.md#documentation)
