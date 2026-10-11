import type {SignalConstants} from 'node:os';
import {expectTypeOf} from 'nz';
import {
	execa,
	execaSync,
	ExecaError,
	ExecaSyncError,
	type Result,
	type SyncResult,
} from '../../index.js';

type AnyChunk = string | Uint8Array | string[] | unknown[] | undefined;
expectTypeOf<Result['stdout']>().toBe<AnyChunk>();
expectTypeOf<Result['stderr']>().toBe<AnyChunk>();
expectTypeOf<Result['all']>().toBe<AnyChunk>();
expectTypeOf<Result['stdio']>().toBeAssignableTo<[undefined, AnyChunk, AnyChunk, ...AnyChunk[]]>();
expectTypeOf<SyncResult['stdout']>().toBe<AnyChunk>();
expectTypeOf<SyncResult['stderr']>().toBe<AnyChunk>();
expectTypeOf<SyncResult['all']>().toBe<AnyChunk>();
expectTypeOf<SyncResult['stdio']>().toBeAssignableTo<[undefined, AnyChunk, AnyChunk, ...AnyChunk[]]>();

const unicornsResult = await execa('unicorns', {all: true});
expectTypeOf(unicornsResult).toBeAssignableTo<Result>();
expectTypeOf(unicornsResult.command).toBe<string>();
expectTypeOf(unicornsResult.escapedCommand).toBe<string>();
expectTypeOf(unicornsResult.exitCode).toBe<number | undefined>();
expectTypeOf(unicornsResult.failed).toBe<boolean>();
expectTypeOf(unicornsResult.timedOut).toBe<boolean>();
expectTypeOf(unicornsResult.isCanceled).toBe<boolean>();
expectTypeOf(unicornsResult.isGracefullyCanceled).toBe<boolean>();
expectTypeOf(unicornsResult.isTerminated).toBe<boolean>();
expectTypeOf(unicornsResult.isMaxBuffer).toBe<boolean>();
expectTypeOf(unicornsResult.isForcefullyTerminated).toBe<boolean>();
expectTypeOf(unicornsResult.signal).toBe<keyof SignalConstants | undefined>();
expectTypeOf(unicornsResult.signalDescription).toBe<string | undefined>();
expectTypeOf(unicornsResult.cwd).toBe<string>();
expectTypeOf(unicornsResult.durationMs).toBe<number>();
expectTypeOf(unicornsResult.pipedFrom).toBe<Array<Result | ExecaError>>();

const unicornsResultSync = execaSync('unicorns', {all: true});
expectTypeOf(unicornsResultSync).toBeAssignableTo<SyncResult>();
expectTypeOf(unicornsResultSync.command).toBe<string>();
expectTypeOf(unicornsResultSync.escapedCommand).toBe<string>();
expectTypeOf(unicornsResultSync.exitCode).toBe<number | undefined>();
expectTypeOf(unicornsResultSync.failed).toBe<boolean>();
expectTypeOf(unicornsResultSync.timedOut).toBe<boolean>();
expectTypeOf(unicornsResultSync.isCanceled).toBe<boolean>();
expectTypeOf(unicornsResultSync.isGracefullyCanceled).toBe<boolean>();
expectTypeOf(unicornsResultSync.isTerminated).toBe<boolean>();
expectTypeOf(unicornsResultSync.isMaxBuffer).toBe<boolean>();
expectTypeOf(unicornsResultSync.isForcefullyTerminated).toBe<boolean>();
expectTypeOf(unicornsResultSync.signal).toBe<keyof SignalConstants | undefined>();
expectTypeOf(unicornsResultSync.signalDescription).toBe<string | undefined>();
expectTypeOf(unicornsResultSync.cwd).toBe<string>();
expectTypeOf(unicornsResultSync.durationMs).toBe<number>();
expectTypeOf(unicornsResultSync.pipedFrom).toBe<[]>();

const error = new Error('.');
if (error instanceof ExecaError) {
	expectTypeOf(error).toBe<ExecaError<any>>();
	expectTypeOf(error.name).toBe<'ExecaError'>();
	expectTypeOf(error.message).toBe<string>();
	expectTypeOf(error.exitCode).toBe<number | undefined>();
	expectTypeOf(error.failed).toBe<boolean>();
	expectTypeOf(error.timedOut).toBe<boolean>();
	expectTypeOf(error.isCanceled).toBe<boolean>();
	expectTypeOf(error.isGracefullyCanceled).toBe<boolean>();
	expectTypeOf(error.isTerminated).toBe<boolean>();
	expectTypeOf(error.isMaxBuffer).toBe<boolean>();
	expectTypeOf(error.isForcefullyTerminated).toBe<boolean>();
	expectTypeOf(error.signal).toBe<keyof SignalConstants | undefined>();
	expectTypeOf(error.signalDescription).toBe<string | undefined>();
	expectTypeOf(error.cwd).toBe<string>();
	expectTypeOf(error.durationMs).toBe<number>();
	expectTypeOf(error.shortMessage).toBe<string>();
	expectTypeOf(error.originalMessage).toBe<string>();
	expectTypeOf(error.code).toBe<string | undefined>();
	expectTypeOf(error.cause).toBe<unknown>();
	expectTypeOf(error.pipedFrom).toBe<Array<Result | ExecaError>>();
}

const errorSync = new Error('.');
if (errorSync instanceof ExecaSyncError) {
	expectTypeOf(errorSync).toBe<ExecaSyncError<any>>();
	expectTypeOf(errorSync.name).toBe<'ExecaSyncError'>();
	expectTypeOf(errorSync.message).toBe<string>();
	expectTypeOf(errorSync.exitCode).toBe<number | undefined>();
	expectTypeOf(errorSync.failed).toBe<boolean>();
	expectTypeOf(errorSync.timedOut).toBe<boolean>();
	expectTypeOf(errorSync.isCanceled).toBe<boolean>();
	expectTypeOf(errorSync.isGracefullyCanceled).toBe<boolean>();
	expectTypeOf(errorSync.isTerminated).toBe<boolean>();
	expectTypeOf(errorSync.isMaxBuffer).toBe<boolean>();
	expectTypeOf(errorSync.isForcefullyTerminated).toBe<boolean>();
	expectTypeOf(errorSync.signal).toBe<keyof SignalConstants | undefined>();
	expectTypeOf(errorSync.signalDescription).toBe<string | undefined>();
	expectTypeOf(errorSync.cwd).toBe<string>();
	expectTypeOf(errorSync.durationMs).toBe<number>();
	expectTypeOf(errorSync.shortMessage).toBe<string>();
	expectTypeOf(errorSync.originalMessage).toBe<string>();
	expectTypeOf(errorSync.code).toBe<string | undefined>();
	expectTypeOf(errorSync.cause).toBe<unknown>();
	expectTypeOf(errorSync.pipedFrom).toBe<[]>();
}
