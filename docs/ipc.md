<picture>
	<source media="(prefers-color-scheme: dark)" srcset="../media/logo_dark.svg">
	<img alt="execa logo" src="../media/logo.svg" width="400">
</picture>
<br>

# 📞 Inter-process communication

## Exchanging messages

When the [`ipc`](../readme.md#optionsipc) option is `true`, the current process and subprocess can exchange messages. This only works if the subprocess is a Node.js file.

The `ipc` option defaults to `true` when using [`execaNode()`](node.md#run-nodejs-files) or the [`node`](node.md#run-nodejs-files) option.

The current process sends messages with [`subprocess.send(message)`](../readme.md#subprocesssendmessage) and receives them with [`subprocess.on('message', (message) => {})`](../readme.md#subprocessonmessage-message--void). The subprocess sends messages with [`process.send(message)`](https://nodejs.org/api/process.html#processsendmessage-sendhandle-options-callback) and [`process.on('message', (message) => {})`](https://nodejs.org/api/process.html#event-message).

More info on [sending](https://nodejs.org/api/child_process.html#subprocesssendmessage-sendhandle-options-callback) and [receiving](https://nodejs.org/api/child_process.html#event-message) messages.

```js
// parent.js
import {execaNode} from 'execa';

const subprocess = execaNode`child.js`;
subprocess.on('message', messageFromChild => {
	/* ... */
});
subprocess.send('Hello from parent');
```

```js
// child.js
import process from 'node:process';

process.on('message', messageFromParent => {
	/* ... */
});
process.send('Hello from child');
```

## Message type

By default, messages are serialized using [`structuredClone()`](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm). This supports most types including objects, arrays, `Error`, `Date`, `RegExp`, `Map`, `Set`, `bigint`, `Uint8Array`, and circular references. This throws when passing functions, symbols or promises (including inside an object or array).

To limit messages to JSON instead, the [`serialization`](../readme.md#optionsserialization) option can be set to `'json'`.

```js
const subprocess = execaNode({serialization: 'json'})`child.js`;
```

<hr>

[**Next**: 🐛 Debugging](debugging.md)\
[**Previous**: ⏳️ Streams](streams.md)\
[**Top**: Table of contents](../readme.md#documentation)
