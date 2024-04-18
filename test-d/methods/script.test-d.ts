import {expectType, expectError, expectAssignable} from 'tsd';
import {$, type ExecaResult, type ExecaSubprocess} from '../../index.js';

const fileUrl = new URL('file:///test');
const stringArray = ['foo', 'bar'] as const;

expectError($());
expectError($(true));
expectError($(['unicorns', 'arg']));
expectAssignable<ExecaSubprocess>($('unicorns'));
expectAssignable<ExecaSubprocess>($(fileUrl));

expectAssignable<ExecaSubprocess>($('unicorns', []));
expectAssignable<ExecaSubprocess>($('unicorns', ['foo']));
expectError($('unicorns', 'foo'));
expectError($('unicorns', [true]));

expectAssignable<ExecaSubprocess>($('unicorns', {}));
expectAssignable<ExecaSubprocess>($('unicorns', [], {}));
expectError($('unicorns', [], []));
expectError($('unicorns', {other: true}));

expectAssignable<ExecaSubprocess>($`unicorns`);
expectType<ExecaResult<{}>>(await $('unicorns'));
expectType<ExecaResult<{}>>(await $`unicorns`);

expectAssignable<typeof $>($({}));
expectAssignable<ExecaSubprocess>($({})('unicorns'));
expectAssignable<ExecaSubprocess>($({})`unicorns`);

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
