import {createWriteStream} from 'node:fs';
import type {Readable} from 'node:stream';
import type {ReadableStream} from 'node:stream/web';
import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	$,
	type Result,
	type Message,
} from '../index.js';

const fileUrl = new URL('file:///test');
const stringArray = ['foo', 'bar'] as const;
const pipeOptions = {from: 'stderr', to: 'fd3', all: true} as const;

const subprocess = execa('unicorns', {all: true});
const bufferSubprocess = execa('unicorns', {encoding: 'buffer', all: true});
const scriptSubprocess = $`unicorns`;

const bufferResult = await bufferSubprocess;
type BufferExecaReturnValue = typeof bufferResult;
type EmptyExecaReturnValue = Result<{}>;
type ShortcutExecaReturnValue = Result<typeof pipeOptions>;

expectTypeOf(await subprocess.pipe(subprocess)).not.toBe<BufferExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe(subprocess)).not.toBe<BufferExecaReturnValue>();
expectTypeOf(await subprocess.pipe(bufferSubprocess)).toBe<BufferExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe(bufferSubprocess)).toBe<BufferExecaReturnValue>();
expectTypeOf(await subprocess.pipe(bufferSubprocess, pipeOptions)).toBe<BufferExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe(bufferSubprocess, pipeOptions)).toBe<BufferExecaReturnValue>();

expectTypeOf(await subprocess.pipe`stdin`).toBe<EmptyExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe`stdin`).toBe<EmptyExecaReturnValue>();
expectTypeOf(await subprocess.pipe(pipeOptions)`stdin`).toBe<ShortcutExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe(pipeOptions)`stdin`).toBe<ShortcutExecaReturnValue>();

expectTypeOf(await subprocess.pipe('stdin')).toBe<EmptyExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe('stdin')).toBe<EmptyExecaReturnValue>();
expectTypeOf(await subprocess.pipe('stdin', pipeOptions)).toBe<ShortcutExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe('stdin', pipeOptions)).toBe<ShortcutExecaReturnValue>();

expectTypeOf(await subprocess.pipe(subprocess).pipe(bufferSubprocess)).toBe<BufferExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe(subprocess).pipe(bufferSubprocess)).toBe<BufferExecaReturnValue>();
expectTypeOf(await subprocess.pipe(subprocess, pipeOptions).pipe(bufferSubprocess)).toBe<BufferExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe(subprocess, pipeOptions).pipe(bufferSubprocess)).toBe<BufferExecaReturnValue>();
expectTypeOf(await subprocess.pipe(subprocess).pipe(bufferSubprocess, pipeOptions)).toBe<BufferExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe(subprocess).pipe(bufferSubprocess, pipeOptions)).toBe<BufferExecaReturnValue>();

expectTypeOf(await subprocess.pipe(subprocess).pipe`stdin`).toBe<EmptyExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe(subprocess).pipe`stdin`).toBe<EmptyExecaReturnValue>();
expectTypeOf(await subprocess.pipe(subprocess, pipeOptions).pipe`stdin`).toBe<EmptyExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe(subprocess, pipeOptions).pipe`stdin`).toBe<EmptyExecaReturnValue>();
expectTypeOf(await subprocess.pipe(subprocess).pipe(pipeOptions)`stdin`).toBe<ShortcutExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe(subprocess).pipe(pipeOptions)`stdin`).toBe<ShortcutExecaReturnValue>();

expectTypeOf(await subprocess.pipe(subprocess).pipe('stdin')).toBe<EmptyExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe(subprocess).pipe('stdin')).toBe<EmptyExecaReturnValue>();
expectTypeOf(await subprocess.pipe(subprocess, pipeOptions).pipe('stdin')).toBe<EmptyExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe(subprocess, pipeOptions).pipe('stdin')).toBe<EmptyExecaReturnValue>();
expectTypeOf(await subprocess.pipe(subprocess).pipe('stdin', pipeOptions)).toBe<ShortcutExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe(subprocess).pipe('stdin', pipeOptions)).toBe<ShortcutExecaReturnValue>();

