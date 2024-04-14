import {createWriteStream} from 'node:fs';
import {expectType, expectNotType, expectError} from 'tsd';
import {execa, execaSync, $, type ExecaResult} from '../index.js';

const fileUrl = new URL('file:///test');
const stringArray = ['foo', 'bar'] as const;
const pipeOptions = {from: 'stderr', to: 'fd3', all: true} as const;

const execaPromise = execa('unicorns', {all: true});
const execaBufferPromise = execa('unicorns', {encoding: 'buffer', all: true});
const scriptPromise = $`unicorns`;

const bufferResult = await execaBufferPromise;
type BufferExecaReturnValue = typeof bufferResult;
type EmptyExecaReturnValue = ExecaResult<{}>;
type ShortcutExecaReturnValue = ExecaResult<typeof pipeOptions>;

expectNotType<BufferExecaReturnValue>(await execaPromise.pipe(execaPromise));
expectNotType<BufferExecaReturnValue>(await scriptPromise.pipe(execaPromise));
expectType<BufferExecaReturnValue>(await execaPromise.pipe(execaBufferPromise));
expectType<BufferExecaReturnValue>(await scriptPromise.pipe(execaBufferPromise));
expectType<BufferExecaReturnValue>(await execaPromise.pipe(execaBufferPromise, pipeOptions));
expectType<BufferExecaReturnValue>(await scriptPromise.pipe(execaBufferPromise, pipeOptions));

expectType<EmptyExecaReturnValue>(await execaPromise.pipe`stdin`);
expectType<EmptyExecaReturnValue>(await scriptPromise.pipe`stdin`);
expectType<ShortcutExecaReturnValue>(await execaPromise.pipe(pipeOptions)`stdin`);
expectType<ShortcutExecaReturnValue>(await scriptPromise.pipe(pipeOptions)`stdin`);

expectType<EmptyExecaReturnValue>(await execaPromise.pipe('stdin'));
expectType<EmptyExecaReturnValue>(await scriptPromise.pipe('stdin'));
expectType<ShortcutExecaReturnValue>(await execaPromise.pipe('stdin', pipeOptions));
expectType<ShortcutExecaReturnValue>(await scriptPromise.pipe('stdin', pipeOptions));

expectType<BufferExecaReturnValue>(await execaPromise.pipe(execaPromise).pipe(execaBufferPromise));
expectType<BufferExecaReturnValue>(await scriptPromise.pipe(execaPromise).pipe(execaBufferPromise));
expectType<BufferExecaReturnValue>(await execaPromise.pipe(execaPromise, pipeOptions).pipe(execaBufferPromise));
expectType<BufferExecaReturnValue>(await scriptPromise.pipe(execaPromise, pipeOptions).pipe(execaBufferPromise));
expectType<BufferExecaReturnValue>(await execaPromise.pipe(execaPromise).pipe(execaBufferPromise, pipeOptions));
expectType<BufferExecaReturnValue>(await scriptPromise.pipe(execaPromise).pipe(execaBufferPromise, pipeOptions));

expectType<EmptyExecaReturnValue>(await execaPromise.pipe(execaPromise).pipe`stdin`);
expectType<EmptyExecaReturnValue>(await scriptPromise.pipe(execaPromise).pipe`stdin`);
expectType<EmptyExecaReturnValue>(await execaPromise.pipe(execaPromise, pipeOptions).pipe`stdin`);
expectType<EmptyExecaReturnValue>(await scriptPromise.pipe(execaPromise, pipeOptions).pipe`stdin`);
expectType<ShortcutExecaReturnValue>(await execaPromise.pipe(execaPromise).pipe(pipeOptions)`stdin`);
expectType<ShortcutExecaReturnValue>(await scriptPromise.pipe(execaPromise).pipe(pipeOptions)`stdin`);

expectType<EmptyExecaReturnValue>(await execaPromise.pipe(execaPromise).pipe('stdin'));
expectType<EmptyExecaReturnValue>(await scriptPromise.pipe(execaPromise).pipe('stdin'));
expectType<EmptyExecaReturnValue>(await execaPromise.pipe(execaPromise, pipeOptions).pipe('stdin'));
expectType<EmptyExecaReturnValue>(await scriptPromise.pipe(execaPromise, pipeOptions).pipe('stdin'));
expectType<ShortcutExecaReturnValue>(await execaPromise.pipe(execaPromise).pipe('stdin', pipeOptions));
expectType<ShortcutExecaReturnValue>(await scriptPromise.pipe(execaPromise).pipe('stdin', pipeOptions));

