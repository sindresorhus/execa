<picture>
	<source media="(prefers-color-scheme: dark)" srcset="../media/logo_dark.svg">
	<img alt="execa logo" src="../media/logo.svg" width="400">
</picture>
<br>

# 🌐 Environment

## Current directory

The [current directory](https://en.wikipedia.org/wiki/Working_directory) when running the command can be set with the [`cwd`](api.md#optionscwd) option.

```js
import {execa} from 'execa';

await execa({cwd: '/path/to/cwd'})`npm run build`;
```

And be retrieved with the [`result.cwd`](api.md#resultcwd) property.

```js
const {cwd} = await execa`npm run build`;
```

## Local binaries

Package managers like `npm` install local binaries in `./node_modules/.bin`.

```sh
$ npm install -D eslint
```

```js
await execa('./node_modules/.bin/eslint');
```

The [`preferLocal`](api.md#optionspreferlocal) option can be used to execute those local binaries.

```js
await execa({preferLocal: true})`eslint`;
```

Those are searched in the current or any parent directory. The [`localDir`](api.md#optionslocaldir) option can select a different directory.

```js
await execa({preferLocal: true, localDir: '/path/to/dir'})`eslint`;
```

## Current package's binary

Execa can be combined with [`get-bin-path`](https://github.com/ehmicky/get-bin-path) to test the current package's binary. As opposed to hard-coding the path to the binary, this validates that the `package.json` [`bin`](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#bin) field is correctly set up.

```js
import {execa} from 'execa';
import {getBinPath} from 'get-bin-path';

const binPath = await getBinPath();
await execa(binPath);
```

## Background subprocess

When the [`detached`](api.md#optionsdetached) option is `true`, the subprocess [runs independently](https://en.wikipedia.org/wiki/Background_process) from the current process.

Specific behavior depends on the platform. [More info.](https://nodejs.org/api/child_process.html#child_process_options_detached)

```js
await execa({detached: true})`npm run start`;
```

<hr>

[**Next**: ❌ Errors](errors.md)\
[**Previous**: 🐢 Node.js files](node.md)\
[**Top**: Table of contents](../readme.md#documentation)