expectTypeOf(await subprocess.pipe`stdin`.pipe(bufferSubprocess)).toBe<BufferExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe`stdin`.pipe(bufferSubprocess)).toBe<BufferExecaReturnValue>();
expectTypeOf(await subprocess.pipe(pipeOptions)`stdin`.pipe(bufferSubprocess)).toBe<BufferExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe(pipeOptions)`stdin`.pipe(bufferSubprocess)).toBe<BufferExecaReturnValue>();
expectTypeOf(await subprocess.pipe`stdin`.pipe(bufferSubprocess, pipeOptions)).toBe<BufferExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe`stdin`.pipe(bufferSubprocess, pipeOptions)).toBe<BufferExecaReturnValue>();

expectTypeOf(await subprocess.pipe`stdin`.pipe`stdin`).toBe<EmptyExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe`stdin`.pipe`stdin`).toBe<EmptyExecaReturnValue>();
expectTypeOf(await subprocess.pipe(pipeOptions)`stdin`.pipe`stdin`).toBe<EmptyExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe(pipeOptions)`stdin`.pipe`stdin`).toBe<EmptyExecaReturnValue>();
expectTypeOf(await subprocess.pipe`stdin`.pipe(pipeOptions)`stdin`).toBe<ShortcutExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe`stdin`.pipe(pipeOptions)`stdin`).toBe<ShortcutExecaReturnValue>();

expectTypeOf(await subprocess.pipe`stdin`.pipe('stdin')).toBe<EmptyExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe`stdin`.pipe('stdin')).toBe<EmptyExecaReturnValue>();
expectTypeOf(await subprocess.pipe(pipeOptions)`stdin`.pipe('stdin')).toBe<EmptyExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe(pipeOptions)`stdin`.pipe('stdin')).toBe<EmptyExecaReturnValue>();
expectTypeOf(await subprocess.pipe`stdin`.pipe('stdin', pipeOptions)).toBe<ShortcutExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe`stdin`.pipe('stdin', pipeOptions)).toBe<ShortcutExecaReturnValue>();

expectTypeOf(await subprocess.pipe('pipe').pipe(bufferSubprocess)).toBe<BufferExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe('pipe').pipe(bufferSubprocess)).toBe<BufferExecaReturnValue>();
expectTypeOf(await subprocess.pipe('pipe', pipeOptions).pipe(bufferSubprocess)).toBe<BufferExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe('pipe', pipeOptions).pipe(bufferSubprocess)).toBe<BufferExecaReturnValue>();
expectTypeOf(await subprocess.pipe('pipe').pipe(bufferSubprocess, pipeOptions)).toBe<BufferExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe('pipe').pipe(bufferSubprocess, pipeOptions)).toBe<BufferExecaReturnValue>();

expectTypeOf(await subprocess.pipe('pipe').pipe`stdin`).toBe<EmptyExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe('pipe').pipe`stdin`).toBe<EmptyExecaReturnValue>();
expectTypeOf(await subprocess.pipe('pipe', pipeOptions).pipe`stdin`).toBe<EmptyExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe('pipe', pipeOptions).pipe`stdin`).toBe<EmptyExecaReturnValue>();
expectTypeOf(await subprocess.pipe('pipe').pipe(pipeOptions)`stdin`).toBe<ShortcutExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe('pipe').pipe(pipeOptions)`stdin`).toBe<ShortcutExecaReturnValue>();

