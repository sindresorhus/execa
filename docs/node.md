<picture>
	<source media="(prefers-color-scheme: dark)" srcset="../media/logo_dark.svg">
	<img alt="execa logo" src="../media/logo.svg" width="400">
</picture>
<br>

# 🐢 Node.js files

## Run Node.js files

```js
import {execaNode, execa} from 'execa';

await execaNode`file.js argument`;
// Is the same as:
await execa({node: true})`file.js argument`;
// Or:
await execa`node file.js argument`;
```

## Node.js CLI flags

When using the [`node`](api.md#optionsnode) option or [`execaNode()`](api.md#execanodescriptpath-arguments-options), the current Node.js [CLI flags](https://nodejs.org/api/cli.html#options) are inherited. For example, the subprocess will use [`--allow-fs-read`](https://nodejs.org/api/cli.html#--allow-fs-read) if the current process does.

The [`nodeOptions`](api.md#optionsnodeoptions) option can be used to set different CLI flags.

```js
await execaNode({nodeOptions: ['--allow-fs-write']})`file.js argument`;
```

## Node.js version

The same applies to the Node.js version, which is inherited too.

[`get-node`](https://github.com/ehmicky/get-node) and the [`nodePath`](api.md#optionsnodepath) option can be used to run a specific Node.js version. Alternatively, [`nvexeca`](https://github.com/ehmicky/nvexeca) or [`nve`](https://github.com/ehmicky/nve) can be used.

```js
import {execaNode} from 'execa';
import getNode from 'get-node';

const {path: nodePath} = await getNode('16.2.0');
await execaNode({nodePath})`file.js argument`;
```

<hr>

[**Next**: 🌐 Environment](environment.md)\
[**Previous**: 📜 Scripts](scripts.md)\
[**Top**: Table of contents](../readme.md#documentation)
