import {expectType, expectError, expectAssignable} from 'tsd';
import {execa, type ExecaResult, type ExecaResultPromise} from '../../index.js';

const fileUrl = new URL('file:///test');
const stringArray = ['foo', 'bar'] as const;

expectError(execa());
expectError(execa(true));
expectError(execa(['unicorns', 'arg']));
expectAssignable<ExecaResultPromise>(execa('unicorns'));
expectAssignable<ExecaResultPromise>(execa(fileUrl));

expectAssignable<ExecaResultPromise>(execa('unicorns', []));
expectAssignable<ExecaResultPromise>(execa('unicorns', ['foo']));
expectError(execa('unicorns', 'foo'));
expectError(execa('unicorns', [true]));

expectAssignable<ExecaResultPromise>(execa('unicorns', {}));
expectAssignable<ExecaResultPromise>(execa('unicorns', [], {}));
expectError(execa('unicorns', [], []));
expectError(execa('unicorns', {other: true}));

expectAssignable<ExecaResultPromise>(execa`unicorns`);
expectType<ExecaResult<{}>>(await execa('unicorns'));
expectType<ExecaResult<{}>>(await execa`unicorns`);

expectAssignable<typeof execa>(execa({}));
expectAssignable<ExecaResultPromise>(execa({})('unicorns'));
expectAssignable<ExecaResultPromise>(execa({})`unicorns`);

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

expectType<ExecaResult<{}>>(await execa`${'unicorns'}`);
expectType<ExecaResult<{}>>(await execa`unicorns ${'foo'}`);
expectType<ExecaResult<{}>>(await execa`unicorns ${'foo'} ${'bar'}`);
expectType<ExecaResult<{}>>(await execa`unicorns ${1}`);
expectType<ExecaResult<{}>>(await execa`unicorns ${stringArray}`);
expectType<ExecaResult<{}>>(await execa`unicorns ${[1, 2]}`);
expectType<ExecaResult<{}>>(await execa`unicorns ${false.toString()}`);
expectError(await execa`unicorns ${false}`);

expectType<ExecaResult<{}>>(await execa`unicorns ${await execa`echo foo`}`);
expectError(await execa`unicorns ${execa`echo foo`}`);
expectType<ExecaResult<{}>>(await execa`unicorns ${[await execa`echo foo`, 'bar']}`);
expectError(await execa`unicorns ${[execa`echo foo`, 'bar']}`);