expectTypeOf(await subprocess.pipe('pipe').pipe('stdin')).toBe<EmptyExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe('pipe').pipe('stdin')).toBe<EmptyExecaReturnValue>();
expectTypeOf(await subprocess.pipe('pipe', pipeOptions).pipe('stdin')).toBe<EmptyExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe('pipe', pipeOptions).pipe('stdin')).toBe<EmptyExecaReturnValue>();
expectTypeOf(await subprocess.pipe('pipe').pipe('stdin', pipeOptions)).toBe<ShortcutExecaReturnValue>();
expectTypeOf(await scriptSubprocess.pipe('pipe').pipe('stdin', pipeOptions)).toBe<ShortcutExecaReturnValue>();

await subprocess.pipe(bufferSubprocess, {});
await scriptSubprocess.pipe(bufferSubprocess, {});
await subprocess.pipe({})`stdin`;
await scriptSubprocess.pipe({})`stdin`;
await subprocess.pipe('stdin', {});
await scriptSubprocess.pipe('stdin', {});

expectError(subprocess.pipe(bufferSubprocess).stdout);
expectError(scriptSubprocess.pipe(bufferSubprocess).stdout);
expectError(subprocess.pipe`stdin`.stdout);
expectError(scriptSubprocess.pipe`stdin`.stdout);
expectError(subprocess.pipe('stdin').stdout);
expectError(scriptSubprocess.pipe('stdin').stdout);

expectError(await subprocess.pipe({})({}));
expectError(await scriptSubprocess.pipe({})({}));
expectError(await subprocess.pipe({})(subprocess));
expectError(await scriptSubprocess.pipe({})(subprocess));
expectError(await subprocess.pipe({})('stdin'));
expectError(await scriptSubprocess.pipe({})('stdin'));

expectError(subprocess.pipe(createWriteStream('output.txt')));
expectError(scriptSubprocess.pipe(createWriteStream('output.txt')));
expectError(subprocess.pipe(false));
expectError(scriptSubprocess.pipe(false));

expectError(subprocess.pipe(bufferSubprocess, 'stdout'));
expectError(scriptSubprocess.pipe(bufferSubprocess, 'stdout'));
expectError(subprocess.pipe('stdout')`stdin`);
expectError(scriptSubprocess.pipe('stdout')`stdin`);

await subprocess.pipe(bufferSubprocess, {from: 'stdout'});
await scriptSubprocess.pipe(bufferSubprocess, {from: 'stdout'});
await subprocess.pipe({from: 'stdout'})`stdin`;
await scriptSubprocess.pipe({from: 'stdout'})`stdin`;
await subprocess.pipe('stdin', {from: 'stdout'});
await scriptSubprocess.pipe('stdin', {from: 'stdout'});

await subprocess.pipe(bufferSubprocess, {from: 'stderr'});
await scriptSubprocess.pipe(bufferSubprocess, {from: 'stderr'});
await subprocess.pipe({from: 'stderr'})`stdin`;
await scriptSubprocess.pipe({from: 'stderr'})`stdin`;
await subprocess.pipe('stdin', {from: 'stderr'});
await scriptSubprocess.pipe('stdin', {from: 'stderr'});

await subprocess.pipe(bufferSubprocess, {from: 'all'});
await scriptSubprocess.pipe(bufferSubprocess, {from: 'all'});
await subprocess.pipe({from: 'all'})`stdin`;
await scriptSubprocess.pipe({from: 'all'})`stdin`;
await subprocess.pipe('stdin', {from: 'all'});
await scriptSubprocess.pipe('stdin', {from: 'all'});

await subprocess.pipe(bufferSubprocess, {from: 'fd3'});
await scriptSubprocess.pipe(bufferSubprocess, {from: 'fd3'});
await subprocess.pipe({from: 'fd3'})`stdin`;
await scriptSubprocess.pipe({from: 'fd3'})`stdin`;
await subprocess.pipe('stdin', {from: 'fd3'});
await scriptSubprocess.pipe('stdin', {from: 'fd3'});

expectError(subprocess.pipe(bufferSubprocess, {from: 'stdin'}));
expectError(scriptSubprocess.pipe(bufferSubprocess, {from: 'stdin'}));
expectError(subprocess.pipe({from: 'stdin'})`stdin`);
expectError(scriptSubprocess.pipe({from: 'stdin'})`stdin`);
expectError(subprocess.pipe('stdin', {from: 'stdin'}));
expectError(scriptSubprocess.pipe('stdin', {from: 'stdin'}));

