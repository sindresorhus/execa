import {expectAssignable, expectType} from 'tsd';
import {
	execa,
	execaSync,
	type Result,
	type SyncResult,
	type ExecaError,
	type ExecaSyncError,
	type Message,
} from '../../index.js';

const ipcResult = await execa('unicorns', {ipc: true});
expectType<Array<Message<'advanced'>>>(ipcResult.ipc);

const ipcFdResult = await execa('unicorns', {ipc: true, buffer: {stdout: false}});
expectType<Array<Message<'advanced'>>>(ipcFdResult.ipc);

const advancedResult = await execa('unicorns', {ipc: true, serialization: 'advanced'});
expectType<Array<Message<'advanced'>>>(advancedResult.ipc);

const jsonResult = await execa('unicorns', {ipc: true, serialization: 'json'});
expectType<Array<Message<'json'>>>(jsonResult.ipc);

const falseIpcResult = await execa('unicorns', {ipc: false});
expectType<[]>(falseIpcResult.ipc);

const noIpcResult = await execa('unicorns');
expectType<[]>(noIpcResult.ipc);

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
