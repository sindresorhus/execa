import {expectTypeOf, expectError} from 'nz';
import {$, type Result, type ResultPromise} from '../../index.js';

const fileUrl = new URL('file:///test');
const stringArray = ['foo', 'bar'] as const;

expectError($());
expectError($(true));
expectError($(['unicorns', 'arg']));
expectTypeOf($('unicorns')).toBeAssignableTo<ResultPromise>();
expectTypeOf($(fileUrl)).toBeAssignableTo<ResultPromise>();

expectTypeOf($('unicorns', [])).toBeAssignableTo<ResultPromise>();
expectTypeOf($('unicorns', ['foo'])).toBeAssignableTo<ResultPromise>();
expectError($('unicorns', 'foo'));
expectError($('unicorns', [true]));

expectTypeOf($('unicorns', {})).toBeAssignableTo<ResultPromise>();
expectTypeOf($('unicorns', [], {})).toBeAssignableTo<ResultPromise>();
expectError($('unicorns', [], []));
expectError($('unicorns', {other: true}));

expectTypeOf($`unicorns`).toBeAssignableTo<ResultPromise>();
expectTypeOf(await $('unicorns')).toBe<Result<{}>>();
expectTypeOf(await $`unicorns`).toBe<Result<{}>>();

expectTypeOf($({})).toBeAssignableTo<typeof $>();
expectTypeOf($({})('unicorns')).toBeAssignableTo<ResultPromise>();
expectTypeOf($({})`unicorns`).toBeAssignableTo<ResultPromise>();

expectTypeOf(await $('unicorns')).toBeAssignableTo<{stdout: string}>();
expectTypeOf(await $('unicorns', {encoding: 'buffer'})).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(await $('unicorns', ['foo'])).toBeAssignableTo<{stdout: string}>();
expectTypeOf(await $('unicorns', ['foo'], {encoding: 'buffer'})).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(await $({})('unicorns')).toBeAssignableTo<{stdout: string}>();
expectTypeOf(await $({encoding: 'buffer'})('unicorns')).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(await $({})({encoding: 'buffer'})('unicorns')).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(await $({encoding: 'buffer'})({})('unicorns')).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(await $({})`unicorns`).toBeAssignableTo<{stdout: string}>();
expectTypeOf(await $({encoding: 'buffer'})`unicorns`).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(await $({})({encoding: 'buffer'})`unicorns`).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(await $({encoding: 'buffer'})({})`unicorns`).toBeAssignableTo<{stdout: Uint8Array}>();

const uint8ArrayGenerator = function * (chunk: Uint8Array) {
	yield chunk;
};

expectError($({encoding: 'utf8', stdout: uint8ArrayGenerator}));
$({encoding: 'buffer', stdout: uint8ArrayGenerator});

expectTypeOf(await $`${'unicorns'}`).toBe<Result<{}>>();
expectTypeOf(await $`unicorns ${'foo'}`).toBe<Result<{}>>();
expectTypeOf(await $`unicorns ${'foo'} ${'bar'}`).toBe<Result<{}>>();
expectTypeOf(await $`unicorns ${1}`).toBe<Result<{}>>();
expectTypeOf(await $`unicorns ${stringArray}`).toBe<Result<{}>>();
expectTypeOf(await $`unicorns ${[1, 2]}`).toBe<Result<{}>>();
expectTypeOf(await $`unicorns ${false.toString()}`).toBe<Result<{}>>();
expectError(await $`unicorns ${false}`);

expectTypeOf(await $`unicorns ${await $`echo foo`}`).toBe<Result<{}>>();
expectTypeOf(await $`unicorns ${await $({reject: false})`echo foo`}`).toBe<Result<{}>>();
expectError(await $`unicorns ${$`echo foo`}`);
expectTypeOf(await $`unicorns ${[await $`echo foo`, 'bar']}`).toBe<Result<{}>>();
expectError(await $`unicorns ${[$`echo foo`, 'bar']}`);
