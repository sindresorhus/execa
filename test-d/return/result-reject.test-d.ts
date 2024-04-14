import {expectType, expectError} from 'tsd';
import {execa, execaSync} from '../../index.js';

const rejectsResult = await execa('unicorns');
expectError(rejectsResult.stack?.toString());
expectError(rejectsResult.message?.toString());
expectError(rejectsResult.shortMessage?.toString());
expectError(rejectsResult.originalMessage?.toString());
expectError(rejectsResult.code?.toString());
expectError(rejectsResult.cause?.valueOf());

const noRejectsResult = await execa('unicorns', {reject: false});
expectType<string | undefined>(noRejectsResult.stack);
expectType<string | undefined>(noRejectsResult.message);
expectType<string | undefined>(noRejectsResult.shortMessage);
expectType<string | undefined>(noRejectsResult.originalMessage);
expectType<string | undefined>(noRejectsResult.code);
expectType<unknown>(noRejectsResult.cause);

const rejectsSyncResult = execaSync('unicorns');
expectError(rejectsSyncResult.stack?.toString());
expectError(rejectsSyncResult.message?.toString());
expectError(rejectsSyncResult.shortMessage?.toString());
expectError(rejectsSyncResult.originalMessage?.toString());
expectError(rejectsSyncResult.code?.toString());
expectError(rejectsSyncResult.cause?.valueOf());

const noRejectsSyncResult = execaSync('unicorns', {reject: false});
expectType<string | undefined>(noRejectsSyncResult.stack);
expectType<string | undefined>(noRejectsSyncResult.message);
expectType<string | undefined>(noRejectsSyncResult.shortMessage);
expectType<string | undefined>(noRejectsSyncResult.originalMessage);
