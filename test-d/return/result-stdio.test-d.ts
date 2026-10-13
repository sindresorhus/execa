import {Readable, Writable} from 'node:stream';
import {expectTypeOf} from 'nz';
import {
	execa,
	execaSync,
	execaNode,
	type ExecaError,
	type ExecaSyncError,
} from '../../index.js';

const unicornsResult = await execa('unicorns', {all: true});
expectTypeOf(unicornsResult.stdio[0]).toBe<undefined>();
expectTypeOf(unicornsResult.stdout).toBe<string>();
expectTypeOf(unicornsResult.stdio[1]).toBe<string>();
expectTypeOf(unicornsResult.stderr).toBe<string>();
expectTypeOf(unicornsResult.stdio[2]).toBe<string>();
expectTypeOf(unicornsResult.all).toBe<string>();
expectTypeOf(unicornsResult.stdio[3 as number]).toBe<string | undefined>();

const bufferResult = await execa('unicorns', {encoding: 'buffer', all: true});
expectTypeOf(bufferResult.stdout).toBe<Uint8Array>();
expectTypeOf(bufferResult.stdio[1]).toBe<Uint8Array>();
expectTypeOf(bufferResult.stderr).toBe<Uint8Array>();
expectTypeOf(bufferResult.stdio[2]).toBe<Uint8Array>();
expectTypeOf(bufferResult.all).toBe<Uint8Array>();

const hexResult = await execa('unicorns', {encoding: 'hex', all: true});
expectTypeOf(hexResult.stdout).toBe<string>();
expectTypeOf(hexResult.stdio[1]).toBe<string>();
expectTypeOf(hexResult.stderr).toBe<string>();
expectTypeOf(hexResult.stdio[2]).toBe<string>();
expectTypeOf(hexResult.all).toBe<string>();

const unicornsResultSync = execaSync('unicorns', {all: true});
expectTypeOf(unicornsResultSync.stdio[0]).toBe<undefined>();
expectTypeOf(unicornsResultSync.stdout).toBe<string>();
expectTypeOf(unicornsResultSync.stdio[1]).toBe<string>();
expectTypeOf(unicornsResultSync.stderr).toBe<string>();
expectTypeOf(unicornsResultSync.stdio[2]).toBe<string>();
expectTypeOf(unicornsResultSync.all).toBe<string>();

const bufferResultSync = execaSync('unicorns', {encoding: 'buffer', all: true});
expectTypeOf(bufferResultSync.stdio[0]).toBe<undefined>();
expectTypeOf(bufferResultSync.stdout).toBe<Uint8Array>();
expectTypeOf(bufferResultSync.stdio[1]).toBe<Uint8Array>();
expectTypeOf(bufferResultSync.stderr).toBe<Uint8Array>();
expectTypeOf(bufferResultSync.stdio[2]).toBe<Uint8Array>();
expectTypeOf(bufferResultSync.all).toBe<Uint8Array>();

const execaStringError = new Error('.') as ExecaError<{all: true}>;
expectTypeOf(execaStringError.stdio[0]).toBe<undefined>();
expectTypeOf(execaStringError.stdout).toBe<string>();
expectTypeOf(execaStringError.stdio[1]).toBe<string>();
expectTypeOf(execaStringError.stderr).toBe<string>();
expectTypeOf(execaStringError.stdio[2]).toBe<string>();
expectTypeOf(execaStringError.all).toBe<string>();

const execaBufferError = new Error('.') as ExecaError<{encoding: 'buffer'; all: true}>;
expectTypeOf(execaBufferError.stdio[0]).toBe<undefined>();
expectTypeOf(execaBufferError.stdout).toBe<Uint8Array>();
expectTypeOf(execaBufferError.stdio[1]).toBe<Uint8Array>();
expectTypeOf(execaBufferError.stderr).toBe<Uint8Array>();
expectTypeOf(execaBufferError.stdio[2]).toBe<Uint8Array>();
expectTypeOf(execaBufferError.all).toBe<Uint8Array>();

