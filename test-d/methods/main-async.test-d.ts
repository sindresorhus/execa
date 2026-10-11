import {expectTypeOf, expectError} from 'nz';
import {execa, type Result, type ResultPromise} from '../../index.js';

const fileUrl = new URL('file:///test');
const stringArray = ['foo', 'bar'] as const;

expectError(execa());
expectError(execa(true));
expectError(execa(['unicorns', 'arg']));
expectTypeOf(execa('unicorns')).toBeAssignableTo<ResultPromise>();
expectTypeOf(execa(fileUrl)).toBeAssignableTo<ResultPromise>();

expectTypeOf(execa('unicorns', [])).toBeAssignableTo<ResultPromise>();
expectTypeOf(execa('unicorns', ['foo'])).toBeAssignableTo<ResultPromise>();
expectError(execa('unicorns', 'foo'));
expectError(execa('unicorns', [true]));

expectTypeOf(execa('unicorns', {})).toBeAssignableTo<ResultPromise>();
expectTypeOf(execa('unicorns', [], {})).toBeAssignableTo<ResultPromise>();
expectError(execa('unicorns', [], []));
expectError(execa('unicorns', {other: true}));

expectTypeOf(execa`unicorns`).toBeAssignableTo<ResultPromise>();
expectTypeOf(await execa('unicorns')).toBe<Result<{}>>();
expectTypeOf(await execa`unicorns`).toBe<Result<{}>>();

expectTypeOf(execa({})).toBeAssignableTo<typeof execa>();
expectTypeOf(execa({})('unicorns')).toBeAssignableTo<ResultPromise>();
expectTypeOf(execa({})`unicorns`).toBeAssignableTo<ResultPromise>();

expectTypeOf(await execa('unicorns')).toBeAssignableTo<{stdout: string}>();
expectTypeOf(await execa('unicorns', {encoding: 'buffer'})).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(await execa('unicorns', ['foo'])).toBeAssignableTo<{stdout: string}>();
expectTypeOf(await execa('unicorns', ['foo'], {encoding: 'buffer'})).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(await execa({})('unicorns')).toBeAssignableTo<{stdout: string}>();
expectTypeOf(await execa({encoding: 'buffer'})('unicorns')).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(await execa({})({encoding: 'buffer'})('unicorns')).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(await execa({encoding: 'buffer'})({})('unicorns')).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(await execa({})`unicorns`).toBeAssignableTo<{stdout: string}>();
expectTypeOf(await execa({encoding: 'buffer'})`unicorns`).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(await execa({})({encoding: 'buffer'})`unicorns`).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(await execa({encoding: 'buffer'})({})`unicorns`).toBeAssignableTo<{stdout: Uint8Array}>();

expectTypeOf(await execa`${'unicorns'}`).toBe<Result<{}>>();
expectTypeOf(await execa`unicorns ${'foo'}`).toBe<Result<{}>>();
expectTypeOf(await execa`unicorns ${'foo'} ${'bar'}`).toBe<Result<{}>>();
expectTypeOf(await execa`unicorns ${1}`).toBe<Result<{}>>();
expectTypeOf(await execa`unicorns ${stringArray}`).toBe<Result<{}>>();
expectTypeOf(await execa`unicorns ${[1, 2]}`).toBe<Result<{}>>();
expectTypeOf(await execa`unicorns ${false.toString()}`).toBe<Result<{}>>();
expectError(await execa`unicorns ${false}`);

expectTypeOf(await execa`unicorns ${await execa`echo foo`}`).toBe<Result<{}>>();
expectTypeOf(await execa`unicorns ${await execa({reject: false})`echo foo`}`).toBe<Result<{}>>();
expectError(await execa`unicorns ${execa`echo foo`}`);
expectTypeOf(await execa`unicorns ${[await execa`echo foo`, 'bar']}`).toBe<Result<{}>>();
expectError(await execa`unicorns ${[execa`echo foo`, 'bar']}`);
