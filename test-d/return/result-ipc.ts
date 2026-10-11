import {expectTypeOf} from 'nz';
import {
	execa,
	execaSync,
	type Result,
	type SyncResult,
	type ExecaError,
	type ExecaSyncError,
	type Message,
	type Options,
} from '../../index.js';

const ipcResult = await execa('unicorns', {ipc: true});
expectTypeOf(ipcResult.ipcOutput).toBe<Array<Message<'advanced'>>>();

const ipcFdResult = await execa('unicorns', {ipc: true, buffer: {stdout: false}});
expectTypeOf(ipcFdResult.ipcOutput).toBe<Array<Message<'advanced'>>>();

const advancedResult = await execa('unicorns', {ipc: true, serialization: 'advanced'});
expectTypeOf(advancedResult.ipcOutput).toBe<Array<Message<'advanced'>>>();

const jsonResult = await execa('unicorns', {ipc: true, serialization: 'json'});
expectTypeOf(jsonResult.ipcOutput).toBe<Array<Message<'json'>>>();

const inputResult = await execa('unicorns', {ipcInput: ''});
expectTypeOf(inputResult.ipcOutput).toBe<Array<Message<'advanced'>>>();

const genericInputResult = await execa('unicorns', {ipcInput: '' as Message});
expectTypeOf(genericInputResult.ipcOutput).toBe<Array<Message<'advanced'>>>();

const gracefulResult = await execa('unicorns', {gracefulCancel: true, cancelSignal: AbortSignal.abort()});
expectTypeOf(gracefulResult.ipcOutput).toBe<Array<Message<'advanced'>>>();

const genericResult = await execa('unicorns', {} as Options);
expectTypeOf(genericResult.ipcOutput).toBe<Message[] | []>();

const genericIpc = await execa('unicorns', {ipc: true as boolean});
expectTypeOf(genericIpc.ipcOutput).toBe<Array<Message<'advanced'>> | []>();

const maybeInputResult = await execa('unicorns', {ipcInput: '' as '' | undefined});
expectTypeOf(maybeInputResult.ipcOutput).toBe<Array<Message<'advanced'>> | []>();

const maybeGracefulResult = await execa('unicorns', {gracefulCancel: true as boolean | undefined, cancelSignal: AbortSignal.abort()});
expectTypeOf(maybeGracefulResult.ipcOutput).toBe<Array<Message<'advanced'>> | []>();

const falseIpcResult = await execa('unicorns', {ipc: false});
expectTypeOf(falseIpcResult.ipcOutput).toBe<[]>();

const noIpcResult = await execa('unicorns');
expectTypeOf(noIpcResult.ipcOutput).toBe<[]>();

const emptyIpcResult = await execa('unicorns', {});
expectTypeOf(emptyIpcResult.ipcOutput).toBe<[]>();

const undefinedInputResult = await execa('unicorns', {ipcInput: undefined});
expectTypeOf(undefinedInputResult.ipcOutput).toBe<[]>();

const inputNoIpcResult = await execa('unicorns', {ipc: false, ipcInput: ''});
expectTypeOf(inputNoIpcResult.ipcOutput).toBe<[]>();

const undefinedGracefulResult = await execa('unicorns', {gracefulCancel: undefined});
expectTypeOf(undefinedGracefulResult.ipcOutput).toBe<[]>();

const falseGracefulResult = await execa('unicorns', {gracefulCancel: false});
expectTypeOf(falseGracefulResult.ipcOutput).toBe<[]>();

const gracefulNoIpcResult = await execa('unicorns', {ipc: false, gracefulCancel: true, cancelSignal: AbortSignal.abort()});
expectTypeOf(gracefulNoIpcResult.ipcOutput).toBe<[]>();

const noBufferResult = await execa('unicorns', {ipc: true, buffer: false});
expectTypeOf(noBufferResult.ipcOutput).toBe<[]>();

const noBufferFdResult = await execa('unicorns', {ipc: true, buffer: {ipc: false}});
expectTypeOf(noBufferFdResult.ipcOutput).toBe<[]>();

const syncResult = execaSync('unicorns');
expectTypeOf(syncResult.ipcOutput).toBe<[]>();

expectTypeOf<Result['ipcOutput']>().toBe<Message[] | []>();
expectTypeOf<Result['ipcOutput']>().toBeAssignableTo<Message[]>();
expectTypeOf({} as unknown as SyncResult['ipcOutput']).toBe<[]>();

const ipcError = new Error('.') as ExecaError<{ipc: true}>;
expectTypeOf(ipcError.ipcOutput).toBe<Array<Message<'advanced'>>>();

const ipcFalseError = new Error('.') as ExecaError<{ipc: false}>;
expectTypeOf(ipcFalseError.ipcOutput).toBe<[]>();

const asyncError = new Error('.') as ExecaError;
expectTypeOf(asyncError.ipcOutput).toBe<Message[] | []>();
expectTypeOf(asyncError.ipcOutput).toBeAssignableTo<Message[]>();

const syncError = new Error('.') as ExecaSyncError;
expectTypeOf(syncError.ipcOutput).toBe<[]>();
