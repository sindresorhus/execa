import {expectAssignable, expectType} from 'tsd';
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
expectType<Array<Message<'advanced'>>>(ipcResult.ipcOutput);

const ipcFdResult = await execa('unicorns', {ipc: true, buffer: {stdout: false}});
expectType<Array<Message<'advanced'>>>(ipcFdResult.ipcOutput);

const advancedResult = await execa('unicorns', {ipc: true, serialization: 'advanced'});
expectType<Array<Message<'advanced'>>>(advancedResult.ipcOutput);

const jsonResult = await execa('unicorns', {ipc: true, serialization: 'json'});
expectType<Array<Message<'json'>>>(jsonResult.ipcOutput);

const inputResult = await execa('unicorns', {ipcInput: ''});
expectType<Array<Message<'advanced'>>>(inputResult.ipcOutput);

const genericInputResult = await execa('unicorns', {ipcInput: '' as Message});
expectType<Array<Message<'advanced'>>>(genericInputResult.ipcOutput);

const genericResult = await execa('unicorns', {} as Options);
expectType<Message[] | []>(genericResult.ipcOutput);

const genericIpc = await execa('unicorns', {ipc: true as boolean});
expectType<Array<Message<'advanced'>> | []>(genericIpc.ipcOutput);

const maybeInputResult = await execa('unicorns', {ipcInput: '' as '' | undefined});
expectType<Array<Message<'advanced'>> | []>(maybeInputResult.ipcOutput);

const falseIpcResult = await execa('unicorns', {ipc: false});
expectType<[]>(falseIpcResult.ipcOutput);

const noIpcResult = await execa('unicorns');
expectType<[]>(noIpcResult.ipcOutput);

const emptyIpcResult = await execa('unicorns', {});
expectType<[]>(emptyIpcResult.ipcOutput);

const undefinedInputResult = await execa('unicorns', {ipcInput: undefined});
expectType<[]>(undefinedInputResult.ipcOutput);

const inputNoIpcResult = await execa('unicorns', {ipc: false, ipcInput: ''});
expectType<[]>(inputNoIpcResult.ipcOutput);

const noBufferResult = await execa('unicorns', {ipc: true, buffer: false});
expectType<[]>(noBufferResult.ipcOutput);

const noBufferFdResult = await execa('unicorns', {ipc: true, buffer: {ipc: false}});
expectType<[]>(noBufferFdResult.ipcOutput);

const syncResult = execaSync('unicorns');
expectType<[]>(syncResult.ipcOutput);

expectType<Message[] | []>({} as Result['ipcOutput']);
expectAssignable<Message[]>({} as Result['ipcOutput']);
expectType<[]>({} as unknown as SyncResult['ipcOutput']);

const ipcError = new Error('.') as ExecaError<{ipc: true}>;
expectType<Array<Message<'advanced'>>>(ipcError.ipcOutput);

const ipcFalseError = new Error('.') as ExecaError<{ipc: false}>;
expectType<[]>(ipcFalseError.ipcOutput);

const asyncError = new Error('.') as ExecaError;
expectType<Message[] | []>(asyncError.ipcOutput);
expectAssignable<Message[]>(asyncError.ipcOutput);

const syncError = new Error('.') as ExecaSyncError;
expectType<[]>(syncError.ipcOutput);
