import {expectAssignable, expectType} from 'tsd';
import {
	execa,
	execaSync,
	type Result,
	type SyncResult,
	type ExecaError,
	type ExecaSyncError,
} from '../../index.js';

const ipcResult = await execa('unicorns', {ipc: true});
expectType<unknown[]>(ipcResult.ipc);

const ipcFdResult = await execa('unicorns', {ipc: true, buffer: {stdout: false}});
expectType<unknown[]>(ipcFdResult.ipc);

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

expectType<unknown[] | []>({} as Result['ipc']);
expectAssignable<unknown[]>({} as Result['ipc']);
expectType<[]>({} as unknown as SyncResult['ipc']);

const ipcError = new Error('.') as ExecaError<{ipc: true}>;
expectType<unknown[]>(ipcError.ipc);

const ipcFalseError = new Error('.') as ExecaError<{ipc: false}>;
expectType<[]>(ipcFalseError.ipc);

const asyncError = new Error('.') as ExecaError;
expectType<unknown[] | []>(asyncError.ipc);
expectAssignable<unknown[]>(asyncError.ipc);

const syncError = new Error('.') as ExecaSyncError;
expectType<[]>(syncError.ipc);