expectType<BufferExecaReturnValue>(await execaPromise.pipe`stdin`.pipe(execaBufferPromise));
expectType<BufferExecaReturnValue>(await scriptPromise.pipe`stdin`.pipe(execaBufferPromise));
expectType<BufferExecaReturnValue>(await execaPromise.pipe(pipeOptions)`stdin`.pipe(execaBufferPromise));
expectType<BufferExecaReturnValue>(await scriptPromise.pipe(pipeOptions)`stdin`.pipe(execaBufferPromise));
expectType<BufferExecaReturnValue>(await execaPromise.pipe`stdin`.pipe(execaBufferPromise, pipeOptions));
expectType<BufferExecaReturnValue>(await scriptPromise.pipe`stdin`.pipe(execaBufferPromise, pipeOptions));

expectType<EmptyExecaReturnValue>(await execaPromise.pipe`stdin`.pipe`stdin`);
expectType<EmptyExecaReturnValue>(await scriptPromise.pipe`stdin`.pipe`stdin`);
expectType<EmptyExecaReturnValue>(await execaPromise.pipe(pipeOptions)`stdin`.pipe`stdin`);
expectType<EmptyExecaReturnValue>(await scriptPromise.pipe(pipeOptions)`stdin`.pipe`stdin`);
expectType<ShortcutExecaReturnValue>(await execaPromise.pipe`stdin`.pipe(pipeOptions)`stdin`);
expectType<ShortcutExecaReturnValue>(await scriptPromise.pipe`stdin`.pipe(pipeOptions)`stdin`);

expectType<EmptyExecaReturnValue>(await execaPromise.pipe`stdin`.pipe('stdin'));
expectType<EmptyExecaReturnValue>(await scriptPromise.pipe`stdin`.pipe('stdin'));
expectType<EmptyExecaReturnValue>(await execaPromise.pipe(pipeOptions)`stdin`.pipe('stdin'));
expectType<EmptyExecaReturnValue>(await scriptPromise.pipe(pipeOptions)`stdin`.pipe('stdin'));
expectType<ShortcutExecaReturnValue>(await execaPromise.pipe`stdin`.pipe('stdin', pipeOptions));
expectType<ShortcutExecaReturnValue>(await scriptPromise.pipe`stdin`.pipe('stdin', pipeOptions));

expectType<BufferExecaReturnValue>(await execaPromise.pipe('pipe').pipe(execaBufferPromise));
expectType<BufferExecaReturnValue>(await scriptPromise.pipe('pipe').pipe(execaBufferPromise));
expectType<BufferExecaReturnValue>(await execaPromise.pipe('pipe', pipeOptions).pipe(execaBufferPromise));
expectType<BufferExecaReturnValue>(await scriptPromise.pipe('pipe', pipeOptions).pipe(execaBufferPromise));
expectType<BufferExecaReturnValue>(await execaPromise.pipe('pipe').pipe(execaBufferPromise, pipeOptions));
expectType<BufferExecaReturnValue>(await scriptPromise.pipe('pipe').pipe(execaBufferPromise, pipeOptions));

expectType<EmptyExecaReturnValue>(await execaPromise.pipe('pipe').pipe`stdin`);
expectType<EmptyExecaReturnValue>(await scriptPromise.pipe('pipe').pipe`stdin`);
expectType<EmptyExecaReturnValue>(await execaPromise.pipe('pipe', pipeOptions).pipe`stdin`);
expectType<EmptyExecaReturnValue>(await scriptPromise.pipe('pipe', pipeOptions).pipe`stdin`);
expectType<ShortcutExecaReturnValue>(await execaPromise.pipe('pipe').pipe(pipeOptions)`stdin`);
expectType<ShortcutExecaReturnValue>(await scriptPromise.pipe('pipe').pipe(pipeOptions)`stdin`);

expectType<EmptyExecaReturnValue>(await execaPromise.pipe('pipe').pipe('stdin'));
expectType<EmptyExecaReturnValue>(await scriptPromise.pipe('pipe').pipe('stdin'));
expectType<EmptyExecaReturnValue>(await execaPromise.pipe('pipe', pipeOptions).pipe('stdin'));
expectType<EmptyExecaReturnValue>(await scriptPromise.pipe('pipe', pipeOptions).pipe('stdin'));
expectType<ShortcutExecaReturnValue>(await execaPromise.pipe('pipe').pipe('stdin', pipeOptions));
expectType<ShortcutExecaReturnValue>(await scriptPromise.pipe('pipe').pipe('stdin', pipeOptions));

await execaPromise.pipe(execaBufferPromise, {});
await scriptPromise.pipe(execaBufferPromise, {});
await execaPromise.pipe({})`stdin`;
await scriptPromise.pipe({})`stdin`;
await execaPromise.pipe('stdin', {});
await scriptPromise.pipe('stdin', {});

