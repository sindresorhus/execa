import {expectType, expectError, expectAssignable} from 'tsd';
import {execaNode, type Result, type ResultPromise} from '../../index.js';

const fileUrl = new URL('file:///test');
const stringArray = ['foo', 'bar'] as const;

expectError(execaNode());
expectError(execaNode(true));
expectError(execaNode(['unicorns', 'arg']));
expectAssignable<ResultPromise>(execaNode('unicorns'));
expectAssignable<ResultPromise>(execaNode(fileUrl));

expectAssignable<ResultPromise>(execaNode('unicorns', []));
expectAssignable<ResultPromise>(execaNode('unicorns', ['foo']));
expectError(execaNode('unicorns', 'foo'));
expectError(execaNode('unicorns', [true]));

expectAssignable<ResultPromise>(execaNode('unicorns', {}));
expectAssignable<ResultPromise>(execaNode('unicorns', [], {}));
expectError(execaNode('unicorns', [], []));
expectError(execaNode('unicorns', {other: true}));

expectAssignable<ResultPromise>(execaNode`unicorns`);
expectType<Result<{}>>(await execaNode('unicorns'));
expectType<Result<{}>>(await execaNode`unicorns`);

expectAssignable<typeof execaNode>(execaNode({}));
expectAssignable<ResultPromise>(execaNode({})('unicorns'));
expectAssignable<ResultPromise>(execaNode({})`unicorns`);

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

expectType<Result<{}>>(await execaNode`${'unicorns'}`);
expectType<Result<{}>>(await execaNode`unicorns ${'foo'}`);
expectType<Result<{}>>(await execaNode`unicorns ${'foo'} ${'bar'}`);
expectType<Result<{}>>(await execaNode`unicorns ${1}`);
expectType<Result<{}>>(await execaNode`unicorns ${stringArray}`);
expectType<Result<{}>>(await execaNode`unicorns ${[1, 2]}`);
expectType<Result<{}>>(await execaNode`unicorns ${false.toString()}`);
expectError(await execaNode`unicorns ${false}`);

expectType<Result<{}>>(await execaNode`unicorns ${await execaNode`echo foo`}`);
expectType<Result<{}>>(await execaNode`unicorns ${await execaNode({reject: false})`echo foo`}`);
expectError(await execaNode`unicorns ${execaNode`echo foo`}`);
expectType<Result<{}>>(await execaNode`unicorns ${[await execaNode`echo foo`, 'bar']}`);
expectError(await execaNode`unicorns ${[execaNode`echo foo`, 'bar']}`);

expectAssignable<ResultPromise>(execaNode('unicorns', {nodePath: './node'}));
expectAssignable<ResultPromise>(execaNode('unicorns', {nodePath: fileUrl}));
expectAssignable<{stdout: string}>(await execaNode('unicorns', {nodeOptions: ['--async-stack-traces']}));
expectAssignable<{stdout: Uint8Array}>(await execaNode('unicorns', {nodeOptions: ['--async-stack-traces'], encoding: 'buffer'}));
expectAssignable<{stdout: string}>(await execaNode('unicorns', ['foo'], {nodeOptions: ['--async-stack-traces']}));
expectAssignable<{stdout: Uint8Array}>(await execaNode('unicorns', ['foo'], {nodeOptions: ['--async-stack-traces'], encoding: 'buffer'}));
