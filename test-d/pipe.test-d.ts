import {createWriteStream} from 'node:fs';
import {expectType, expectNotType, expectError} from 'tsd';
import {
	execa,
	execaSync,
	$,
	type ExecaResult,
} from '../index.js';

const fileUrl = new URL('file:///test');
const stringArray = ['foo', 'bar'] as const;
const pipeOptions = {from: 'stderr', to: 'fd3', all: true} as const;

const subprocess = execa('unicorns', {all: true});
const bufferSubprocess = execa('unicorns', {encoding: 'buffer', all: true});
const scriptSubprocess = $`unicorns`;

const bufferResult = await bufferSubprocess;
type BufferExecaReturnValue = typeof bufferResult;
type EmptyExecaReturnValue = ExecaResult<{}>;
type ShortcutExecaReturnValue = ExecaResult<typeof pipeOptions>;

expectNotType<BufferExecaReturnValue>(await subprocess.pipe(subprocess));
expectNotType<BufferExecaReturnValue>(await scriptSubprocess.pipe(subprocess));
expectType<BufferExecaReturnValue>(await subprocess.pipe(bufferSubprocess));
expectType<BufferExecaReturnValue>(await scriptSubprocess.pipe(bufferSubprocess));
expectType<BufferExecaReturnValue>(await subprocess.pipe(bufferSubprocess, pipeOptions));
expectType<BufferExecaReturnValue>(await scriptSubprocess.pipe(bufferSubprocess, pipeOptions));

expectType<EmptyExecaReturnValue>(await subprocess.pipe`stdin`);
expectType<EmptyExecaReturnValue>(await scriptSubprocess.pipe`stdin`);
expectType<ShortcutExecaReturnValue>(await subprocess.pipe(pipeOptions)`stdin`);
expectType<ShortcutExecaReturnValue>(await scriptSubprocess.pipe(pipeOptions)`stdin`);

expectType<EmptyExecaReturnValue>(await subprocess.pipe('stdin'));
expectType<EmptyExecaReturnValue>(await scriptSubprocess.pipe('stdin'));
expectType<ShortcutExecaReturnValue>(await subprocess.pipe('stdin', pipeOptions));
expectType<ShortcutExecaReturnValue>(await scriptSubprocess.pipe('stdin', pipeOptions));

expectType<BufferExecaReturnValue>(await subprocess.pipe(subprocess).pipe(bufferSubprocess));
expectType<BufferExecaReturnValue>(await scriptSubprocess.pipe(subprocess).pipe(bufferSubprocess));
expectType<BufferExecaReturnValue>(await subprocess.pipe(subprocess, pipeOptions).pipe(bufferSubprocess));
expectType<BufferExecaReturnValue>(await scriptSubprocess.pipe(subprocess, pipeOptions).pipe(bufferSubprocess));
expectType<BufferExecaReturnValue>(await subprocess.pipe(subprocess).pipe(bufferSubprocess, pipeOptions));
expectType<BufferExecaReturnValue>(await scriptSubprocess.pipe(subprocess).pipe(bufferSubprocess, pipeOptions));

expectType<EmptyExecaReturnValue>(await subprocess.pipe(subprocess).pipe`stdin`);
expectType<EmptyExecaReturnValue>(await scriptSubprocess.pipe(subprocess).pipe`stdin`);
expectType<EmptyExecaReturnValue>(await subprocess.pipe(subprocess, pipeOptions).pipe`stdin`);
expectType<EmptyExecaReturnValue>(await scriptSubprocess.pipe(subprocess, pipeOptions).pipe`stdin`);
expectType<ShortcutExecaReturnValue>(await subprocess.pipe(subprocess).pipe(pipeOptions)`stdin`);
expectType<ShortcutExecaReturnValue>(await scriptSubprocess.pipe(subprocess).pipe(pipeOptions)`stdin`);

expectType<EmptyExecaReturnValue>(await subprocess.pipe(subprocess).pipe('stdin'));
expectType<EmptyExecaReturnValue>(await scriptSubprocess.pipe(subprocess).pipe('stdin'));
expectType<EmptyExecaReturnValue>(await subprocess.pipe(subprocess, pipeOptions).pipe('stdin'));
expectType<EmptyExecaReturnValue>(await scriptSubprocess.pipe(subprocess, pipeOptions).pipe('stdin'));
expectType<ShortcutExecaReturnValue>(await subprocess.pipe(subprocess).pipe('stdin', pipeOptions));
expectType<ShortcutExecaReturnValue>(await scriptSubprocess.pipe(subprocess).pipe('stdin', pipeOptions));

expectType<BufferExecaReturnValue>(await subprocess.pipe`stdin`.pipe(bufferSubprocess));
expectType<BufferExecaReturnValue>(await scriptSubprocess.pipe`stdin`.pipe(bufferSubprocess));
expectType<BufferExecaReturnValue>(await subprocess.pipe(pipeOptions)`stdin`.pipe(bufferSubprocess));
expectType<BufferExecaReturnValue>(await scriptSubprocess.pipe(pipeOptions)`stdin`.pipe(bufferSubprocess));
expectType<BufferExecaReturnValue>(await subprocess.pipe`stdin`.pipe(bufferSubprocess, pipeOptions));
expectType<BufferExecaReturnValue>(await scriptSubprocess.pipe`stdin`.pipe(bufferSubprocess, pipeOptions));

