import {expectType, expectError, expectAssignable} from 'tsd';
import {execaSync, type SyncResult} from '../../index.js';

const fileUrl = new URL('file:///test');
const stringArray = ['foo', 'bar'] as const;

expectError(execaSync());
expectError(execaSync(true));
expectError(execaSync(['unicorns', 'arg']));
expectType<SyncResult<{}>>(execaSync('unicorns'));
expectType<SyncResult<{}>>(execaSync(fileUrl));

expectType<SyncResult<{}>>(execaSync('unicorns', []));
expectType<SyncResult<{}>>(execaSync('unicorns', ['foo']));
expectError(execaSync('unicorns', 'foo'));
expectError(execaSync('unicorns', [true]));

expectType<SyncResult<{}>>(execaSync('unicorns', {}));
expectType<SyncResult<{}>>(execaSync('unicorns', [], {}));
expectError(execaSync('unicorns', [], []));
expectError(execaSync('unicorns', {other: true}));

expectType<SyncResult<{}>>(execaSync`unicorns`);
expectType<SyncResult<{}>>(execaSync('unicorns'));
expectType<SyncResult<{}>>(execaSync`unicorns`);

expectAssignable<typeof execaSync>(execaSync({}));
expectType<SyncResult<{}>>(execaSync({})('unicorns'));
expectType<SyncResult<{}>>(execaSync({})`unicorns`);

expectAssignable<{stdout: string}>(execaSync('unicorns'));
expectAssignable<{stdout: Uint8Array}>(execaSync('unicorns', {encoding: 'buffer'}));
expectAssignable<{stdout: string}>(execaSync('unicorns', ['foo']));
expectAssignable<{stdout: Uint8Array}>(execaSync('unicorns', ['foo'], {encoding: 'buffer'}));
expectAssignable<{stdout: string}>(execaSync({})('unicorns'));
expectAssignable<{stdout: Uint8Array}>(execaSync({encoding: 'buffer'})('unicorns'));
expectAssignable<{stdout: Uint8Array}>(execaSync({})({encoding: 'buffer'})('unicorns'));
expectAssignable<{stdout: Uint8Array}>(execaSync({encoding: 'buffer'})({})('unicorns'));
expectAssignable<{stdout: string}>(execaSync({})`unicorns`);
expectAssignable<{stdout: Uint8Array}>(execaSync({encoding: 'buffer'})`unicorns`);
expectAssignable<{stdout: Uint8Array}>(execaSync({})({encoding: 'buffer'})`unicorns`);
expectAssignable<{stdout: Uint8Array}>(execaSync({encoding: 'buffer'})({})`unicorns`);

expectType<SyncResult<{}>>(execaSync`${'unicorns'}`);
expectType<SyncResult<{}>>(execaSync`unicorns ${'foo'}`);
expectType<SyncResult<{}>>(execaSync`unicorns ${'foo'} ${'bar'}`);
expectType<SyncResult<{}>>(execaSync`unicorns ${1}`);
expectType<SyncResult<{}>>(execaSync`unicorns ${stringArray}`);
expectType<SyncResult<{}>>(execaSync`unicorns ${[1, 2]}`);
expectType<SyncResult<{}>>(execaSync`unicorns ${false.toString()}`);
expectError(execaSync`unicorns ${false}`);

expectType<SyncResult<{}>>(execaSync`unicorns ${execaSync`echo foo`}`);
expectType<SyncResult<{}>>(execaSync`unicorns ${execaSync({reject: false})`echo foo`}`);
expectType<SyncResult<{}>>(execaSync`unicorns ${[execaSync`echo foo`, 'bar']}`);
