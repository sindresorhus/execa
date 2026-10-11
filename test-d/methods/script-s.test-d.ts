import {expectTypeOf, expectError} from 'nz';
import {$, type SyncResult} from '../../index.js';

const fileUrl = new URL('file:///test');
const stringArray = ['foo', 'bar'] as const;

expectError($.s());
expectError($.s(true));
expectError($.s(['unicorns', 'arg']));
expectTypeOf($.s('unicorns')).toBe<SyncResult<{}>>();
expectTypeOf($.s(fileUrl)).toBe<SyncResult<{}>>();

expectTypeOf($.s('unicorns', [])).toBe<SyncResult<{}>>();
expectTypeOf($.s('unicorns', ['foo'])).toBe<SyncResult<{}>>();
expectError($.s('unicorns', 'foo'));
expectError($.s('unicorns', [true]));

expectTypeOf($.s('unicorns', {})).toBe<SyncResult<{}>>();
expectTypeOf($.s('unicorns', [], {})).toBe<SyncResult<{}>>();
expectError($.s('unicorns', [], []));
expectError($.s('unicorns', {other: true}));

expectTypeOf($.s`unicorns`).toBe<SyncResult<{}>>();
expectTypeOf($.s('unicorns')).toBe<SyncResult<{}>>();
expectTypeOf($.s`unicorns`).toBe<SyncResult<{}>>();

expectTypeOf($.s({})).toBeAssignableTo<typeof $.s>();
expectTypeOf($.s({})('unicorns')).toBe<SyncResult<{}>>();
expectTypeOf($({}).s('unicorns')).toBe<SyncResult<{}>>();
expectTypeOf($.s({})`unicorns`).toBe<SyncResult<{}>>();
expectTypeOf($({}).s`unicorns`).toBe<SyncResult<{}>>();

expectTypeOf($.s('unicorns')).toBeAssignableTo<{stdout: string}>();
expectTypeOf($.s('unicorns', {encoding: 'buffer'})).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf($.s('unicorns', ['foo'])).toBeAssignableTo<{stdout: string}>();
expectTypeOf($.s('unicorns', ['foo'], {encoding: 'buffer'})).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf($.s({})('unicorns')).toBeAssignableTo<{stdout: string}>();
expectTypeOf($({}).s('unicorns')).toBeAssignableTo<{stdout: string}>();
expectTypeOf($.s({encoding: 'buffer'})('unicorns')).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf($({encoding: 'buffer'}).s('unicorns')).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf($.s({})({encoding: 'buffer'})('unicorns')).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf($({})({encoding: 'buffer'}).s('unicorns')).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf($.s({encoding: 'buffer'})({})('unicorns')).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf($({encoding: 'buffer'}).s({})('unicorns')).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf($.s({})`unicorns`).toBeAssignableTo<{stdout: string}>();
expectTypeOf($({}).s`unicorns`).toBeAssignableTo<{stdout: string}>();
expectTypeOf($.s({encoding: 'buffer'})`unicorns`).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf($({encoding: 'buffer'}).s`unicorns`).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf($.s({})({encoding: 'buffer'})`unicorns`).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf($({})({encoding: 'buffer'}).s`unicorns`).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf($.s({encoding: 'buffer'})({})`unicorns`).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf($({encoding: 'buffer'}).s({})`unicorns`).toBeAssignableTo<{stdout: Uint8Array}>();

expectTypeOf($.s`${'unicorns'}`).toBe<SyncResult<{}>>();
expectTypeOf($.s`unicorns ${'foo'}`).toBe<SyncResult<{}>>();
expectTypeOf($.s`unicorns ${'foo'} ${'bar'}`).toBe<SyncResult<{}>>();
expectTypeOf($.s`unicorns ${1}`).toBe<SyncResult<{}>>();
expectTypeOf($.s`unicorns ${stringArray}`).toBe<SyncResult<{}>>();
expectTypeOf($.s`unicorns ${[1, 2]}`).toBe<SyncResult<{}>>();
expectTypeOf($.s`unicorns ${false.toString()}`).toBe<SyncResult<{}>>();
expectError($.s`unicorns ${false}`);

expectTypeOf($.s`unicorns ${$.s`echo foo`}`).toBe<SyncResult<{}>>();
expectTypeOf($.s`unicorns ${$.s({reject: false})`echo foo`}`).toBe<SyncResult<{}>>();
expectTypeOf($.s`unicorns ${[$.s`echo foo`, 'bar']}`).toBe<SyncResult<{}>>();
