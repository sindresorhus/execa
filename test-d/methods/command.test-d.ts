import {expectType, expectError, expectAssignable} from 'tsd';
import {
	execaCommand,
	execaCommandSync,
	type Result,
	type ResultPromise,
	type SyncResult,
} from '../../index.js';

const fileUrl = new URL('file:///test');
const stringArray = ['foo', 'bar'] as const;

expectError(execaCommand());
expectError(execaCommand(true));
expectError(execaCommand(['unicorns', 'arg']));
expectAssignable<ResultPromise>(execaCommand('unicorns'));
expectError(execaCommand(fileUrl));

expectError(execaCommand('unicorns', []));
expectError(execaCommand('unicorns', ['foo']));
expectError(execaCommand('unicorns', 'foo'));
expectError(execaCommand('unicorns', [true]));

expectAssignable<ResultPromise>(execaCommand('unicorns', {}));
expectError(execaCommand('unicorns', [], {}));
expectError(execaCommand('unicorns', [], []));
expectError(execaCommand('unicorns', {other: true}));

expectAssignable<ResultPromise>(execaCommand`unicorns`);
expectType<Result<{}>>(await execaCommand('unicorns'));
expectType<Result<{}>>(await execaCommand`unicorns`);

expectAssignable<typeof execaCommand>(execaCommand({}));
expectAssignable<ResultPromise>(execaCommand({})('unicorns'));
expectAssignable<ResultPromise>(execaCommand({})`unicorns`);

expectAssignable<{stdout: string}>(await execaCommand('unicorns'));
expectAssignable<{stdout: Uint8Array}>(await execaCommand('unicorns', {encoding: 'buffer'}));
expectAssignable<{stdout: string}>(await execaCommand({})('unicorns'));
expectAssignable<{stdout: Uint8Array}>(await execaCommand({encoding: 'buffer'})('unicorns'));
expectAssignable<{stdout: Uint8Array}>(await execaCommand({})({encoding: 'buffer'})('unicorns'));
expectAssignable<{stdout: Uint8Array}>(await execaCommand({encoding: 'buffer'})({})('unicorns'));
expectAssignable<{stdout: string}>(await execaCommand({})`unicorns`);
expectAssignable<{stdout: Uint8Array}>(await execaCommand({encoding: 'buffer'})`unicorns`);
expectAssignable<{stdout: Uint8Array}>(await execaCommand({})({encoding: 'buffer'})`unicorns`);
expectAssignable<{stdout: Uint8Array}>(await execaCommand({encoding: 'buffer'})({})`unicorns`);

expectType<Result<{}>>(await execaCommand`${'unicorns'}`);
expectType<Result<{}>>(await execaCommand`unicorns ${'foo'}`);
expectError(await execaCommand`unicorns ${'foo'} ${'bar'}`);
expectError(await execaCommand`unicorns ${1}`);
expectError(await execaCommand`unicorns ${stringArray}`);
expectError(await execaCommand`unicorns ${[1, 2]}`);
expectType<Result<{}>>(await execaCommand`unicorns ${false.toString()}`);
expectError(await execaCommand`unicorns ${false}`);

expectError(await execaCommand`unicorns ${await execaCommand`echo foo`}`);
expectError(await execaCommand`unicorns ${execaCommand`echo foo`}`);
expectError(await execaCommand`unicorns ${[await execaCommand`echo foo`, 'bar']}`);
expectError(await execaCommand`unicorns ${[execaCommand`echo foo`, 'bar']}`);

expectError(execaCommandSync());
expectError(execaCommandSync(true));
expectError(execaCommandSync(['unicorns', 'arg']));
expectType<SyncResult<{}>>(execaCommandSync('unicorns'));
expectError(execaCommandSync(fileUrl));
expectError(execaCommandSync('unicorns', []));
expectError(execaCommandSync('unicorns', ['foo']));
expectType<SyncResult<{}>>(execaCommandSync('unicorns', {}));
expectError(execaCommandSync('unicorns', [], {}));
expectError(execaCommandSync('unicorns', 'foo'));
expectError(execaCommandSync('unicorns', [true]));
expectError(execaCommandSync('unicorns', [], []));
expectError(execaCommandSync('unicorns', {other: true}));
expectType<SyncResult<{}>>(execaCommandSync`unicorns`);
expectAssignable<typeof execaCommandSync>(execaCommandSync({}));
expectType<SyncResult<{}>>(execaCommandSync({})('unicorns'));
expectType<SyncResult<{}>>(execaCommandSync({})`unicorns`);
expectType<SyncResult<{}>>(execaCommandSync('unicorns'));
expectType<SyncResult<{}>>(execaCommandSync`unicorns`);
expectAssignable<{stdout: string}>(execaCommandSync('unicorns'));
expectAssignable<{stdout: Uint8Array}>(execaCommandSync('unicorns', {encoding: 'buffer'}));
expectAssignable<{stdout: string}>(execaCommandSync({})('unicorns'));
expectAssignable<{stdout: Uint8Array}>(execaCommandSync({encoding: 'buffer'})('unicorns'));
expectAssignable<{stdout: Uint8Array}>(execaCommandSync({})({encoding: 'buffer'})('unicorns'));
expectAssignable<{stdout: Uint8Array}>(execaCommandSync({encoding: 'buffer'})({})('unicorns'));
expectAssignable<{stdout: string}>(execaCommandSync({})`unicorns`);
expectAssignable<{stdout: Uint8Array}>(execaCommandSync({encoding: 'buffer'})`unicorns`);
expectAssignable<{stdout: Uint8Array}>(execaCommandSync({})({encoding: 'buffer'})`unicorns`);
expectAssignable<{stdout: Uint8Array}>(execaCommandSync({encoding: 'buffer'})({})`unicorns`);
expectType<SyncResult<{}>>(execaCommandSync`${'unicorns'}`);
expectType<SyncResult<{}>>(execaCommandSync`unicorns ${'foo'}`);
expectError(execaCommandSync`unicorns ${'foo'} ${'bar'}`);
expectError(execaCommandSync`unicorns ${1}`);
expectError(execaCommandSync`unicorns ${stringArray}`);
expectError(execaCommandSync`unicorns ${[1, 2]}`);
expectError(execaCommandSync`unicorns ${execaCommandSync`echo foo`}`);
expectError(execaCommandSync`unicorns ${[execaCommandSync`echo foo`, 'bar']}`);
expectType<SyncResult<{}>>(execaCommandSync`unicorns ${false.toString()}`);
expectError(execaCommandSync`unicorns ${false}`);
