import {expectType, expectError, expectAssignable} from 'tsd';
import {execa, type Result, type ResultPromise} from '../../index.js';

const fileUrl = new URL('file:///test');
const stringArray = ['foo', 'bar'] as const;

expectError(execa());
expectError(execa(true));
expectError(execa(['unicorns', 'arg']));
expectAssignable<ResultPromise>(execa('unicorns'));
expectAssignable<ResultPromise>(execa(fileUrl));

expectAssignable<ResultPromise>(execa('unicorns', []));
expectAssignable<ResultPromise>(execa('unicorns', ['foo']));
expectError(execa('unicorns', 'foo'));
expectError(execa('unicorns', [true]));

expectAssignable<ResultPromise>(execa('unicorns', {}));
expectAssignable<ResultPromise>(execa('unicorns', [], {}));
expectError(execa('unicorns', [], []));
expectError(execa('unicorns', {other: true}));

expectAssignable<ResultPromise>(execa`unicorns`);
expectType<Result<{}>>(await execa('unicorns'));
expectType<Result<{}>>(await execa`unicorns`);

expectAssignable<typeof execa>(execa({}));
expectAssignable<ResultPromise>(execa({})('unicorns'));
expectAssignable<ResultPromise>(execa({})`unicorns`);

expectAssignable<{stdout: string}>(await execa('unicorns'));
expectAssignable<{stdout: Uint8Array}>(await execa('unicorns', {encoding: 'buffer'}));
expectAssignable<{stdout: string}>(await execa('unicorns', ['foo']));
expectAssignable<{stdout: Uint8Array}>(await execa('unicorns', ['foo'], {encoding: 'buffer'}));
expectAssignable<{stdout: string}>(await execa({})('unicorns'));
expectAssignable<{stdout: Uint8Array}>(await execa({encoding: 'buffer'})('unicorns'));
expectAssignable<{stdout: Uint8Array}>(await execa({})({encoding: 'buffer'})('unicorns'));
expectAssignable<{stdout: Uint8Array}>(await execa({encoding: 'buffer'})({})('unicorns'));
expectAssignable<{stdout: string}>(await execa({})`unicorns`);
expectAssignable<{stdout: Uint8Array}>(await execa({encoding: 'buffer'})`unicorns`);
expectAssignable<{stdout: Uint8Array}>(await execa({})({encoding: 'buffer'})`unicorns`);
expectAssignable<{stdout: Uint8Array}>(await execa({encoding: 'buffer'})({})`unicorns`);

expectType<Result<{}>>(await execa`${'unicorns'}`);
expectType<Result<{}>>(await execa`unicorns ${'foo'}`);
expectType<Result<{}>>(await execa`unicorns ${'foo'} ${'bar'}`);
expectType<Result<{}>>(await execa`unicorns ${1}`);
expectType<Result<{}>>(await execa`unicorns ${stringArray}`);
expectType<Result<{}>>(await execa`unicorns ${[1, 2]}`);
expectType<Result<{}>>(await execa`unicorns ${false.toString()}`);
expectError(await execa`unicorns ${false}`);

expectType<Result<{}>>(await execa`unicorns ${await execa`echo foo`}`);
expectError(await execa`unicorns ${execa`echo foo`}`);
expectType<Result<{}>>(await execa`unicorns ${[await execa`echo foo`, 'bar']}`);
expectError(await execa`unicorns ${[execa`echo foo`, 'bar']}`);
