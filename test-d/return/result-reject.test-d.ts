import {expectTypeOf, expectError} from 'nz';
import {
	type Result,
	type SyncResult,
	execa,
	execaSync,
} from '../../index.js';

const rejectsResult = await execa('unicorns');
expectTypeOf(rejectsResult).toBeAssignableTo<Result>();
expectError(rejectsResult.stack?.toString());
expectError(rejectsResult.message?.toString());
expectError(rejectsResult.shortMessage?.toString());
expectError(rejectsResult.originalMessage?.toString());
expectError(rejectsResult.code?.toString());
expectError(rejectsResult.cause?.valueOf());

const noRejectsResult = await execa('unicorns', {reject: false});
expectTypeOf(noRejectsResult).toBeAssignableTo<Result>();
expectTypeOf(noRejectsResult.stack).toBe<string | undefined>();
expectTypeOf(noRejectsResult.message).toBe<string | undefined>();
expectTypeOf(noRejectsResult.shortMessage).toBe<string | undefined>();
expectTypeOf(noRejectsResult.originalMessage).toBe<string | undefined>();
expectTypeOf(noRejectsResult.code).toBe<string | undefined>();
expectTypeOf(noRejectsResult.cause).toBe<unknown>();

const rejectsSyncResult = execaSync('unicorns');
expectTypeOf(rejectsSyncResult).toBeAssignableTo<SyncResult>();
expectError(rejectsSyncResult.stack?.toString());
expectError(rejectsSyncResult.message?.toString());
expectError(rejectsSyncResult.shortMessage?.toString());
expectError(rejectsSyncResult.originalMessage?.toString());
expectError(rejectsSyncResult.code?.toString());
expectError(rejectsSyncResult.cause?.valueOf());

const noRejectsSyncResult = execaSync('unicorns', {reject: false});
expectTypeOf(noRejectsSyncResult).toBeAssignableTo<SyncResult>();
expectTypeOf(noRejectsSyncResult.stack).toBe<string | undefined>();
expectTypeOf(noRejectsSyncResult.message).toBe<string | undefined>();
expectTypeOf(noRejectsSyncResult.shortMessage).toBe<string | undefined>();
expectTypeOf(noRejectsSyncResult.originalMessage).toBe<string | undefined>();
