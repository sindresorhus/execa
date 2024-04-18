import {expectType, expectError, expectAssignable} from 'tsd';
import {$, type ExecaSyncResult} from '../../index.js';

const fileUrl = new URL('file:///test');
const stringArray = ['foo', 'bar'] as const;

expectError($.s());
expectError($.s(true));
expectError($.s(['unicorns', 'arg']));
expectType<ExecaSyncResult<{}>>($.s('unicorns'));
expectType<ExecaSyncResult<{}>>($.s(fileUrl));

expectType<ExecaSyncResult<{}>>($.s('unicorns', []));
expectType<ExecaSyncResult<{}>>($.s('unicorns', ['foo']));
expectError($.s('unicorns', 'foo'));
expectError($.s('unicorns', [true]));

expectType<ExecaSyncResult<{}>>($.s('unicorns', {}));
expectType<ExecaSyncResult<{}>>($.s('unicorns', [], {}));
expectError($.s('unicorns', [], []));
expectError($.s('unicorns', {other: true}));

expectType<ExecaSyncResult<{}>>($.s`unicorns`);
expectType<ExecaSyncResult<{}>>($.s('unicorns'));
expectType<ExecaSyncResult<{}>>($.s`unicorns`);

expectAssignable<typeof $.s>($.s({}));
expectType<ExecaSyncResult<{}>>($.s({})('unicorns'));
expectType<ExecaSyncResult<{}>>($({}).s('unicorns'));
expectType<ExecaSyncResult<{}>>($.s({})`unicorns`);
expectType<ExecaSyncResult<{}>>($({}).s`unicorns`);

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

expectType<ExecaSyncResult<{}>>($.s`${'unicorns'}`);
expectType<ExecaSyncResult<{}>>($.s`unicorns ${'foo'}`);
expectType<ExecaSyncResult<{}>>($.s`unicorns ${'foo'} ${'bar'}`);
expectType<ExecaSyncResult<{}>>($.s`unicorns ${1}`);
expectType<ExecaSyncResult<{}>>($.s`unicorns ${stringArray}`);
expectType<ExecaSyncResult<{}>>($.s`unicorns ${[1, 2]}`);
expectType<ExecaSyncResult<{}>>($.s`unicorns ${false.toString()}`);
expectError($.s`unicorns ${false}`);

expectType<ExecaSyncResult<{}>>($.s`unicorns ${$.s`echo foo`}`);
expectType<ExecaSyncResult<{}>>($.s`unicorns ${[$.s`echo foo`, 'bar']}`);
