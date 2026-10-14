import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaNode,
	$,
	type Message,
	type Subprocess,
	type Result,
	type ExecaError,
} from '../index.js';

type EnabledSubprocess = Subprocess<{ipc: true}>;

declare const options: {node: true} | {ipcInput: string};
const subprocess = execa('unicorns', options);
expectTypeOf(subprocess.sendMessage).toBe<Subprocess<{ipc: true}>['sendMessage']>();
expectTypeOf(subprocess.getOneMessage).toBe<Subprocess<{ipc: true}>['getOneMessage']>();
const result = await subprocess;
expectTypeOf(result.ipcOutput).toBe<Array<Message<'advanced'>>>();
expectTypeOf(subprocess.getEachMessage).toBe<EnabledSubprocess['getEachMessage']>();
expectTypeOf(subprocess.sendMessage('hello')).toBe<Promise<void>>();
expectTypeOf(subprocess.getOneMessage()).toBe<Promise<Message<'advanced'>>>();
expectTypeOf<Result<typeof options>['ipcOutput']>().toBe<Array<Message<'advanced'>>>();
expectTypeOf<ExecaError<typeof options>['ipcOutput']>().toBe<Array<Message<'advanced'>>>();
expectTypeOf(execa(options)`unicorns`.sendMessage).toBe<EnabledSubprocess['sendMessage']>();
expectTypeOf($(options)`unicorns`.getOneMessage).toBe<EnabledSubprocess['getOneMessage']>();

const piped = execa('unicorns').pipe(subprocess);
expectTypeOf(piped.getOneMessage).toBe<EnabledSubprocess['getOneMessage']>();
const pipedResult = await piped;
expectTypeOf(pipedResult.ipcOutput).toBe<Array<Message<'advanced'>>>();

declare const gracefulOptions: {gracefulCancel: true; cancelSignal: AbortSignal} | {ipcInput: string};
const gracefulSubprocess = execa('unicorns', gracefulOptions);
expectTypeOf(gracefulSubprocess.sendMessage).toBe<EnabledSubprocess['sendMessage']>();
const gracefulResult = await gracefulSubprocess;
expectTypeOf(gracefulResult.ipcOutput).toBe<Array<Message<'advanced'>>>();

declare const falsyInputOptions: {ipcInput: false} | {node: true};
expectTypeOf(execa('unicorns', falsyInputOptions).sendMessage).toBe<EnabledSubprocess['sendMessage']>();

declare const maybeOptions: {node: true} | {encoding: 'buffer'};
const maybeSubprocess = execa('unicorns', maybeOptions);
expectTypeOf(maybeSubprocess.sendMessage).toBe<EnabledSubprocess['sendMessage'] | undefined>();
expectTypeOf(maybeSubprocess.getOneMessage).toBe<EnabledSubprocess['getOneMessage'] | undefined>();
expectTypeOf(maybeSubprocess.getEachMessage).toBe<EnabledSubprocess['getEachMessage'] | undefined>();
const maybeResult = await maybeSubprocess;
expectTypeOf(maybeResult.ipcOutput).toBe<Array<Message<'advanced'>> | []>();
expectError(maybeSubprocess.sendMessage('hello'));
if (maybeSubprocess.sendMessage) {
	expectTypeOf(maybeSubprocess.sendMessage('hello')).toBe<Promise<void>>();
	expectTypeOf(maybeSubprocess.getOneMessage()).toBe<Promise<Message<'advanced'>>>();
}

declare const jsonOptions: {node: true; serialization: 'json'} | {ipcInput: string; serialization: 'json'};
const jsonSubprocess = execa('unicorns', jsonOptions);
expectTypeOf(jsonSubprocess.getOneMessage()).toBe<Promise<Message<'json'>>>();
const jsonResult = await jsonSubprocess;
expectTypeOf(jsonResult.ipcOutput).toBe<Array<Message<'json'>>>();
expectError(jsonSubprocess.sendMessage(Symbol('message')), 'not assignable');

// Explicit IPC precedence and disabled buffering are unchanged by option unions.
declare const disabledOptions: {node: true; ipc: false} | {encoding: 'buffer'; ipc: false};
const disabledSubprocess = execa('unicorns', disabledOptions);
expectTypeOf(disabledSubprocess.sendMessage).toBe<undefined>();
expectTypeOf(disabledSubprocess.getOneMessage).toBe<undefined>();
const disabledResult = await disabledSubprocess;
expectTypeOf(disabledResult.ipcOutput).toBe<[]>();
expectError(disabledSubprocess.sendMessage('hello'));

declare const explicitOptions: {node: false; ipc: true} | {encoding: 'buffer'; ipc: true};
expectTypeOf(execa('unicorns', explicitOptions).sendMessage).toBe<EnabledSubprocess['sendMessage']>();
expectTypeOf(execaNode('unicorns', options).sendMessage).toBe<EnabledSubprocess['sendMessage']>();
const noBufferSubprocess = execa('unicorns', {...options, buffer: false});
expectTypeOf(noBufferSubprocess.sendMessage).toBe<EnabledSubprocess['sendMessage']>();
const noBufferResult = await noBufferSubprocess;
expectTypeOf(noBufferResult.ipcOutput).toBe<[]>();

declare const absentOptions: {node: false} | {gracefulCancel: false};
expectTypeOf(execa('unicorns', absentOptions).getEachMessage).toBe<undefined>();
expectTypeOf<Result<typeof absentOptions>['ipcOutput']>().toBe<[]>();

declare const optionalInputOptions: {ipcInput?: string} | {node: true};
expectTypeOf(execa('unicorns', optionalInputOptions).sendMessage).toBe<EnabledSubprocess['sendMessage'] | undefined>();

// Each member's own `buffer` and `serialization` options apply to its IPC.
declare const mixedStdioOptions: {node: true} | {encoding: 'buffer'};
const mixedStdioResult = await execa('unicorns', mixedStdioOptions);
expectTypeOf(mixedStdioResult.stdio).toBe<[undefined, string | Uint8Array, string | Uint8Array, undefined] | [undefined, string | Uint8Array, string | Uint8Array]>();

declare const memberBufferOptions: {node: true; buffer: false} | {encoding: 'buffer'};
const memberBufferResult = await execa('unicorns', memberBufferOptions);
expectTypeOf(memberBufferResult.ipcOutput).toBe<[]>();

declare const memberSerializationOptions: {node: true; serialization: 'json'} | {ipc: true};
const memberSerializationSubprocess = execa('unicorns', memberSerializationOptions);
await memberSerializationSubprocess.sendMessage({message: 'hello'});
expectError(memberSerializationSubprocess.sendMessage(new Map()));
expectTypeOf(memberSerializationSubprocess.getOneMessage()).toBe<Promise<Message<'advanced'>>>();
const memberSerializationResult = await memberSerializationSubprocess;
expectTypeOf(memberSerializationResult.ipcOutput).toBe<Array<Message<'json'>> | Array<Message<'advanced'>>>();
