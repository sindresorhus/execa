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
expectType<Array<Message<'advanced'>>>(ipcResult.ipc);

const ipcFdResult = await execa('unicorns', {ipc: true, buffer: {stdout: false}});
expectType<Array<Message<'advanced'>>>(ipcFdResult.ipc);

const advancedResult = await execa('unicorns', {ipc: true, serialization: 'advanced'});
expectType<Array<Message<'advanced'>>>(advancedResult.ipc);

const jsonResult = await execa('unicorns', {ipc: true, serialization: 'json'});
expectType<Array<Message<'json'>>>(jsonResult.ipc);

const inputResult = await execa('unicorns', {ipcInput: ''});
expectType<Array<Message<'advanced'>>>(inputResult.ipc);

const genericInputResult = await execa('unicorns', {ipcInput: '' as Message});
expectType<Array<Message<'advanced'>>>(genericInputResult.ipc);

const genericResult = await execa('unicorns', {} as Options);
expectType<Message[] | []>(genericResult.ipc);

const genericIpc = await execa('unicorns', {ipc: true as boolean});
expectType<Array<Message<'advanced'>> | []>(genericIpc.ipc);

const maybeInputResult = await execa('unicorns', {ipcInput: '' as '' | undefined});
expectType<Array<Message<'advanced'>> | []>(maybeInputResult.ipc);

const falseIpcResult = await execa('unicorns', {ipc: false});
expectType<[]>(falseIpcResult.ipc);

const noIpcResult = await execa('unicorns');
expectType<[]>(noIpcResult.ipc);

const emptyIpcResult = await execa('unicorns', {});
expectType<[]>(emptyIpcResult.ipc);

const undefinedInputResult = await execa('unicorns', {ipcInput: undefined});
expectType<[]>(undefinedInputResult.ipc);

const inputNoIpcResult = await execa('unicorns', {ipc: false, ipcInput: ''});
expectType<[]>(inputNoIpcResult.ipc);

const noBufferResult = await execa('unicorns', {ipc: true, buffer: false});
expectType<[]>(noBufferResult.ipc);

const noBufferFdResult = await execa('unicorns', {ipc: true, buffer: {ipc: false}});
expectType<[]>(noBufferFdResult.ipc);

const syncResult = execaSync('unicorns');
expectType<[]>(syncResult.ipc);

expectType<Message[] | []>({} as Result['ipc']);
expectAssignable<Message[]>({} as Result['ipc']);
expectType<[]>({} as unknown as SyncResult['ipc']);

const ipcError = new Error('.') as ExecaError<{ipc: true}>;
expectType<Array<Message<'advanced'>>>(ipcError.ipc);

const ipcFalseError = new Error('.') as ExecaError<{ipc: false}>;
expectType<[]>(ipcFalseError.ipc);

const asyncError = new Error('.') as ExecaError;
expectType<Message[] | []>(asyncError.ipc);
expectAssignable<Message[]>(asyncError.ipc);

const syncError = new Error('.') as ExecaSyncError;
expectType<[]>(syncError.ipc);