expectError(execaPromise.pipe(execaBufferPromise).stdout);
expectError(scriptPromise.pipe(execaBufferPromise).stdout);
expectError(execaPromise.pipe`stdin`.stdout);
expectError(scriptPromise.pipe`stdin`.stdout);
expectError(execaPromise.pipe('stdin').stdout);
expectError(scriptPromise.pipe('stdin').stdout);

expectError(await execaPromise.pipe({})({}));
expectError(await scriptPromise.pipe({})({}));
expectError(await execaPromise.pipe({})(execaPromise));
expectError(await scriptPromise.pipe({})(execaPromise));
expectError(await execaPromise.pipe({})('stdin'));
expectError(await scriptPromise.pipe({})('stdin'));

expectError(execaPromise.pipe(createWriteStream('output.txt')));
expectError(scriptPromise.pipe(createWriteStream('output.txt')));
expectError(execaPromise.pipe(false));
expectError(scriptPromise.pipe(false));

expectError(execaPromise.pipe(execaBufferPromise, 'stdout'));
expectError(scriptPromise.pipe(execaBufferPromise, 'stdout'));
expectError(execaPromise.pipe('stdout')`stdin`);
expectError(scriptPromise.pipe('stdout')`stdin`);

await execaPromise.pipe(execaBufferPromise, {from: 'stdout'});
await scriptPromise.pipe(execaBufferPromise, {from: 'stdout'});
await execaPromise.pipe({from: 'stdout'})`stdin`;
await scriptPromise.pipe({from: 'stdout'})`stdin`;
await execaPromise.pipe('stdin', {from: 'stdout'});
await scriptPromise.pipe('stdin', {from: 'stdout'});

await execaPromise.pipe(execaBufferPromise, {from: 'stderr'});
await scriptPromise.pipe(execaBufferPromise, {from: 'stderr'});
await execaPromise.pipe({from: 'stderr'})`stdin`;
await scriptPromise.pipe({from: 'stderr'})`stdin`;
await execaPromise.pipe('stdin', {from: 'stderr'});
await scriptPromise.pipe('stdin', {from: 'stderr'});

await execaPromise.pipe(execaBufferPromise, {from: 'all'});
await scriptPromise.pipe(execaBufferPromise, {from: 'all'});
await execaPromise.pipe({from: 'all'})`stdin`;
await scriptPromise.pipe({from: 'all'})`stdin`;
await execaPromise.pipe('stdin', {from: 'all'});
await scriptPromise.pipe('stdin', {from: 'all'});

await execaPromise.pipe(execaBufferPromise, {from: 'fd3'});
await scriptPromise.pipe(execaBufferPromise, {from: 'fd3'});
await execaPromise.pipe({from: 'fd3'})`stdin`;
await scriptPromise.pipe({from: 'fd3'})`stdin`;
await execaPromise.pipe('stdin', {from: 'fd3'});
await scriptPromise.pipe('stdin', {from: 'fd3'});

expectError(execaPromise.pipe(execaBufferPromise, {from: 'stdin'}));
expectError(scriptPromise.pipe(execaBufferPromise, {from: 'stdin'}));
expectError(execaPromise.pipe({from: 'stdin'})`stdin`);
expectError(scriptPromise.pipe({from: 'stdin'})`stdin`);
expectError(execaPromise.pipe('stdin', {from: 'stdin'}));
expectError(scriptPromise.pipe('stdin', {from: 'stdin'}));

await execaPromise.pipe(execaBufferPromise, {to: 'stdin'});
await scriptPromise.pipe(execaBufferPromise, {to: 'stdin'});
await execaPromise.pipe({to: 'stdin'})`stdin`;
await scriptPromise.pipe({to: 'stdin'})`stdin`;
await execaPromise.pipe('stdin', {to: 'stdin'});
await scriptPromise.pipe('stdin', {to: 'stdin'});

await execaPromise.pipe(execaBufferPromise, {to: 'fd3'});
await scriptPromise.pipe(execaBufferPromise, {to: 'fd3'});
await execaPromise.pipe({to: 'fd3'})`stdin`;
await scriptPromise.pipe({to: 'fd3'})`stdin`;
await execaPromise.pipe('stdin', {to: 'fd3'});
await scriptPromise.pipe('stdin', {to: 'fd3'});

