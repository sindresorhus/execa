import {expectType, expectError, expectAssignable} from 'tsd';
import {$, type SyncResult} from '../../index.js';

const fileUrl = new URL('file:///test');
const stringArray = ['foo', 'bar'] as const;

expectError($.s());
expectError($.s(true));
expectError($.s(['unicorns', 'arg']));
expectType<SyncResult<{}>>($.s('unicorns'));
expectType<SyncResult<{}>>($.s(fileUrl));

expectType<SyncResult<{}>>($.s('unicorns', []));
expectType<SyncResult<{}>>($.s('unicorns', ['foo']));
expectError($.s('unicorns', 'foo'));
expectError($.s('unicorns', [true]));

expectType<SyncResult<{}>>($.s('unicorns', {}));
expectType<SyncResult<{}>>($.s('unicorns', [], {}));
expectError($.s('unicorns', [], []));
expectError($.s('unicorns', {other: true}));

expectType<SyncResult<{}>>($.s`unicorns`);
expectType<SyncResult<{}>>($.s('unicorns'));
expectType<SyncResult<{}>>($.s`unicorns`);

expectAssignable<typeof $.s>($.s({}));
expectType<SyncResult<{}>>($.s({})('unicorns'));
expectType<SyncResult<{}>>($({}).s('unicorns'));
expectType<SyncResult<{}>>($.s({})`unicorns`);
expectType<SyncResult<{}>>($({}).s`unicorns`);

expectAssignable<{stdout: string}>($.s('unicorns'));
expectAssignable<{stdout: Uint8Array}>($.s('unicorns', {encoding: 'buffer'}));
expectAssignable<{stdout: string}>($.s('unicorns', ['foo']));
expectAssignable<{stdout: Uint8Array}>($.s('unicorns', ['foo'], {encoding: 'buffer'}));
expectAssignable<{stdout: string}>($.s({})('unicorns'));
expectAssignable<{stdout: string}>($({}).s('unicorns'));
expectAssignable<{stdout: Uint8Array}>($.s({encoding: 'buffer'})('unicorns'));
expectAssignable<{stdout: Uint8Array}>($({encoding: 'buffer'}).s('unicorns'));
expectAssignable<{stdout: Uint8Array}>($.s({})({encoding: 'buffer'})('unicorns'));
expectAssignable<{stdout: Uint8Array}>($({})({encoding: 'buffer'}).s('unicorns'));
expectAssignable<{stdout: Uint8Array}>($.s({encoding: 'buffer'})({})('unicorns'));
expectAssignable<{stdout: Uint8Array}>($({encoding: 'buffer'}).s({})('unicorns'));
expectAssignable<{stdout: string}>($.s({})`unicorns`);
expectAssignable<{stdout: string}>($({}).s`unicorns`);
expectAssignable<{stdout: Uint8Array}>($.s({encoding: 'buffer'})`unicorns`);
expectAssignable<{stdout: Uint8Array}>($({encoding: 'buffer'}).s`unicorns`);
expectAssignable<{stdout: Uint8Array}>($.s({})({encoding: 'buffer'})`unicorns`);
expectAssignable<{stdout: Uint8Array}>($({})({encoding: 'buffer'}).s`unicorns`);
expectAssignable<{stdout: Uint8Array}>($.s({encoding: 'buffer'})({})`unicorns`);
expectAssignable<{stdout: Uint8Array}>($({encoding: 'buffer'}).s({})`unicorns`);

expectType<SyncResult<{}>>($.s`${'unicorns'}`);
expectType<SyncResult<{}>>($.s`unicorns ${'foo'}`);
expectType<SyncResult<{}>>($.s`unicorns ${'foo'} ${'bar'}`);
expectType<SyncResult<{}>>($.s`unicorns ${1}`);
expectType<SyncResult<{}>>($.s`unicorns ${stringArray}`);
expectType<SyncResult<{}>>($.s`unicorns ${[1, 2]}`);
expectType<SyncResult<{}>>($.s`unicorns ${false.toString()}`);
expectError($.s`unicorns ${false}`);

expectType<SyncResult<{}>>($.s`unicorns ${$.s`echo foo`}`);
expectType<SyncResult<{}>>($.s`unicorns ${[$.s`echo foo`, 'bar']}`);
