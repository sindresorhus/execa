import {expectType, expectError, expectAssignable} from 'tsd';
import {$, type ExecaResult, type ExecaResultPromise} from '../../index.js';

const fileUrl = new URL('file:///test');
const stringArray = ['foo', 'bar'] as const;

expectError($());
expectError($(true));
expectError($(['unicorns', 'arg']));
expectAssignable<ExecaResultPromise>($('unicorns'));
expectAssignable<ExecaResultPromise>($(fileUrl));

expectAssignable<ExecaResultPromise>($('unicorns', []));
expectAssignable<ExecaResultPromise>($('unicorns', ['foo']));
expectError($('unicorns', 'foo'));
expectError($('unicorns', [true]));

expectAssignable<ExecaResultPromise>($('unicorns', {}));
expectAssignable<ExecaResultPromise>($('unicorns', [], {}));
expectError($('unicorns', [], []));
expectError($('unicorns', {other: true}));

expectAssignable<ExecaResultPromise>($`unicorns`);
expectType<ExecaResult<{}>>(await $('unicorns'));
expectType<ExecaResult<{}>>(await $`unicorns`);

expectAssignable<typeof $>($({}));
expectAssignable<ExecaResultPromise>($({})('unicorns'));
expectAssignable<ExecaResultPromise>($({})`unicorns`);

expectAssignable<{stdout: string}>(await $('unicorns'));
expectAssignable<{stdout: Uint8Array}>(await $('unicorns', {encoding: 'buffer'}));
expectAssignable<{stdout: string}>(await $('unicorns', ['foo']));
expectAssignable<{stdout: Uint8Array}>(await $('unicorns', ['foo'], {encoding: 'buffer'}));
expectAssignable<{stdout: string}>(await $({})('unicorns'));
expectAssignable<{stdout: Uint8Array}>(await $({encoding: 'buffer'})('unicorns'));
expectAssignable<{stdout: Uint8Array}>(await $({})({encoding: 'buffer'})('unicorns'));
expectAssignable<{stdout: Uint8Array}>(await $({encoding: 'buffer'})({})('unicorns'));
expectAssignable<{stdout: string}>(await $({})`unicorns`);
expectAssignable<{stdout: Uint8Array}>(await $({encoding: 'buffer'})`unicorns`);
expectAssignable<{stdout: Uint8Array}>(await $({})({encoding: 'buffer'})`unicorns`);
expectAssignable<{stdout: Uint8Array}>(await $({encoding: 'buffer'})({})`unicorns`);

expectType<ExecaResult<{}>>(await $`${'unicorns'}`);
expectType<ExecaResult<{}>>(await $`unicorns ${'foo'}`);
expectType<ExecaResult<{}>>(await $`unicorns ${'foo'} ${'bar'}`);
expectType<ExecaResult<{}>>(await $`unicorns ${1}`);
expectType<ExecaResult<{}>>(await $`unicorns ${stringArray}`);
expectType<ExecaResult<{}>>(await $`unicorns ${[1, 2]}`);
expectType<ExecaResult<{}>>(await $`unicorns ${false.toString()}`);
expectError(await $`unicorns ${false}`);

expectType<ExecaResult<{}>>(await $`unicorns ${await $`echo foo`}`);
expectError(await $`unicorns ${$`echo foo`}`);
expectType<ExecaResult<{}>>(await $`unicorns ${[await $`echo foo`, 'bar']}`);
expectError(await $`unicorns ${[$`echo foo`, 'bar']}`);
