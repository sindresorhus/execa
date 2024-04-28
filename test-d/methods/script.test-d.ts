import {expectType, expectError, expectAssignable} from 'tsd';
import {$, type Result, type ResultPromise} from '../../index.js';

const fileUrl = new URL('file:///test');
const stringArray = ['foo', 'bar'] as const;

expectError($());
expectError($(true));
expectError($(['unicorns', 'arg']));
expectAssignable<ResultPromise>($('unicorns'));
expectAssignable<ResultPromise>($(fileUrl));

expectAssignable<ResultPromise>($('unicorns', []));
expectAssignable<ResultPromise>($('unicorns', ['foo']));
expectError($('unicorns', 'foo'));
expectError($('unicorns', [true]));

expectAssignable<ResultPromise>($('unicorns', {}));
expectAssignable<ResultPromise>($('unicorns', [], {}));
expectError($('unicorns', [], []));
expectError($('unicorns', {other: true}));

expectAssignable<ResultPromise>($`unicorns`);
expectType<Result<{}>>(await $('unicorns'));
expectType<Result<{}>>(await $`unicorns`);

expectAssignable<typeof $>($({}));
expectAssignable<ResultPromise>($({})('unicorns'));
expectAssignable<ResultPromise>($({})`unicorns`);

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

expectType<Result<{}>>(await $`${'unicorns'}`);
expectType<Result<{}>>(await $`unicorns ${'foo'}`);
expectType<Result<{}>>(await $`unicorns ${'foo'} ${'bar'}`);
expectType<Result<{}>>(await $`unicorns ${1}`);
expectType<Result<{}>>(await $`unicorns ${stringArray}`);
expectType<Result<{}>>(await $`unicorns ${[1, 2]}`);
expectType<Result<{}>>(await $`unicorns ${false.toString()}`);
expectError(await $`unicorns ${false}`);

expectType<Result<{}>>(await $`unicorns ${await $`echo foo`}`);
expectError(await $`unicorns ${$`echo foo`}`);
expectType<Result<{}>>(await $`unicorns ${[await $`echo foo`, 'bar']}`);
expectError(await $`unicorns ${[$`echo foo`, 'bar']}`);
