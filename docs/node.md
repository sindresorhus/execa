<picture>
	<source media="(prefers-color-scheme: dark)" srcset="../media/logo_dark.svg">
	<img alt="execa logo" src="../media/logo.svg" width="400">
</picture>
<br>

# 🐢 Node.js files

## Run Node.js files

```js
import {execaNode, execa} from 'execa';

await execaNode('file.js');
// Is the same as:
await execa('file.js', {node: true});
// Or:
await execa('node', ['file.js']);
```

## Node.js [CLI flags](https://nodejs.org/api/cli.html#options)

```js
await execaNode('file.js', {nodeOptions: ['--no-warnings']});
```

## Node.js version

[`get-node`](https://github.com/ehmicky/get-node) and the [`nodePath`](api.md#optionsnodepath) option can be used to run a specific Node.js version. Alternatively, [`nvexeca`](https://github.com/ehmicky/nvexeca) or [`nve`](https://github.com/ehmicky/nve) can be used.

```js
import {execaNode} from 'execa';
import getNode from 'get-node';

const {path: nodePath} = await getNode('16.2.0');
await execaNode('file.js', {nodePath});
```

<hr>

[**Next**: 🌐 Environment](environment.md)\
[**Previous**: 📜 Scripts](scripts.md)\
[**Top**: Table of contents](../readme.md#documentation)
