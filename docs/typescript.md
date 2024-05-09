<picture>
	<source media="(prefers-color-scheme: dark)" srcset="../media/logo_dark.svg">
	<img alt="execa logo" src="../media/logo.svg" width="400">
</picture>
<br>

# 🤓 TypeScript

## Available types

The following types can be imported: [`ResultPromise`](api.md#return-value), [`Subprocess`](api.md#subprocess), [`Result`](api.md#result), [`ExecaError`](api.md#execaerror), [`Options`](api.md#options), [`StdinOption`](api.md#optionsstdin) and [`StdoutStderrOption`](api.md#optionsstdout).

```ts
import {
	execa,
	ExecaError,
	type ResultPromise,
	type Result,
	type Options,
	type StdinOption,
	type StdoutStderrOption,
} from 'execa';

const options: Options = {
	stdin: 'inherit' satisfies StdinOption,
	stdout: 'pipe' satisfies StdoutStderrOption,
	stderr: 'pipe' satisfies StdoutStderrOption,
	timeout: 1000,
};

try {
	const subprocess: ResultPromise = execa(options)`npm run build`;
	const result: Result = await subprocess;
	console.log(result.stdout);
} catch (error) {
	if (error instanceof ExecaError) {
		console.error(error);
	}
}
```

## Synchronous execution

Their [synchronous](#synchronous-execution) counterparts are [`SyncResult`](api.md#result), [`ExecaSyncError`](api.md#execasyncerror), [`SyncOptions`](api.md#options), [`StdinSyncOption`](api.md#optionsstdin) and [`StdoutStderrSyncOption`](api.md#optionsstdout).

```ts
import {
	execaSync,
	ExecaSyncError,
	type SyncResult,
	type SyncOptions,
	type StdinSyncOption,
	type StdoutStderrSyncOption,
} from 'execa';

const options: SyncOptions = {
	stdin: 'inherit' satisfies StdinSyncOption,
	stdout: 'pipe' satisfies StdoutStderrSyncOption,
	stderr: 'pipe' satisfies StdoutStderrSyncOption,
	timeout: 1000,
};

try {
	const result: SyncResult = execaSync(options)`npm run build`;
	console.log(result.stdout);
} catch (error) {
	if (error instanceof ExecaSyncError) {
		console.error(error);
	}
}
```

## Type inference

The above examples demonstrate those types. However, types are automatically inferred. Therefore, explicit types are only needed when defining functions that take those values as parameters.

```ts
import {
	execa,
	ExecaError,
	type Result,
} from 'execa';

const printResultStdout = (result: Result) => {
	console.log('Stdout', result.stdout);
};

const options = {
	stdin: 'inherit',
	stdout: 'pipe',
	stderr: 'pipe',
	timeout: 1000,
} as const;

try {
	const subprocess = execa(options)`npm run build`;
	const result = await subprocess;
	printResultStdout(result);
} catch (error) {
	if (error instanceof ExecaError) {
		console.error(error);
	}
}
```

## Troubleshooting

### ES modules

This package uses pure ES modules. Therefore the TypeScript's `--module` compiler option must be set to [`nodenext`](https://www.typescriptlang.org/docs/handbook/modules/reference.html#node16-nodenext) or [`preserve`](https://www.typescriptlang.org/docs/handbook/modules/reference.html#preserve). [More info.](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)

Otherwise, transpilation will work, but running the transpiled file will throw the following runtime error:

```
Error [ERR_REQUIRE_ESM]: require() of ES Module ... not supported.
```

Or:

```
ReferenceError: exports is not defined in ES module scope
```

### Strict unions

Several options are typed as unions. For example, the [`serialization`](api.md#optionsserialization) option's type is `'advanced' | 'json'`, not `string`. Therefore the following example fails:

```ts
import {execa} from 'execa';

// Type error: "No overload matches this call"
const spawnSubprocess = (serialization: string) => execa({serialization})`npm run build`;

// Without `as const`, `options.serialization` is typed as `string`, not `'json'`
const options = {serialization: 'json'};
// Type error: "No overload matches this call"
await execa(options)`npm run build`;
```

But this works:

```ts
import {execa, type Options} from 'execa';

const spawnSubprocess = (serialization: Options['serialization']) => execa({serialization})`npm run build`;

const options = {serialization: 'json'} as const;
await execa(options)`npm run build`;
```

<hr>

[**Next**: 📔 API reference](api.md)\
[**Previous**: 🔍 Differences with Bash and zx](bash.md)\
[**Top**: Table of contents](../readme.md#documentation)