const execaStringErrorSync = new Error('.') as ExecaSyncError<{all: true}>;
expectTypeOf(execaStringErrorSync.stdio[0]).toBe<undefined>();
expectTypeOf(execaStringErrorSync.stdout).toBe<string>();
expectTypeOf(execaStringErrorSync.stdio[1]).toBe<string>();
expectTypeOf(execaStringErrorSync.stderr).toBe<string>();
expectTypeOf(execaStringErrorSync.stdio[2]).toBe<string>();
expectTypeOf(execaStringErrorSync.all).toBe<string>();

const execaBufferErrorSync = new Error('.') as ExecaSyncError<{encoding: 'buffer'; all: true}>;
expectTypeOf(execaBufferErrorSync.stdio[0]).toBe<undefined>();
expectTypeOf(execaBufferErrorSync.stdout).toBe<Uint8Array>();
expectTypeOf(execaBufferErrorSync.stdio[1]).toBe<Uint8Array>();
expectTypeOf(execaBufferErrorSync.stderr).toBe<Uint8Array>();
expectTypeOf(execaBufferErrorSync.stdio[2]).toBe<Uint8Array>();
expectTypeOf(execaBufferErrorSync.all).toBe<Uint8Array>();

const multipleStdoutResult = await execa('unicorns', {stdout: ['inherit', 'pipe'] as ['inherit', 'pipe'], all: true});
expectTypeOf(multipleStdoutResult.stdout).toBe<string>();
expectTypeOf(multipleStdoutResult.stdio[1]).toBe<string>();
expectTypeOf(multipleStdoutResult.stderr).toBe<string>();
expectTypeOf(multipleStdoutResult.stdio[2]).toBe<string>();
expectTypeOf(multipleStdoutResult.all).toBe<string>();

const undefinedStdoutResult = await execa('unicorns', {stdout: undefined, all: true});
expectTypeOf(undefinedStdoutResult.stdout).toBe<string>();
expectTypeOf(undefinedStdoutResult.stderr).toBe<string>();
expectTypeOf(undefinedStdoutResult.all).toBe<string>();

const undefinedArrayStdoutResult = await execa('unicorns', {stdout: [undefined] as const, all: true});
expectTypeOf(undefinedArrayStdoutResult.stdout).toBe<string>();
expectTypeOf(undefinedArrayStdoutResult.stderr).toBe<string>();
expectTypeOf(undefinedArrayStdoutResult.all).toBe<string>();

const undefinedStderrResult = await execa('unicorns', {stderr: undefined, all: true});
expectTypeOf(undefinedStderrResult.stdout).toBe<string>();
expectTypeOf(undefinedStderrResult.stderr).toBe<string>();
expectTypeOf(undefinedStderrResult.all).toBe<string>();

const undefinedArrayStderrResult = await execa('unicorns', {stderr: [undefined] as const, all: true});
expectTypeOf(undefinedArrayStderrResult.stdout).toBe<string>();
expectTypeOf(undefinedArrayStderrResult.stderr).toBe<string>();
expectTypeOf(undefinedArrayStderrResult.all).toBe<string>();

const fd3Result = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'pipe']});
expectTypeOf(fd3Result.stdio[3]).toBe<string>();

const inputFd3Result = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', ['pipe', new Readable()]]});
expectTypeOf(inputFd3Result.stdio[3]).toBe<undefined>();

const inputPipeFd3Result = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', {value: 'pipe', input: true}]});
expectTypeOf(inputPipeFd3Result.stdio[3]).toBe<undefined>();

const inputInheritFd3Result = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', {value: 'inherit', input: true}]});
expectTypeOf(inputInheritFd3Result.stdio[3]).toBe<undefined>();

