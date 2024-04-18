import {expectType, expectError, expectAssignable} from 'tsd';
import {$, type ExecaSyncResult} from '../../index.js';

const fileUrl = new URL('file:///test');
const stringArray = ['foo', 'bar'] as const;

expectError($.sync());
expectError($.sync(true));
expectError($.sync(['unicorns', 'arg']));
expectType<ExecaSyncResult<{}>>($.sync('unicorns'));
expectType<ExecaSyncResult<{}>>($.sync(fileUrl));

expectType<ExecaSyncResult<{}>>($.sync('unicorns', []));
expectType<ExecaSyncResult<{}>>($.sync('unicorns', ['foo']));
expectError($.sync('unicorns', 'foo'));
expectError($.sync('unicorns', [true]));

expectType<ExecaSyncResult<{}>>($.sync('unicorns', {}));
expectType<ExecaSyncResult<{}>>($.sync('unicorns', [], {}));
expectError($.sync('unicorns', [], []));
expectError($.sync('unicorns', {other: true}));

expectType<ExecaSyncResult<{}>>($.sync`unicorns`);
expectType<ExecaSyncResult<{}>>($.sync('unicorns'));
expectType<ExecaSyncResult<{}>>($.sync`unicorns`);

expectAssignable<typeof $.sync>($.sync({}));
expectType<ExecaSyncResult<{}>>($.sync({})('unicorns'));
expectType<ExecaSyncResult<{}>>($({}).sync('unicorns'));
expectType<ExecaSyncResult<{}>>($.sync({})`unicorns`);
expectType<ExecaSyncResult<{}>>($({}).sync`unicorns`);

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

expectType<ExecaSyncResult<{}>>($.sync`${'unicorns'}`);
expectType<ExecaSyncResult<{}>>($.sync`unicorns ${'foo'}`);
expectType<ExecaSyncResult<{}>>($.sync`unicorns ${'foo'} ${'bar'}`);
expectType<ExecaSyncResult<{}>>($.sync`unicorns ${1}`);
expectType<ExecaSyncResult<{}>>($.sync`unicorns ${stringArray}`);
expectType<ExecaSyncResult<{}>>($.sync`unicorns ${[1, 2]}`);
expectType<ExecaSyncResult<{}>>($.sync`unicorns ${false.toString()}`);
expectError($.sync`unicorns ${false}`);

expectType<ExecaSyncResult<{}>>($.sync`unicorns ${$.sync`echo foo`}`);
expectType<ExecaSyncResult<{}>>($.sync`unicorns ${[$.sync`echo foo`, 'bar']}`);