expectType<EmptyExecaReturnValue>(await subprocess.pipe`stdin`.pipe`stdin`);
expectType<EmptyExecaReturnValue>(await scriptSubprocess.pipe`stdin`.pipe`stdin`);
expectType<EmptyExecaReturnValue>(await subprocess.pipe(pipeOptions)`stdin`.pipe`stdin`);
expectType<EmptyExecaReturnValue>(await scriptSubprocess.pipe(pipeOptions)`stdin`.pipe`stdin`);
expectType<ShortcutExecaReturnValue>(await subprocess.pipe`stdin`.pipe(pipeOptions)`stdin`);
expectType<ShortcutExecaReturnValue>(await scriptSubprocess.pipe`stdin`.pipe(pipeOptions)`stdin`);

expectType<EmptyExecaReturnValue>(await subprocess.pipe`stdin`.pipe('stdin'));
expectType<EmptyExecaReturnValue>(await scriptSubprocess.pipe`stdin`.pipe('stdin'));
expectType<EmptyExecaReturnValue>(await subprocess.pipe(pipeOptions)`stdin`.pipe('stdin'));
expectType<EmptyExecaReturnValue>(await scriptSubprocess.pipe(pipeOptions)`stdin`.pipe('stdin'));
expectType<ShortcutExecaReturnValue>(await subprocess.pipe`stdin`.pipe('stdin', pipeOptions));
expectType<ShortcutExecaReturnValue>(await scriptSubprocess.pipe`stdin`.pipe('stdin', pipeOptions));

expectType<BufferExecaReturnValue>(await subprocess.pipe('pipe').pipe(bufferSubprocess));
expectType<BufferExecaReturnValue>(await scriptSubprocess.pipe('pipe').pipe(bufferSubprocess));
expectType<BufferExecaReturnValue>(await subprocess.pipe('pipe', pipeOptions).pipe(bufferSubprocess));
expectType<BufferExecaReturnValue>(await scriptSubprocess.pipe('pipe', pipeOptions).pipe(bufferSubprocess));
expectType<BufferExecaReturnValue>(await subprocess.pipe('pipe').pipe(bufferSubprocess, pipeOptions));
expectType<BufferExecaReturnValue>(await scriptSubprocess.pipe('pipe').pipe(bufferSubprocess, pipeOptions));

expectType<EmptyExecaReturnValue>(await subprocess.pipe('pipe').pipe`stdin`);
expectType<EmptyExecaReturnValue>(await scriptSubprocess.pipe('pipe').pipe`stdin`);
expectType<EmptyExecaReturnValue>(await subprocess.pipe('pipe', pipeOptions).pipe`stdin`);
expectType<EmptyExecaReturnValue>(await scriptSubprocess.pipe('pipe', pipeOptions).pipe`stdin`);
expectType<ShortcutExecaReturnValue>(await subprocess.pipe('pipe').pipe(pipeOptions)`stdin`);
expectType<ShortcutExecaReturnValue>(await scriptSubprocess.pipe('pipe').pipe(pipeOptions)`stdin`);

expectType<EmptyExecaReturnValue>(await subprocess.pipe('pipe').pipe('stdin'));
expectType<EmptyExecaReturnValue>(await scriptSubprocess.pipe('pipe').pipe('stdin'));
expectType<EmptyExecaReturnValue>(await subprocess.pipe('pipe', pipeOptions).pipe('stdin'));
expectType<EmptyExecaReturnValue>(await scriptSubprocess.pipe('pipe', pipeOptions).pipe('stdin'));
expectType<ShortcutExecaReturnValue>(await subprocess.pipe('pipe').pipe('stdin', pipeOptions));
expectType<ShortcutExecaReturnValue>(await scriptSubprocess.pipe('pipe').pipe('stdin', pipeOptions));

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

expectType<EmptyExecaReturnValue>(await subprocess.pipe('stdin'));
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
expectType<string>(pipeResult.stdout);
const ignorePipeResult = await subprocess.pipe({stdout: 'ignore'})`stdin`;
expectType<undefined>(ignorePipeResult.stdout);

const scriptPipeResult = await scriptSubprocess.pipe`stdin`;
expectType<string>(scriptPipeResult.stdout);
const ignoreScriptPipeResult = await scriptSubprocess.pipe({stdout: 'ignore'})`stdin`;
expectType<undefined>(ignoreScriptPipeResult.stdout);

const shortcutPipeResult = await subprocess.pipe('stdin');
expectType<string>(shortcutPipeResult.stdout);
const ignoreShortcutPipeResult = await subprocess.pipe('stdin', {stdout: 'ignore'});
expectType<undefined>(ignoreShortcutPipeResult.stdout);

const scriptShortcutPipeResult = await scriptSubprocess.pipe('stdin');
expectType<string>(scriptShortcutPipeResult.stdout);
const ignoreShortcutScriptPipeResult = await scriptSubprocess.pipe('stdin', {stdout: 'ignore'});
expectType<undefined>(ignoreShortcutScriptPipeResult.stdout);

const unicornsResult = execaSync('unicorns');
expectError(unicornsResult.pipe);