const inputFdFd3Result = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', {value: 3, input: true}]});
expectTypeOf(inputFdFd3Result.stdio[3]).toBe<undefined>();

const outputPipeFd3Result = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', {value: 'pipe'}]});
expectTypeOf(outputPipeFd3Result.stdio[3]).toBe<string>();

const isInput = true as boolean;
const booleanInputPipeFd3Result = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', {value: 'pipe', input: isInput}]});
expectTypeOf(booleanInputPipeFd3Result.stdio[3]).toBe<string | undefined>();

const optionalInputPipe: {readonly value: 'pipe'; readonly input?: boolean} = {value: 'pipe', input: isInput};
const optionalInputPipeFd3Result = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', optionalInputPipe]});
expectTypeOf(optionalInputPipeFd3Result.stdio[3]).toBe<string | undefined>();

const optionalTrueInputPipe: {readonly value: 'pipe'; readonly input?: true} = {value: 'pipe', input: true};
const optionalTrueInputPipeFd3Result = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', optionalTrueInputPipe]});
expectTypeOf(optionalTrueInputPipeFd3Result.stdio[3]).toBe<string | undefined>();

const stdoutInputPipeResult = await execa('unicorns', {stdout: {value: 'pipe', input: true}});
expectTypeOf(stdoutInputPipeResult.stdout).toBe<string>();
expectTypeOf(stdoutInputPipeResult.stdio[1]).toBe<string>();

const stderrInputPipeResult = await execa('unicorns', {stderr: {value: 'pipe', input: true}});
expectTypeOf(stderrInputPipeResult.stderr).toBe<string>();
expectTypeOf(stderrInputPipeResult.stdio[2]).toBe<string>();

const outputFd3Result = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', ['pipe', new Writable()]]});
expectTypeOf(outputFd3Result.stdio[3]).toBe<string>();

const bufferFd3Result = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'pipe'], encoding: 'buffer'});
expectTypeOf(bufferFd3Result.stdio[3]).toBe<Uint8Array>();

const undefinedFd3Result = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', undefined]});
expectTypeOf(undefinedFd3Result.stdio[3]).toBe<undefined>();

const undefinedArrayFd3Result = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [undefined] as const]});
expectTypeOf(undefinedArrayFd3Result.stdio[3]).toBe<undefined>();

const ipcResult = await execa('unicorns', {ipc: true});
expectTypeOf(ipcResult.stdio).toBe<[undefined, string, string, undefined]>();

const ipcInputResult = await execa('unicorns', {ipcInput: ''});
expectTypeOf(ipcInputResult.stdio).toBe<[undefined, string, string, undefined]>();

const gracefulCancelResult = await execa('unicorns', {cancelSignal: AbortSignal.abort(), gracefulCancel: true});
expectTypeOf(gracefulCancelResult.stdio).toBe<[undefined, string, string, undefined]>();

const nodeResult = await execa('unicorns', {node: true});
expectTypeOf(nodeResult.stdio).toBe<[undefined, string, string, undefined]>();

const execaNodeResult = await execaNode('unicorns');
expectTypeOf(execaNodeResult.stdio).toBe<[undefined, string, string, undefined]>();

const execaNodeNoIpcResult = await execaNode('unicorns', {ipc: false});
expectTypeOf(execaNodeNoIpcResult.stdio).toBe<[undefined, string, string]>();

const fd3IpcResult = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'pipe'], ipc: true});
expectTypeOf(fd3IpcResult.stdio).toBe<[undefined, string, string, string, undefined]>();

const noIpcResult = await execa('unicorns');
expectTypeOf(noIpcResult.stdio).toBe<[undefined, string, string]>();

const noIpcResultSync = execaSync('unicorns');
expectTypeOf(noIpcResultSync.stdio).toBe<[undefined, string, string]>();

const nodeResultSync = execaSync('unicorns', {node: true});
expectTypeOf(nodeResultSync.stdio).toBe<[undefined, string, string]>();
