import {expectTypeOf, expectError} from 'nz';
import {execaSync, type SyncResult} from '../../index.js';

const fileUrl = new URL('file:///test');
const stringArray = ['foo', 'bar'] as const;

expectError(execaSync());
expectError(execaSync(true));
expectError(execaSync(['unicorns', 'arg']));
expectTypeOf(execaSync('unicorns')).toBe<SyncResult<{}>>();
expectTypeOf(execaSync(fileUrl)).toBe<SyncResult<{}>>();

expectTypeOf(execaSync('unicorns', [])).toBe<SyncResult<{}>>();
expectTypeOf(execaSync('unicorns', ['foo'])).toBe<SyncResult<{}>>();
expectError(execaSync('unicorns', 'foo'));
expectError(execaSync('unicorns', [true]));

expectTypeOf(execaSync('unicorns', {})).toBe<SyncResult<{}>>();
expectTypeOf(execaSync('unicorns', [], {})).toBe<SyncResult<{}>>();
expectError(execaSync('unicorns', [], []));
expectError(execaSync('unicorns', {other: true}));

expectTypeOf(execaSync`unicorns`).toBe<SyncResult<{}>>();
expectTypeOf(execaSync('unicorns')).toBe<SyncResult<{}>>();
expectTypeOf(execaSync`unicorns`).toBe<SyncResult<{}>>();

expectTypeOf(execaSync({})).toBeAssignableTo<typeof execaSync>();
expectTypeOf(execaSync({})('unicorns')).toBe<SyncResult<{}>>();
expectTypeOf(execaSync({})`unicorns`).toBe<SyncResult<{}>>();

expectTypeOf(execaSync('unicorns')).toBeAssignableTo<{stdout: string}>();
expectTypeOf(execaSync('unicorns', {encoding: 'buffer'})).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(execaSync('unicorns', ['foo'])).toBeAssignableTo<{stdout: string}>();
expectTypeOf(execaSync('unicorns', ['foo'], {encoding: 'buffer'})).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(execaSync({})('unicorns')).toBeAssignableTo<{stdout: string}>();
expectTypeOf(execaSync({encoding: 'buffer'})('unicorns')).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(execaSync({})({encoding: 'buffer'})('unicorns')).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(execaSync({encoding: 'buffer'})({})('unicorns')).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(execaSync({})`unicorns`).toBeAssignableTo<{stdout: string}>();
expectTypeOf(execaSync({encoding: 'buffer'})`unicorns`).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(execaSync({})({encoding: 'buffer'})`unicorns`).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(execaSync({encoding: 'buffer'})({})`unicorns`).toBeAssignableTo<{stdout: Uint8Array}>();

expectTypeOf(execaSync`${'unicorns'}`).toBe<SyncResult<{}>>();
expectTypeOf(execaSync`unicorns ${'foo'}`).toBe<SyncResult<{}>>();
expectTypeOf(execaSync`unicorns ${'foo'} ${'bar'}`).toBe<SyncResult<{}>>();
expectTypeOf(execaSync`unicorns ${1}`).toBe<SyncResult<{}>>();
expectTypeOf(execaSync`unicorns ${stringArray}`).toBe<SyncResult<{}>>();
expectTypeOf(execaSync`unicorns ${[1, 2]}`).toBe<SyncResult<{}>>();
expectTypeOf(execaSync`unicorns ${false.toString()}`).toBe<SyncResult<{}>>();
expectError(execaSync`unicorns ${false}`);

expectTypeOf(execaSync`unicorns ${execaSync`echo foo`}`).toBe<SyncResult<{}>>();
expectTypeOf(execaSync`unicorns ${execaSync({reject: false})`echo foo`}`).toBe<SyncResult<{}>>();
expectTypeOf(execaSync`unicorns ${[execaSync`echo foo`, 'bar']}`).toBe<SyncResult<{}>>();
