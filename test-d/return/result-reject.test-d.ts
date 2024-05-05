import {expectType, expectError, expectAssignable} from 'tsd';
import {
	type Result,
	type SyncResult,
	execa,
	execaSync,
} from '../../index.js';

const rejectsResult = await execa('unicorns');
expectAssignable<Result>(rejectsResult);
expectError(rejectsResult.stack?.toString());
expectError(rejectsResult.message?.toString());
expectError(rejectsResult.shortMessage?.toString());
expectError(rejectsResult.originalMessage?.toString());
expectError(rejectsResult.code?.toString());
expectError(rejectsResult.cause?.valueOf());

const noRejectsResult = await execa('unicorns', {reject: false});
expectAssignable<Result>(noRejectsResult);
expectType<string | undefined>(noRejectsResult.stack);
expectType<string | undefined>(noRejectsResult.message);
expectType<string | undefined>(noRejectsResult.shortMessage);
expectType<string | undefined>(noRejectsResult.originalMessage);
expectType<string | undefined>(noRejectsResult.code);
expectType<unknown>(noRejectsResult.cause);

const rejectsSyncResult = execaSync('unicorns');
expectAssignable<SyncResult>(rejectsSyncResult);
expectError(rejectsSyncResult.stack?.toString());
expectError(rejectsSyncResult.message?.toString());
expectError(rejectsSyncResult.shortMessage?.toString());
expectError(rejectsSyncResult.originalMessage?.toString());
expectError(rejectsSyncResult.code?.toString());
expectError(rejectsSyncResult.cause?.valueOf());

const noRejectsSyncResult = execaSync('unicorns', {reject: false});
expectAssignable<SyncResult>(noRejectsSyncResult);
expectType<string | undefined>(noRejectsSyncResult.stack);
expectType<string | undefined>(noRejectsSyncResult.message);
expectType<string | undefined>(noRejectsSyncResult.shortMessage);
expectType<string | undefined>(noRejectsSyncResult.originalMessage);
