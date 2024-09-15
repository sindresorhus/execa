<picture>
	<source media="(prefers-color-scheme: dark)" srcset="../media/logo_dark.svg">
	<img alt="execa logo" src="../media/logo.svg" width="400">
</picture>
<br>

# 🐭 Small packages

## `nano-spawn`

Execa aims to be the best way to run commands on Node.js. It is [very widely used](https://github.com/sindresorhus/execa/network/dependents), [battle-tested](https://github.com/sindresorhus/execa/graphs/contributors) and has a bunch of [features](../readme.md#features).

However, this means it has a relatively big package size: [![Install size](https://packagephobia.com/badge?p=execa)](https://packagephobia.com/result?p=execa). This should not be a problem in a server-side context, such as a script, a server, or an app. But you might be in an environment requiring small packages, such as a library or a serverless function.

If so, you can use [nano-spawn](https://github.com/sindresorhus/nano-spawn). It is similar, is maintained by the [same people](https://github.com/sindresorhus/nano-spawn#maintainers), has no dependencies, and a smaller package size: ![npm package minzipped size](https://img.shields.io/bundlejs/size/nano-spawn) [![Install size](https://packagephobia.com/badge?p=nano-spawn)](https://packagephobia.com/result?p=nano-spawn).

On the other hand, please note `nano-spawn` lacks many features from Execa: [scripts](scripts.md), [template string syntax](execution.md#template-string-syntax), [synchronous execution](execution.md#synchronous-execution), [file input/output](output.md#file-output), [binary input/output](binary.md), [advanced piping](pipe.md), [verbose mode](debugging.md#verbose-mode), [graceful](termination.md#graceful-termination) or [forceful termination](termination.md#forceful-termination), [IPC](ipc.md), [shebangs on Windows](windows.md), [and much more](https://github.com/sindresorhus/nano-spawn/issues/14).

```js
import spawn from 'nano-spawn';

const result = await spawn('npm', ['run', 'build']);
```

### `node:child_process`

Both Execa and nano-spawn are built on top of the [`node:child_process`](https://nodejs.org/api/child_process.html) core module.

If you'd prefer avoiding adding any dependency, you may use `node:child_process` directly. However, you might miss some basic [features](https://github.com/sindresorhus/nano-spawn#features) that both Execa and nano-spawn provide: [proper error handling](https://github.com/sindresorhus/nano-spawn#subprocesserror), [full Windows support](https://github.com/sindresorhus/nano-spawn#windows-support), [local binaries](https://github.com/sindresorhus/nano-spawn#optionspreferlocal), [piping](https://github.com/sindresorhus/nano-spawn#subprocesspipefile-arguments-options), [lines iteration](https://github.com/sindresorhus/nano-spawn#subprocesssymbolasynciterator), [interleaved output](https://github.com/sindresorhus/nano-spawn#resultoutput), [and more](https://github.com/sindresorhus/nano-spawn#features).

```js
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

const pExecFile = promisify(execFile);

const result = await pExecFile('npm', ['run', 'build']);
```

<hr>

[**Next**: 🤓 TypeScript](typescript.md)\
[**Previous**: 🔍 Differences with Bash and zx](bash.md)\
[**Top**: Table of contents](../readme.md#documentation)
