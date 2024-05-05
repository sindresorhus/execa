import {expectType, expectError, expectAssignable} from 'tsd';
import {$, type SyncResult} from '../../index.js';

const fileUrl = new URL('file:///test');
const stringArray = ['foo', 'bar'] as const;

expectError($.sync());
expectError($.sync(true));
expectError($.sync(['unicorns', 'arg']));
expectType<SyncResult<{}>>($.sync('unicorns'));
expectType<SyncResult<{}>>($.sync(fileUrl));

expectType<SyncResult<{}>>($.sync('unicorns', []));
expectType<SyncResult<{}>>($.sync('unicorns', ['foo']));
expectError($.sync('unicorns', 'foo'));
expectError($.sync('unicorns', [true]));

expectType<SyncResult<{}>>($.sync('unicorns', {}));
expectType<SyncResult<{}>>($.sync('unicorns', [], {}));
expectError($.sync('unicorns', [], []));
expectError($.sync('unicorns', {other: true}));

expectType<SyncResult<{}>>($.sync`unicorns`);
expectType<SyncResult<{}>>($.sync('unicorns'));
expectType<SyncResult<{}>>($.sync`unicorns`);

expectAssignable<typeof $.sync>($.sync({}));
expectType<SyncResult<{}>>($.sync({})('unicorns'));
expectType<SyncResult<{}>>($({}).sync('unicorns'));
expectType<SyncResult<{}>>($.sync({})`unicorns`);
expectType<SyncResult<{}>>($({}).sync`unicorns`);

expectAssignable<{stdout: string}>($.sync('unicorns'));
expectAssignable<{stdout: Uint8Array}>($.sync('unicorns', {encoding: 'buffer'}));
expectAssignable<{stdout: string}>($.sync('unicorns', ['foo']));
expectAssignable<{stdout: Uint8Array}>($.sync('unicorns', ['foo'], {encoding: 'buffer'}));
expectAssignable<{stdout: string}>($.sync({})('unicorns'));
expectAssignable<{stdout: string}>($({}).sync('unicorns'));
expectAssignable<{stdout: Uint8Array}>($.sync({encoding: 'buffer'})('unicorns'));
expectAssignable<{stdout: Uint8Array}>($({encoding: 'buffer'}).sync('unicorns'));
expectAssignable<{stdout: Uint8Array}>($.sync({})({encoding: 'buffer'})('unicorns'));
expectAssignable<{stdout: Uint8Array}>($({})({encoding: 'buffer'}).sync('unicorns'));
expectAssignable<{stdout: Uint8Array}>($.sync({encoding: 'buffer'})({})('unicorns'));
expectAssignable<{stdout: Uint8Array}>($({encoding: 'buffer'}).sync({})('unicorns'));
expectAssignable<{stdout: string}>($.sync({})`unicorns`);
expectAssignable<{stdout: string}>($({}).sync`unicorns`);
expectAssignable<{stdout: Uint8Array}>($.sync({encoding: 'buffer'})`unicorns`);
expectAssignable<{stdout: Uint8Array}>($({encoding: 'buffer'}).sync`unicorns`);
expectAssignable<{stdout: Uint8Array}>($.sync({})({encoding: 'buffer'})`unicorns`);
expectAssignable<{stdout: Uint8Array}>($({})({encoding: 'buffer'}).sync`unicorns`);
expectAssignable<{stdout: Uint8Array}>($.sync({encoding: 'buffer'})({})`unicorns`);
expectAssignable<{stdout: Uint8Array}>($({encoding: 'buffer'}).sync({})`unicorns`);

expectType<SyncResult<{}>>($.sync`${'unicorns'}`);
expectType<SyncResult<{}>>($.sync`unicorns ${'foo'}`);
expectType<SyncResult<{}>>($.sync`unicorns ${'foo'} ${'bar'}`);
expectType<SyncResult<{}>>($.sync`unicorns ${1}`);
expectType<SyncResult<{}>>($.sync`unicorns ${stringArray}`);
expectType<SyncResult<{}>>($.sync`unicorns ${[1, 2]}`);
expectType<SyncResult<{}>>($.sync`unicorns ${false.toString()}`);
expectError($.sync`unicorns ${false}`);

expectType<SyncResult<{}>>($.sync`unicorns ${$.sync`echo foo`}`);
expectType<SyncResult<{}>>($.sync`unicorns ${$.sync({reject: false})`echo foo`}`);
expectType<SyncResult<{}>>($.sync`unicorns ${[$.sync`echo foo`, 'bar']}`);
