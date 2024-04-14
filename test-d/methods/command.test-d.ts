import {expectType, expectError, expectAssignable} from 'tsd';
import {
	execaCommand,
	execaCommandSync,
	type ExecaResult,
	type ExecaSubprocess,
	type ExecaSyncResult,
} from '../../index.js';

const fileUrl = new URL('file:///test');
const stringArray = ['foo', 'bar'] as const;

expectError(execaCommand());
expectError(execaCommand(true));
expectError(execaCommand(['unicorns', 'arg']));
expectAssignable<ExecaSubprocess>(execaCommand('unicorns'));
expectError(execaCommand(fileUrl));

expectError(execaCommand('unicorns', []));
expectError(execaCommand('unicorns', ['foo']));
expectError(execaCommand('unicorns', 'foo'));
expectError(execaCommand('unicorns', [true]));

expectAssignable<ExecaSubprocess>(execaCommand('unicorns', {}));
expectError(execaCommand('unicorns', [], {}));
expectError(execaCommand('unicorns', [], []));
expectError(execaCommand('unicorns', {other: true}));

expectAssignable<ExecaSubprocess>(execaCommand`unicorns`);
expectType<ExecaResult<{}>>(await execaCommand('unicorns'));
expectType<ExecaResult<{}>>(await execaCommand`unicorns`);

expectAssignable<typeof execaCommand>(execaCommand({}));
expectAssignable<ExecaSubprocess>(execaCommand({})('unicorns'));
expectAssignable<ExecaSubprocess>(execaCommand({})`unicorns`);

expectAssignable<{stdout: string}>(await execaCommand('unicorns'));
expectAssignable<{stdout: Uint8Array}>(await execaCommand('unicorns', {encoding: 'buffer'}));
expectAssignable<{stdout: string}>(await execaCommand({})('unicorns'));
expectAssignable<{stdout: Uint8Array}>(await execaCommand({encoding: 'buffer'})('unicorns'));
expectAssignable<{stdout: Uint8Array}>(await execaCommand({})({encoding: 'buffer'})('unicorns'));
expectAssignable<{stdout: Uint8Array}>(await execaCommand({encoding: 'buffer'})({})('unicorns'));
expectAssignable<{stdout: string}>(await execaCommand({})`unicorns`);
expectAssignable<{stdout: Uint8Array}>(await execaCommand({encoding: 'buffer'})`unicorns`);
expectAssignable<{stdout: Uint8Array}>(await execaCommand({})({encoding: 'buffer'})`unicorns`);
expectAssignable<{stdout: Uint8Array}>(await execaCommand({encoding: 'buffer'})({})`unicorns`);

expectType<ExecaResult<{}>>(await execaCommand`${'unicorns'}`);
expectType<ExecaResult<{}>>(await execaCommand`unicorns ${'foo'}`);
expectError(await execaCommand`unicorns ${'foo'} ${'bar'}`);
expectError(await execaCommand`unicorns ${1}`);
expectError(await execaCommand`unicorns ${stringArray}`);
expectError(await execaCommand`unicorns ${[1, 2]}`);
expectType<ExecaResult<{}>>(await execaCommand`unicorns ${false.toString()}`);
expectError(await execaCommand`unicorns ${false}`);

expectError(await execaCommand`unicorns ${await execaCommand`echo foo`}`);
expectError(await execaCommand`unicorns ${execaCommand`echo foo`}`);
expectError(await execaCommand`unicorns ${[await execaCommand`echo foo`, 'bar']}`);
expectError(await execaCommand`unicorns ${[execaCommand`echo foo`, 'bar']}`);

expectError(execaCommandSync());
expectError(execaCommandSync(true));
expectError(execaCommandSync(['unicorns', 'arg']));
expectType<ExecaSyncResult<{}>>(execaCommandSync('unicorns'));
expectError(execaCommandSync(fileUrl));
expectError(execaCommandSync('unicorns', []));
expectError(execaCommandSync('unicorns', ['foo']));
expectType<ExecaSyncResult<{}>>(execaCommandSync('unicorns', {}));
expectError(execaCommandSync('unicorns', [], {}));
expectError(execaCommandSync('unicorns', 'foo'));
expectError(execaCommandSync('unicorns', [true]));
expectError(execaCommandSync('unicorns', [], []));
expectError(execaCommandSync('unicorns', {other: true}));
expectType<ExecaSyncResult<{}>>(execaCommandSync`unicorns`);
expectAssignable<typeof execaCommandSync>(execaCommandSync({}));
expectType<ExecaSyncResult<{}>>(execaCommandSync({})('unicorns'));
expectType<ExecaSyncResult<{}>>(execaCommandSync({})`unicorns`);
expectType<ExecaSyncResult<{}>>(execaCommandSync('unicorns'));
expectType<ExecaSyncResult<{}>>(execaCommandSync`unicorns`);
expectAssignable<{stdout: string}>(execaCommandSync('unicorns'));
expectAssignable<{stdout: Uint8Array}>(execaCommandSync('unicorns', {encoding: 'buffer'}));
expectAssignable<{stdout: string}>(execaCommandSync({})('unicorns'));
expectAssignable<{stdout: Uint8Array}>(execaCommandSync({encoding: 'buffer'})('unicorns'));
expectAssignable<{stdout: Uint8Array}>(execaCommandSync({})({encoding: 'buffer'})('unicorns'));
expectAssignable<{stdout: Uint8Array}>(execaCommandSync({encoding: 'buffer'})({})('unicorns'));
expectAssignable<{stdout: string}>(execaCommandSync({})`unicorns`);
expectAssignable<{stdout: Uint8Array}>(execaCommandSync({encoding: 'buffer'})`unicorns`);
expectAssignable<{stdout: Uint8Array}>(execaCommandSync({})({encoding: 'buffer'})`unicorns`);
expectAssignable<{stdout: Uint8Array}>(execaCommandSync({encoding: 'buffer'})({})`unicorns`);
expectType<ExecaSyncResult<{}>>(execaCommandSync`${'unicorns'}`);
expectType<ExecaSyncResult<{}>>(execaCommandSync`unicorns ${'foo'}`);
expectError(execaCommandSync`unicorns ${'foo'} ${'bar'}`);
expectError(execaCommandSync`unicorns ${1}`);
expectError(execaCommandSync`unicorns ${stringArray}`);
expectError(execaCommandSync`unicorns ${[1, 2]}`);
expectError(execaCommandSync`unicorns ${execaCommandSync`echo foo`}`);
expectError(execaCommandSync`unicorns ${[execaCommandSync`echo foo`, 'bar']}`);
expectType<ExecaSyncResult<{}>>(execaCommandSync`unicorns ${false.toString()}`);
expectError(execaCommandSync`unicorns ${false}`);
