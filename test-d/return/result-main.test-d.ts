import type {SignalConstants} from 'node:os';
import {expectType, expectAssignable} from 'tsd';
import {
	execa,
	execaSync,
	ExecaError,
	ExecaSyncError,
	type Result,
	type SyncResult,
} from '../../index.js';

type AnyChunk = string | Uint8Array | string[] | unknown[] | undefined;
expectType<AnyChunk>({} as Result['stdout']);
expectType<AnyChunk>({} as Result['stderr']);
expectType<AnyChunk>({} as Result['all']);
expectAssignable<[undefined, AnyChunk, AnyChunk, ...AnyChunk[]]>({} as Result['stdio']);
expectType<AnyChunk>({} as SyncResult['stdout']);
expectType<AnyChunk>({} as SyncResult['stderr']);
expectType<AnyChunk>({} as SyncResult['all']);
expectAssignable<[undefined, AnyChunk, AnyChunk, ...AnyChunk[]]>({} as SyncResult['stdio']);

const unicornsResult = await execa('unicorns', {all: true});
expectAssignable<Result>(unicornsResult);
expectType<string>(unicornsResult.command);
expectType<string>(unicornsResult.escapedCommand);
expectType<number | undefined>(unicornsResult.exitCode);
expectType<boolean>(unicornsResult.failed);
expectType<boolean>(unicornsResult.timedOut);
expectType<boolean>(unicornsResult.isCanceled);
expectType<boolean>(unicornsResult.isGracefullyCanceled);
expectType<boolean>(unicornsResult.isTerminated);
expectType<boolean>(unicornsResult.isMaxBuffer);
expectType<boolean>(unicornsResult.isForcefullyTerminated);
expectType<keyof SignalConstants | undefined>(unicornsResult.signal);
expectType<string | undefined>(unicornsResult.signalDescription);
expectType<string>(unicornsResult.cwd);
expectType<number>(unicornsResult.durationMs);
expectType<Result[]>(unicornsResult.pipedFrom);

const unicornsResultSync = execaSync('unicorns', {all: true});
expectAssignable<SyncResult>(unicornsResultSync);
expectType<string>(unicornsResultSync.command);
expectType<string>(unicornsResultSync.escapedCommand);
expectType<number | undefined>(unicornsResultSync.exitCode);
expectType<boolean>(unicornsResultSync.failed);
expectType<boolean>(unicornsResultSync.timedOut);
expectType<boolean>(unicornsResultSync.isCanceled);
expectType<boolean>(unicornsResultSync.isGracefullyCanceled);
expectType<boolean>(unicornsResultSync.isTerminated);
expectType<boolean>(unicornsResultSync.isMaxBuffer);
expectType<boolean>(unicornsResultSync.isForcefullyTerminated);
expectType<keyof SignalConstants | undefined>(unicornsResultSync.signal);
expectType<string | undefined>(unicornsResultSync.signalDescription);
expectType<string>(unicornsResultSync.cwd);
expectType<number>(unicornsResultSync.durationMs);
expectType<[]>(unicornsResultSync.pipedFrom);

const error = new Error('.');
if (error instanceof ExecaError) {
	expectType<ExecaError<any>>(error);
	expectType<'ExecaError'>(error.name);
	expectType<string>(error.message);
	expectType<number | undefined>(error.exitCode);
	expectType<boolean>(error.failed);
	expectType<boolean>(error.timedOut);
	expectType<boolean>(error.isCanceled);
	expectType<boolean>(error.isGracefullyCanceled);
	expectType<boolean>(error.isTerminated);
	expectType<boolean>(error.isMaxBuffer);
	expectType<boolean>(error.isForcefullyTerminated);
	expectType<keyof SignalConstants | undefined>(error.signal);
	expectType<string | undefined>(error.signalDescription);
	expectType<string>(error.cwd);
	expectType<number>(error.durationMs);
	expectType<string>(error.shortMessage);
	expectType<string>(error.originalMessage);
	expectType<string | undefined>(error.code);
	expectType<unknown>(error.cause);
	expectType<Result[]>(error.pipedFrom);
}

const errorSync = new Error('.');
if (errorSync instanceof ExecaSyncError) {
	expectType<ExecaSyncError<any>>(errorSync);
	expectType<'ExecaSyncError'>(errorSync.name);
	expectType<string>(errorSync.message);
	expectType<number | undefined>(errorSync.exitCode);
	expectType<boolean>(errorSync.failed);
	expectType<boolean>(errorSync.timedOut);
	expectType<boolean>(errorSync.isCanceled);
	expectType<boolean>(errorSync.isGracefullyCanceled);
	expectType<boolean>(errorSync.isTerminated);
	expectType<boolean>(errorSync.isMaxBuffer);
	expectType<boolean>(errorSync.isForcefullyTerminated);
	expectType<keyof SignalConstants | undefined>(errorSync.signal);
	expectType<string | undefined>(errorSync.signalDescription);
	expectType<string>(errorSync.cwd);
	expectType<number>(errorSync.durationMs);
	expectType<string>(errorSync.shortMessage);
	expectType<string>(errorSync.originalMessage);
	expectType<string | undefined>(errorSync.code);
	expectType<unknown>(errorSync.cause);
	expectType<[]>(errorSync.pipedFrom);
}