await subprocess.pipe(bufferSubprocess, {to: 'stdin'});
await scriptSubprocess.pipe(bufferSubprocess, {to: 'stdin'});
await subprocess.pipe({to: 'stdin'})`stdin`;
await scriptSubprocess.pipe({to: 'stdin'})`stdin`;
await subprocess.pipe('stdin', {to: 'stdin'});
await scriptSubprocess.pipe('stdin', {to: 'stdin'});

await subprocess.pipe(bufferSubprocess, {to: 'fd3'});
await scriptSubprocess.pipe(bufferSubprocess, {to: 'fd3'});
await subprocess.pipe({to: 'fd3'})`stdin`;
await scriptSubprocess.pipe({to: 'fd3'})`stdin`;
await subprocess.pipe('stdin', {to: 'fd3'});
await scriptSubprocess.pipe('stdin', {to: 'fd3'});

expectError(subprocess.pipe(bufferSubprocess, {to: 'stdout'}));
expectError(scriptSubprocess.pipe(bufferSubprocess, {to: 'stdout'}));
expectError(subprocess.pipe({to: 'stdout'})`stdin`);
expectError(scriptSubprocess.pipe({to: 'stdout'})`stdin`);
expectError(subprocess.pipe('stdin', {to: 'stdout'}));
expectError(scriptSubprocess.pipe('stdin', {to: 'stdout'}));

await subprocess.pipe(bufferSubprocess, {unpipeSignal: new AbortController().signal});
await scriptSubprocess.pipe(bufferSubprocess, {unpipeSignal: new AbortController().signal});
await subprocess.pipe({unpipeSignal: new AbortController().signal})`stdin`;
await scriptSubprocess.pipe({unpipeSignal: new AbortController().signal})`stdin`;
await subprocess.pipe('stdin', {unpipeSignal: new AbortController().signal});
await scriptSubprocess.pipe('stdin', {unpipeSignal: new AbortController().signal});
expectError(await subprocess.pipe(bufferSubprocess, {unpipeSignal: true}));
expectError(await scriptSubprocess.pipe(bufferSubprocess, {unpipeSignal: true}));
expectError(await subprocess.pipe({unpipeSignal: true})`stdin`);
expectError(await scriptSubprocess.pipe({unpipeSignal: true})`stdin`);
expectError(await subprocess.pipe('stdin', {unpipeSignal: true}));
expectError(await scriptSubprocess.pipe('stdin', {unpipeSignal: true}));

expectTypeOf(await subprocess.pipe('stdin')).toBe<EmptyExecaReturnValue>();
await subprocess.pipe('stdin');
await subprocess.pipe(fileUrl);
await subprocess.pipe('stdin', []);
await subprocess.pipe('stdin', stringArray);
await subprocess.pipe('stdin', stringArray, {});
await subprocess.pipe('stdin', stringArray, {from: 'stderr', to: 'stdin', all: true});
await subprocess.pipe('stdin', {from: 'stderr'});
await subprocess.pipe('stdin', {to: 'stdin'});
await subprocess.pipe('stdin', {all: true});