expectError(execaPromise.pipe(execaBufferPromise, {to: 'stdout'}));
expectError(scriptPromise.pipe(execaBufferPromise, {to: 'stdout'}));
expectError(execaPromise.pipe({to: 'stdout'})`stdin`);
expectError(scriptPromise.pipe({to: 'stdout'})`stdin`);
expectError(execaPromise.pipe('stdin', {to: 'stdout'}));
expectError(scriptPromise.pipe('stdin', {to: 'stdout'}));

await execaPromise.pipe(execaBufferPromise, {unpipeSignal: new AbortController().signal});
await scriptPromise.pipe(execaBufferPromise, {unpipeSignal: new AbortController().signal});
await execaPromise.pipe({unpipeSignal: new AbortController().signal})`stdin`;
await scriptPromise.pipe({unpipeSignal: new AbortController().signal})`stdin`;
await execaPromise.pipe('stdin', {unpipeSignal: new AbortController().signal});
await scriptPromise.pipe('stdin', {unpipeSignal: new AbortController().signal});
expectError(await execaPromise.pipe(execaBufferPromise, {unpipeSignal: true}));
expectError(await scriptPromise.pipe(execaBufferPromise, {unpipeSignal: true}));
expectError(await execaPromise.pipe({unpipeSignal: true})`stdin`);
expectError(await scriptPromise.pipe({unpipeSignal: true})`stdin`);
expectError(await execaPromise.pipe('stdin', {unpipeSignal: true}));
expectError(await scriptPromise.pipe('stdin', {unpipeSignal: true}));

expectType<EmptyExecaReturnValue>(await execaPromise.pipe('stdin'));
await execaPromise.pipe('stdin');
await execaPromise.pipe(fileUrl);
await execaPromise.pipe('stdin', []);
await execaPromise.pipe('stdin', stringArray);
await execaPromise.pipe('stdin', stringArray, {});
await execaPromise.pipe('stdin', stringArray, {from: 'stderr', to: 'stdin', all: true});
await execaPromise.pipe('stdin', {from: 'stderr'});
await execaPromise.pipe('stdin', {to: 'stdin'});
await execaPromise.pipe('stdin', {all: true});

expectError(await execaPromise.pipe(stringArray));
expectError(await execaPromise.pipe('stdin', 'foo'));
expectError(await execaPromise.pipe('stdin', [false]));
expectError(await execaPromise.pipe('stdin', [], false));
expectError(await execaPromise.pipe('stdin', {other: true}));
expectError(await execaPromise.pipe('stdin', [], {other: true}));
expectError(await execaPromise.pipe('stdin', {from: 'fd'}));
expectError(await execaPromise.pipe('stdin', [], {from: 'fd'}));
expectError(await execaPromise.pipe('stdin', {from: 'fdNotANumber'}));
expectError(await execaPromise.pipe('stdin', [], {from: 'fdNotANumber'}));
expectError(await execaPromise.pipe('stdin', {from: 'other'}));
expectError(await execaPromise.pipe('stdin', [], {from: 'other'}));
expectError(await execaPromise.pipe('stdin', {to: 'fd'}));
expectError(await execaPromise.pipe('stdin', [], {to: 'fd'}));
expectError(await execaPromise.pipe('stdin', {to: 'fdNotANumber'}));
expectError(await execaPromise.pipe('stdin', [], {to: 'fdNotANumber'}));
expectError(await execaPromise.pipe('stdin', {to: 'other'}));
expectError(await execaPromise.pipe('stdin', [], {to: 'other'}));

const pipeResult = await execaPromise.pipe`stdin`;
expectType<string>(pipeResult.stdout);
const ignorePipeResult = await execaPromise.pipe({stdout: 'ignore'})`stdin`;
expectType<undefined>(ignorePipeResult.stdout);

const scriptPipeResult = await scriptPromise.pipe`stdin`;
expectType<string>(scriptPipeResult.stdout);
const ignoreScriptPipeResult = await scriptPromise.pipe({stdout: 'ignore'})`stdin`;
expectType<undefined>(ignoreScriptPipeResult.stdout);

const shortcutPipeResult = await execaPromise.pipe('stdin');
expectType<string>(shortcutPipeResult.stdout);
const ignoreShortcutPipeResult = await execaPromise.pipe('stdin', {stdout: 'ignore'});
expectType<undefined>(ignoreShortcutPipeResult.stdout);

const scriptShortcutPipeResult = await scriptPromise.pipe('stdin');
expectType<string>(scriptShortcutPipeResult.stdout);
const ignoreShortcutScriptPipeResult = await scriptPromise.pipe('stdin', {stdout: 'ignore'});
expectType<undefined>(ignoreShortcutScriptPipeResult.stdout);

const unicornsResult = execaSync('unicorns');
expectError(unicornsResult.pipe);
