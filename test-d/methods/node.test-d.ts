import {expectType, expectError, expectAssignable} from 'tsd';
import {execaNode, type ExecaResult, type ExecaResultPromise} from '../../index.js';

const fileUrl = new URL('file:///test');
const stringArray = ['foo', 'bar'] as const;

expectError(execaNode());
expectError(execaNode(true));
expectError(execaNode(['unicorns', 'arg']));
expectAssignable<ExecaResultPromise>(execaNode('unicorns'));
expectAssignable<ExecaResultPromise>(execaNode(fileUrl));

expectAssignable<ExecaResultPromise>(execaNode('unicorns', []));
expectAssignable<ExecaResultPromise>(execaNode('unicorns', ['foo']));
expectError(execaNode('unicorns', 'foo'));
expectError(execaNode('unicorns', [true]));

expectAssignable<ExecaResultPromise>(execaNode('unicorns', {}));
expectAssignable<ExecaResultPromise>(execaNode('unicorns', [], {}));
expectError(execaNode('unicorns', [], []));
expectError(execaNode('unicorns', {other: true}));

expectAssignable<ExecaResultPromise>(execaNode`unicorns`);
expectType<ExecaResult<{}>>(await execaNode('unicorns'));
expectType<ExecaResult<{}>>(await execaNode`unicorns`);

expectAssignable<typeof execaNode>(execaNode({}));
expectAssignable<ExecaResultPromise>(execaNode({})('unicorns'));
expectAssignable<ExecaResultPromise>(execaNode({})`unicorns`);

expectAssignable<{stdout: string}>(await execaNode('unicorns'));
expectAssignable<{stdout: Uint8Array}>(await execaNode('unicorns', {encoding: 'buffer'}));
expectAssignable<{stdout: string}>(await execaNode('unicorns', ['foo']));
expectAssignable<{stdout: Uint8Array}>(await execaNode('unicorns', ['foo'], {encoding: 'buffer'}));
expectAssignable<{stdout: string}>(await execaNode({})('unicorns'));
expectAssignable<{stdout: Uint8Array}>(await execaNode({encoding: 'buffer'})('unicorns'));
expectAssignable<{stdout: Uint8Array}>(await execaNode({})({encoding: 'buffer'})('unicorns'));
expectAssignable<{stdout: Uint8Array}>(await execaNode({encoding: 'buffer'})({})('unicorns'));
expectAssignable<{stdout: string}>(await execaNode({})`unicorns`);
expectAssignable<{stdout: Uint8Array}>(await execaNode({encoding: 'buffer'})`unicorns`);
expectAssignable<{stdout: Uint8Array}>(await execaNode({})({encoding: 'buffer'})`unicorns`);
expectAssignable<{stdout: Uint8Array}>(await execaNode({encoding: 'buffer'})({})`unicorns`);

expectType<ExecaResult<{}>>(await execaNode`${'unicorns'}`);
expectType<ExecaResult<{}>>(await execaNode`unicorns ${'foo'}`);
expectType<ExecaResult<{}>>(await execaNode`unicorns ${'foo'} ${'bar'}`);
expectType<ExecaResult<{}>>(await execaNode`unicorns ${1}`);
expectType<ExecaResult<{}>>(await execaNode`unicorns ${stringArray}`);
expectType<ExecaResult<{}>>(await execaNode`unicorns ${[1, 2]}`);
expectType<ExecaResult<{}>>(await execaNode`unicorns ${false.toString()}`);
expectError(await execaNode`unicorns ${false}`);

expectType<ExecaResult<{}>>(await execaNode`unicorns ${await execaNode`echo foo`}`);
expectError(await execaNode`unicorns ${execaNode`echo foo`}`);
expectType<ExecaResult<{}>>(await execaNode`unicorns ${[await execaNode`echo foo`, 'bar']}`);
expectError(await execaNode`unicorns ${[execaNode`echo foo`, 'bar']}`);

expectAssignable<ExecaResultPromise>(execaNode('unicorns', {nodePath: './node'}));
expectAssignable<ExecaResultPromise>(execaNode('unicorns', {nodePath: fileUrl}));
expectAssignable<{stdout: string}>(await execaNode('unicorns', {nodeOptions: ['--async-stack-traces']}));
expectAssignable<{stdout: Uint8Array}>(await execaNode('unicorns', {nodeOptions: ['--async-stack-traces'], encoding: 'buffer'}));
expectAssignable<{stdout: string}>(await execaNode('unicorns', ['foo'], {nodeOptions: ['--async-stack-traces']}));
expectAssignable<{stdout: Uint8Array}>(await execaNode('unicorns', ['foo'], {nodeOptions: ['--async-stack-traces'], encoding: 'buffer'}));
