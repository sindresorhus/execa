import {expectTypeOf, expectError} from 'nz';
import {execaNode, type Result, type ResultPromise} from '../../index.js';

const fileUrl = new URL('file:///test');
const stringArray = ['foo', 'bar'] as const;

expectError(execaNode());
expectError(execaNode(true));
expectError(execaNode(['unicorns', 'arg']));
expectTypeOf(execaNode('unicorns')).toBeAssignableTo<ResultPromise>();
expectTypeOf(execaNode(fileUrl)).toBeAssignableTo<ResultPromise>();

expectTypeOf(execaNode('unicorns', [])).toBeAssignableTo<ResultPromise>();
expectTypeOf(execaNode('unicorns', ['foo'])).toBeAssignableTo<ResultPromise>();
expectError(execaNode('unicorns', 'foo'));
expectError(execaNode('unicorns', [true]));

expectTypeOf(execaNode('unicorns', {})).toBeAssignableTo<ResultPromise>();
expectTypeOf(execaNode('unicorns', [], {})).toBeAssignableTo<ResultPromise>();
expectError(execaNode('unicorns', [], []));
expectError(execaNode('unicorns', {other: true}));

expectTypeOf(execaNode`unicorns`).toBeAssignableTo<ResultPromise>();
expectTypeOf(await execaNode('unicorns')).toBe<Result<{readonly node: true}>>();
expectTypeOf(await execaNode`unicorns`).toBe<Result<{readonly node: true}>>();

expectTypeOf(execaNode({})).toBeAssignableTo<typeof execaNode>();
expectTypeOf(execaNode({})('unicorns')).toBeAssignableTo<ResultPromise>();
expectTypeOf(execaNode({})`unicorns`).toBeAssignableTo<ResultPromise>();

expectTypeOf(await execaNode('unicorns')).toBeAssignableTo<{stdout: string}>();
expectTypeOf(await execaNode('unicorns', {encoding: 'buffer'})).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(await execaNode('unicorns', ['foo'])).toBeAssignableTo<{stdout: string}>();
expectTypeOf(await execaNode('unicorns', ['foo'], {encoding: 'buffer'})).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(await execaNode({})('unicorns')).toBeAssignableTo<{stdout: string}>();
expectTypeOf(await execaNode({encoding: 'buffer'})('unicorns')).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(await execaNode({})({encoding: 'buffer'})('unicorns')).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(await execaNode({encoding: 'buffer'})({})('unicorns')).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(await execaNode({})`unicorns`).toBeAssignableTo<{stdout: string}>();
expectTypeOf(await execaNode({encoding: 'buffer'})`unicorns`).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(await execaNode({})({encoding: 'buffer'})`unicorns`).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(await execaNode({encoding: 'buffer'})({})`unicorns`).toBeAssignableTo<{stdout: Uint8Array}>();

expectTypeOf(await execaNode`${'unicorns'}`).toBe<Result<{readonly node: true}>>();
expectTypeOf(await execaNode`unicorns ${'foo'}`).toBe<Result<{readonly node: true}>>();
expectTypeOf(await execaNode`unicorns ${'foo'} ${'bar'}`).toBe<Result<{readonly node: true}>>();
expectTypeOf(await execaNode`unicorns ${1}`).toBe<Result<{readonly node: true}>>();
expectTypeOf(await execaNode`unicorns ${stringArray}`).toBe<Result<{readonly node: true}>>();
expectTypeOf(await execaNode`unicorns ${[1, 2]}`).toBe<Result<{readonly node: true}>>();
expectTypeOf(await execaNode`unicorns ${false.toString()}`).toBe<Result<{readonly node: true}>>();
expectError(await execaNode`unicorns ${false}`);

expectTypeOf(await execaNode`unicorns ${await execaNode`echo foo`}`).toBe<Result<{readonly node: true}>>();
expectTypeOf(await execaNode`unicorns ${await execaNode({reject: false})`echo foo`}`).toBe<Result<{readonly node: true}>>();
expectError(await execaNode`unicorns ${execaNode`echo foo`}`);
expectTypeOf(await execaNode`unicorns ${[await execaNode`echo foo`, 'bar']}`).toBe<Result<{readonly node: true}>>();
expectError(await execaNode`unicorns ${[execaNode`echo foo`, 'bar']}`);

expectTypeOf(execaNode('unicorns', {nodePath: './node'})).toBeAssignableTo<ResultPromise>();
expectTypeOf(execaNode('unicorns', {nodePath: fileUrl})).toBeAssignableTo<ResultPromise>();
expectTypeOf(await execaNode('unicorns', {nodeOptions: ['--async-stack-traces']})).toBeAssignableTo<{stdout: string}>();
expectTypeOf(await execaNode('unicorns', {nodeOptions: ['--async-stack-traces'], encoding: 'buffer'})).toBeAssignableTo<{stdout: Uint8Array}>();
expectTypeOf(await execaNode('unicorns', ['foo'], {nodeOptions: ['--async-stack-traces']})).toBeAssignableTo<{stdout: string}>();
expectTypeOf(await execaNode('unicorns', ['foo'], {nodeOptions: ['--async-stack-traces'], encoding: 'buffer'})).toBeAssignableTo<{stdout: Uint8Array}>();
