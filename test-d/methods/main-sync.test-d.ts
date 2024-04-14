import {expectType, expectError, expectAssignable} from 'tsd';
import {execaSync, type ExecaSyncResult} from '../../index.js';

const fileUrl = new URL('file:///test');
const stringArray = ['foo', 'bar'] as const;

expectError(execaSync());
expectError(execaSync(true));
expectError(execaSync(['unicorns', 'arg']));
expectType<ExecaSyncResult<{}>>(execaSync('unicorns'));
expectType<ExecaSyncResult<{}>>(execaSync(fileUrl));

expectType<ExecaSyncResult<{}>>(execaSync('unicorns', []));
expectType<ExecaSyncResult<{}>>(execaSync('unicorns', ['foo']));
expectError(execaSync('unicorns', 'foo'));
expectError(execaSync('unicorns', [true]));

expectType<ExecaSyncResult<{}>>(execaSync('unicorns', {}));
expectType<ExecaSyncResult<{}>>(execaSync('unicorns', [], {}));
expectError(execaSync('unicorns', [], []));
expectError(execaSync('unicorns', {other: true}));

expectType<ExecaSyncResult<{}>>(execaSync`unicorns`);
expectType<ExecaSyncResult<{}>>(execaSync('unicorns'));
expectType<ExecaSyncResult<{}>>(execaSync`unicorns`);

expectAssignable<typeof execaSync>(execaSync({}));
expectType<ExecaSyncResult<{}>>(execaSync({})('unicorns'));
expectType<ExecaSyncResult<{}>>(execaSync({})`unicorns`);

expectAssignable<{stdout: string}>(execaSync('unicorns'));
expectAssignable<{stdout: Uint8Array}>(execaSync('unicorns', {encoding: 'buffer'}));
expectAssignable<{stdout: string}>(execaSync('unicorns', ['foo']));
expectAssignable<{stdout: Uint8Array}>(execaSync('unicorns', ['foo'], {encoding: 'buffer'}));
expectAssignable<{stdout: string}>(execaSync({})('unicorns'));
expectAssignable<{stdout: Uint8Array}>(execaSync({encoding: 'buffer'})('unicorns'));
expectAssignable<{stdout: Uint8Array}>(execaSync({})({encoding: 'buffer'})('unicorns'));
expectAssignable<{stdout: Uint8Array}>(execaSync({encoding: 'buffer'})({})('unicorns'));
expectAssignable<{stdout: string}>(execaSync({})`unicorns`);
expectAssignable<{stdout: Uint8Array}>(execaSync({encoding: 'buffer'})`unicorns`);
expectAssignable<{stdout: Uint8Array}>(execaSync({})({encoding: 'buffer'})`unicorns`);
expectAssignable<{stdout: Uint8Array}>(execaSync({encoding: 'buffer'})({})`unicorns`);

expectType<ExecaSyncResult<{}>>(execaSync`${'unicorns'}`);
expectType<ExecaSyncResult<{}>>(execaSync`unicorns ${'foo'}`);
expectType<ExecaSyncResult<{}>>(execaSync`unicorns ${'foo'} ${'bar'}`);
expectType<ExecaSyncResult<{}>>(execaSync`unicorns ${1}`);
expectType<ExecaSyncResult<{}>>(execaSync`unicorns ${stringArray}`);
expectType<ExecaSyncResult<{}>>(execaSync`unicorns ${[1, 2]}`);
expectType<ExecaSyncResult<{}>>(execaSync`unicorns ${false.toString()}`);
expectError(execaSync`unicorns ${false}`);

expectType<ExecaSyncResult<{}>>(execaSync`unicorns ${execaSync`echo foo`}`);
expectType<ExecaSyncResult<{}>>(execaSync`unicorns ${[execaSync`echo foo`, 'bar']}`);