expectError(await subprocess.pipe(stringArray));
expectError(await subprocess.pipe('stdin', 'foo'));
expectError(await subprocess.pipe('stdin', [false]));
expectError(await subprocess.pipe('stdin', [], false));
expectError(await subprocess.pipe('stdin', {other: true}));
expectError(await subprocess.pipe('stdin', [], {other: true}));
expectError(await subprocess.pipe('stdin', {from: 'fd'}));
expectError(await subprocess.pipe('stdin', [], {from: 'fd'}));
expectError(await subprocess.pipe('stdin', {from: 'fdNotANumber'}));
expectError(await subprocess.pipe('stdin', [], {from: 'fdNotANumber'}));
expectError(await subprocess.pipe('stdin', {from: 'other'}));
expectError(await subprocess.pipe('stdin', [], {from: 'other'}));
expectError(await subprocess.pipe('stdin', {to: 'fd'}));
expectError(await subprocess.pipe('stdin', [], {to: 'fd'}));
expectError(await subprocess.pipe('stdin', {to: 'fdNotANumber'}));
expectError(await subprocess.pipe('stdin', [], {to: 'fdNotANumber'}));
expectError(await subprocess.pipe('stdin', {to: 'other'}));
expectError(await subprocess.pipe('stdin', [], {to: 'other'}));

const pipeResult = await subprocess.pipe`stdin`;
expectTypeOf(pipeResult.stdout).toBe<string>();
const ignorePipeResult = await subprocess.pipe({stdout: 'ignore'})`stdin`;
expectTypeOf(ignorePipeResult.stdout).toBe<undefined>();

const scriptPipeResult = await scriptSubprocess.pipe`stdin`;
expectTypeOf(scriptPipeResult.stdout).toBe<string>();
const ignoreScriptPipeResult = await scriptSubprocess.pipe({stdout: 'ignore'})`stdin`;
expectTypeOf(ignoreScriptPipeResult.stdout).toBe<undefined>();

const shortcutPipeResult = await subprocess.pipe('stdin');
expectTypeOf(shortcutPipeResult.stdout).toBe<string>();
const ignoreShortcutPipeResult = await subprocess.pipe('stdin', {stdout: 'ignore'});
expectTypeOf(ignoreShortcutPipeResult.stdout).toBe<undefined>();

const scriptShortcutPipeResult = await scriptSubprocess.pipe('stdin');
expectTypeOf(scriptShortcutPipeResult.stdout).toBe<string>();
const ignoreShortcutScriptPipeResult = await scriptSubprocess.pipe('stdin', {stdout: 'ignore'});
expectTypeOf(ignoreShortcutScriptPipeResult.stdout).toBe<undefined>();

const unicornsResult = execaSync('unicorns');
expectError(unicornsResult.pipe);

// The `.pipe()` return value forwards the destination subprocess' iteration, stream conversion and IPC methods.
for await (const pipeLine of subprocess.pipe`stdin`) {
	expectTypeOf(pipeLine).toBe<string>();
}

for await (const pipeLine of subprocess.pipe`stdin`.iterable()) {
	expectTypeOf(pipeLine).toBe<string>();
}

for await (const pipeLine of subprocess.pipe(bufferSubprocess)) {
	expectTypeOf(pipeLine).toBe<Uint8Array>();
}

expectTypeOf(subprocess.pipe`stdin`.readable()).toBe<Readable>();
expectTypeOf(subprocess.pipe`stdin`.readableStream()).toBe<ReadableStream>();

expectTypeOf(subprocess.pipe({all: true})`stdin`.all).toBe<Readable>();
expectTypeOf(subprocess.pipe`stdin`.all).toBe<undefined>();

expectTypeOf(subprocess.pipe`stdin`.sendMessage).toBe<undefined>();
const ipcPipeResult = subprocess.pipe({ipc: true})`stdin`;
expectTypeOf(ipcPipeResult.sendMessage('message')).toBe<Promise<void>>();
expectTypeOf(ipcPipeResult.getOneMessage()).toBe<Promise<Message<'advanced'>>>();
expectTypeOf(ipcPipeResult.getEachMessage()).toBe<AsyncIterableIterator<Message<'advanced'>>>();

// `writable()`, `duplex()`, `writableStream()` and `transformStream()` write to the destination's `stdin`, which is already piped from the source, so they are not forwarded.
expectError(subprocess.pipe`stdin`.writable());
expectError(subprocess.pipe`stdin`.duplex());
expectError(subprocess.pipe`stdin`.writableStream());
expectError(subprocess.pipe`stdin`.transformStream());
