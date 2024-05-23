<picture>
	<source media="(prefers-color-scheme: dark)" srcset="../media/logo_dark.svg">
	<img alt="execa logo" src="../media/logo.svg" width="400">
</picture>
<br>

# 📞 Inter-process communication

## Exchanging messages

When the [`ipc`](api.md#optionsipc) option is `true`, the current process and subprocess can exchange messages. This only works if the subprocess is a [Node.js file](node.md).

The `ipc` option defaults to `true` when using [`execaNode()`](node.md#run-nodejs-files) or the [`node`](node.md#run-nodejs-files) option.

The current process sends messages with [`subprocess.sendMessage(message)`](api.md#subprocesssendmessagemessage) and receives them with [`subprocess.getOneMessage()`](api.md#subprocessgetonemessagegetonemessageoptions).

The subprocess uses [`sendMessage(message)`](api.md#sendmessagemessage) and [`getOneMessage()`](api.md#getonemessagegetonemessageoptions). Those are the same methods, but imported directly from the `'execa'` module.

```js
// parent.js
import {execaNode} from 'execa';

const subprocess = execaNode`child.js`;
await subprocess.sendMessage('Hello from parent');
const message = await subprocess.getOneMessage();
console.log(message); // 'Hello from child'
```

```js
// child.js
import {getOneMessage, sendMessage} from 'execa';

const message = await getOneMessage(); // 'Hello from parent'
const newMessage = message.replace('parent', 'child'); // 'Hello from child'
await sendMessage(newMessage);
```

## Listening to messages

The methods described above read a single message. On the other hand, [`subprocess.getEachMessage()`](api.md#subprocessgeteachmessage) and [`getEachMessage()`](api.md#geteachmessage) return an [async iterable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_async_iterator_and_async_iterable_protocols). This should be preferred when listening to multiple messages.

[`subprocess.getEachMessage()`](api.md#subprocessgeteachmessage) waits for the subprocess to end (even when using [`break`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/break) or [`return`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/return)). It throws if the subprocess [fails](api.md#result). This means you do not need to `await` the subprocess' [promise](execution.md#result).

```js
// parent.js
import {execaNode} from 'execa';

const subprocess = execaNode`child.js`;
await subprocess.sendMessage(0);

// This loop ends when the subprocess exits.
// It throws if the subprocess fails.
for await (const message of subprocess.getEachMessage()) {
	console.log(message); // 1, 3, 5, 7, 9
	await subprocess.sendMessage(message + 1);
}
```

```js
// child.js
import {sendMessage, getEachMessage} from 'execa';

// The subprocess exits when hitting `break`
for await (const message of getEachMessage()) {
	if (message === 10) {
		break;
	}

	console.log(message); // 0, 2, 4, 6, 8
	await sendMessage(message + 1);
}
```

## Filter messages

```js
import {getOneMessage} from 'execa';

const startMessage = await getOneMessage({
	filter: message => message.type === 'start',
});
```

```js
import {getEachMessage} from 'execa';

for await (const message of getEachMessage()) {
	if (message.type === 'start') {
		// ...
	}
}
```

## Retrieve all messages

The [`result.ipcOutput`](api.md#resultipcoutput) array contains all the messages sent by the subprocess. In many situations, this is simpler than using [`subprocess.getOneMessage()`](api.md#subprocessgetonemessagegetonemessageoptions) and [`subprocess.getEachMessage()`](api.md#subprocessgeteachmessage).

```js
// main.js
import {execaNode} from 'execa';

const {ipcOutput} = await execaNode`build.js`;
console.log(ipcOutput[0]); // {kind: 'start', timestamp: date}
console.log(ipcOutput[1]); // {kind: 'stop', timestamp: date}
```

```js
// build.js
import {sendMessage} from 'execa';

await sendMessage({kind: 'start', timestamp: new Date()});
await runBuild();
await sendMessage({kind: 'stop', timestamp: new Date()});
```

## Send an initial message

The [`ipcInput`](api.md#optionsipcinput) option sends a message to the [Node.js subprocess](node.md) when it starts.

```js
// main.js
import {execaNode} from 'execa';

const ipcInput = [
	{task: 'lint', ignore: /test\.js/},
	{task: 'copy', files: new Set(['main.js', 'index.js']),
}];
await execaNode({ipcInput})`build.js`;
```

```js
// build.js
import {getOneMessage} from 'execa';

const ipcInput = await getOneMessage();
```

## Message type

By default, messages are serialized using [`structuredClone()`](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm). This supports most types including objects, arrays, `Error`, `Date`, `RegExp`, `Map`, `Set`, `bigint`, `Uint8Array`, and circular references. This throws when passing functions, symbols or promises (including inside an object or array).

To limit messages to JSON instead, the [`serialization`](api.md#optionsserialization) option can be set to `'json'`.

```js
import {execaNode} from 'execa';

const subprocess = execaNode({serialization: 'json'})`child.js`;
```

## Messages order

The messages are always received in the same order they were sent. Even when sent all at once.

```js
import {sendMessage} from 'execa';

await Promise.all([
	sendMessage('first'),
	sendMessage('second'),
	sendMessage('third'),
]);
```

## Debugging

When the [`verbose`](api.md#optionsverbose) option is `'full'`, the IPC messages sent by the subprocess to the current process are [printed on the console](debugging.md#full-mode).

Also, when the subprocess [failed](errors.md#subprocess-failure), [`error.ipcOutput`](api.md) contains all the messages sent by the subprocess. Those are also shown at the end of the [error message](errors.md#error-message).

<hr>

[**Next**: 🐛 Debugging](debugging.md)\
[**Previous**: ⏳️ Streams](streams.md)\
[**Top**: Table of contents](../readme.md#documentation)
