import {expectTypeOf, expectError} from 'nz';
import {$, type SyncResult} from '../../index.js';

const fileUrl = new URL('file:///test');
const stringArray = ['foo', 'bar'] as const;

expectError($.sync());
expectError($.sync(true));
expectError($.sync(['unicorns', 'arg']));
expectTypeOf($.sync('unicorns')).toBe<SyncResult<{}>>();
expectTypeOf($.sync(fileUrl)).toBe<SyncResult<{}>>();

expectTypeOf($.sync('unicorns', [])).toBe<SyncResult<{}>>();
expectTypeOf($.sync('unicorns', ['foo'])).toBe<SyncResult<{}>>();
expectError($.sync('unicorns', 'foo'));
expectError($.sync('unicorns', [true]));

expectTypeOf($.sync('unicorns', {})).toBe<SyncResult<{}>>();
expectTypeOf($.sync('unicorns', [], {})).toBe<SyncResult<{}>>();
expectError($.sync('unicorns', [], []));
expectError($.sync('unicorns', {other: true}));

expectTypeOf($.sync`unicorns`).toBe<SyncResult<{}>>();
expectTypeOf($.sync('unicorns')).toBe<SyncResult<{}>>();
expectTypeOf($.sync`unicorns`).toBe<SyncResult<{}>>();

expectTypeOf($.sync({})).toBeAssignableTo<typeof $.sync>();
expectTypeOf($.sync({})('unicorns')).toBe<SyncResult<{}>>();
expectTypeOf($({}).sync('unicorns')).toBe<SyncResult<{}>>();
expectTypeOf($.sync({})`unicorns`).toBe<SyncResult<{}>>();
expectTypeOf($({}).sync`unicorns`).toBe<SyncResult<{}>>();

expectTypeOf($.sync('unicorns')).toBeAssignableTo<{stdout: string}>();
expectTypeOf($.sync('unicorns', {encoding: 'buffer'})).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf($.sync('unicorns', ['foo'])).toBeAssignableTo<{stdout: string}>();
expectTypeOf($.sync('unicorns', ['foo'], {encoding: 'buffer'})).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf($.sync({})('unicorns')).toBeAssignableTo<{stdout: string}>();
expectTypeOf($({}).sync('unicorns')).toBeAssignableTo<{stdout: string}>();
expectTypeOf($.sync({encoding: 'buffer'})('unicorns')).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf($({encoding: 'buffer'}).sync('unicorns')).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf($.sync({})({encoding: 'buffer'})('unicorns')).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf($({})({encoding: 'buffer'}).sync('unicorns')).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf($.sync({encoding: 'buffer'})({})('unicorns')).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf($({encoding: 'buffer'}).sync({})('unicorns')).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf($.sync({})`unicorns`).toBeAssignableTo<{stdout: string}>();
expectTypeOf($({}).sync`unicorns`).toBeAssignableTo<{stdout: string}>();
expectTypeOf($.sync({encoding: 'buffer'})`unicorns`).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf($({encoding: 'buffer'}).sync`unicorns`).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf($.sync({})({encoding: 'buffer'})`unicorns`).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf($({})({encoding: 'buffer'}).sync`unicorns`).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf($.sync({encoding: 'buffer'})({})`unicorns`).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf($({encoding: 'buffer'}).sync({})`unicorns`).toBeAssignableTo<{stdout: Uint8Array}>();

expectTypeOf($.sync`${'unicorns'}`).toBe<SyncResult<{}>>();
expectTypeOf($.sync`unicorns ${'foo'}`).toBe<SyncResult<{}>>();
expectTypeOf($.sync`unicorns ${'foo'} ${'bar'}`).toBe<SyncResult<{}>>();
expectTypeOf($.sync`unicorns ${1}`).toBe<SyncResult<{}>>();
expectTypeOf($.sync`unicorns ${stringArray}`).toBe<SyncResult<{}>>();
expectTypeOf($.sync`unicorns ${[1, 2]}`).toBe<SyncResult<{}>>();
expectTypeOf($.sync`unicorns ${false.toString()}`).toBe<SyncResult<{}>>();
expectError($.sync`unicorns ${false}`);

expectTypeOf($.sync`unicorns ${$.sync`echo foo`}`).toBe<SyncResult<{}>>();
expectTypeOf($.sync`unicorns ${$.sync({reject: false})`echo foo`}`).toBe<SyncResult<{}>>();
expectTypeOf($.sync`unicorns ${[$.sync`echo foo`, 'bar']}`).toBe<SyncResult<{}>>();
