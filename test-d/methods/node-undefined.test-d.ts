import type {Readable, Writable} from 'node:stream';
import {expectTypeOf} from 'nz';
import {execaNode, type sendMessage, type getOneMessage} from '../../index.js';

const result = await execaNode('unicorns', {node: undefined});
expectTypeOf(result.stdout).toBe<string>();
const argumentsResult = await execaNode('unicorns', [], {node: undefined});
expectTypeOf(argumentsResult.stdout).toBe<string>();
const boundResult = await execaNode({node: undefined})`unicorns`;
expectTypeOf(boundResult.stdout).toBe<string>();

const subprocess = execaNode('unicorns', {node: undefined});
expectTypeOf(subprocess.stdin).toBe<Writable>();
expectTypeOf(subprocess.stdout).toBe<Readable>();
expectTypeOf(subprocess.stdio[3]).toBe<null>();
expectTypeOf(subprocess.sendMessage).toBeAssignableTo<typeof sendMessage>();
expectTypeOf(subprocess.getOneMessage).toBeAssignableTo<typeof getOneMessage>();
expectTypeOf(result.stderr).toBe<string>();
expectTypeOf(result.failed).toBe<boolean>();

const binaryResult = await execaNode('unicorns', {node: undefined, encoding: 'buffer'});
expectTypeOf(binaryResult.stdout).toBe<Uint8Array>();
const linesResult = await execaNode({node: undefined, lines: true})`unicorns`;
expectTypeOf(linesResult.stdout).toBe<string[]>();
const reboundResult = await execaNode({node: true})({node: undefined})('unicorns');
expectTypeOf(reboundResult.stdout).toBe<string>();
const callOverrideResult = await execaNode({node: true})('unicorns', [], {node: undefined});
expectTypeOf(callOverrideResult.stdout).toBe<string>();

const optionalNode: {node?: undefined} = {};
const optionalResult = await execaNode('unicorns', optionalNode);
expectTypeOf(optionalResult.stdout).toBe<string>();
expectTypeOf(execaNode(optionalNode)`unicorns`.sendMessage).toBeAssignableTo<typeof sendMessage>();
declare const nodeOutputOptions: {node: undefined; lines: true} | {node: undefined; encoding: 'buffer'};
const unionResult = await execaNode('unicorns', nodeOutputOptions);
expectTypeOf(unionResult.stdout).toBe<string[] | Uint8Array>();

// Omitting `node` or passing `true` preserves output options and the explicit IPC override.
const defaultResult = await execaNode('unicorns');
expectTypeOf(defaultResult.stdout).toBe<string>();
const explicitResult = await execaNode('unicorns', {node: true});
expectTypeOf(explicitResult.stdout).toBe<string>();
const explicitBinaryResult = await execaNode('unicorns', {node: true, encoding: 'buffer'});
expectTypeOf(explicitBinaryResult.stdout).toBe<Uint8Array>();
const explicitLinesResult = await execaNode({node: true, lines: true})`unicorns`;
expectTypeOf(explicitLinesResult.stdout).toBe<string[]>();
expectTypeOf(execaNode('unicorns').sendMessage).toBeAssignableTo<typeof sendMessage>();
expectTypeOf(execaNode('unicorns', {node: true}).stdio[3]).toBe<null>();
expectTypeOf(execaNode('unicorns', {ipc: false}).sendMessage).toBe<undefined>();
expectTypeOf(execaNode('unicorns', {node: true, ipc: false}).sendMessage).toBe<undefined>();
declare const nodeOptions: {node: undefined} | {node: true};
const nodeUnionResult = await execaNode('unicorns', nodeOptions);
expectTypeOf(nodeUnionResult.stdout).toBe<string>();

// `node: false` throws at runtime
expectTypeOf(execaNode('unicorns', {node: false})).toBe<never>();
expectTypeOf(execaNode({node: false})`unicorns`).toBe<never>();
