import type {Readable, Writable} from 'node:stream';
import {expectTypeOf} from 'nz';
import {execa, execaNode, type Subprocess} from '../../index.js';

expectTypeOf<Subprocess['stdin']>().toBe<Writable | null>();
expectTypeOf<Subprocess['stdout']>().toBe<Readable | null>();
expectTypeOf<Subprocess['stderr']>().toBe<Readable | null>();
expectTypeOf<Subprocess['all']>().toBe<Readable | undefined>();

const bufferSubprocess = execa('unicorns', {encoding: 'buffer', all: true});
expectTypeOf(bufferSubprocess.stdin).toBe<Writable>();
expectTypeOf(bufferSubprocess.stdio[0]).toBe<Writable>();
expectTypeOf(bufferSubprocess.stdout).toBe<Readable>();
expectTypeOf(bufferSubprocess.stdio[1]).toBe<Readable>();
expectTypeOf(bufferSubprocess.stderr).toBe<Readable>();
expectTypeOf(bufferSubprocess.stdio[2]).toBe<Readable>();
expectTypeOf(bufferSubprocess.all).toBe<Readable>();
expectTypeOf(bufferSubprocess.stdio[0]).toBe<Writable>();

const hexSubprocess = execa('unicorns', {encoding: 'hex', all: true});
expectTypeOf(hexSubprocess.stdin).toBe<Writable>();
expectTypeOf(hexSubprocess.stdio[0]).toBe<Writable>();
expectTypeOf(hexSubprocess.stdout).toBe<Readable>();
expectTypeOf(hexSubprocess.stdio[1]).toBe<Readable>();
expectTypeOf(hexSubprocess.stderr).toBe<Readable>();
expectTypeOf(hexSubprocess.stdio[2]).toBe<Readable>();
expectTypeOf(hexSubprocess.all).toBe<Readable>();
expectTypeOf(hexSubprocess.stdio[0]).toBe<Writable>();

const multipleStdinSubprocess = execa('unicorns', {stdin: ['inherit', 'pipe']});
expectTypeOf(multipleStdinSubprocess.stdin).toBe<Writable>();

const multipleStdoutSubprocess = execa('unicorns', {stdout: ['inherit', 'pipe'] as ['inherit', 'pipe'], all: true});
expectTypeOf(multipleStdoutSubprocess.stdin).toBe<Writable>();
expectTypeOf(multipleStdoutSubprocess.stdio[0]).toBe<Writable>();
expectTypeOf(multipleStdoutSubprocess.stdout).toBe<Readable>();
expectTypeOf(multipleStdoutSubprocess.stdio[1]).toBe<Readable>();
expectTypeOf(multipleStdoutSubprocess.stderr).toBe<Readable>();
expectTypeOf(multipleStdoutSubprocess.stdio[2]).toBe<Readable>();
expectTypeOf(multipleStdoutSubprocess.all).toBe<Readable>();
expectTypeOf(multipleStdoutSubprocess.stdio[0]).toBe<Writable>();

const inputPipeSubprocess = execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', {value: 'pipe', input: true}]});
expectTypeOf(inputPipeSubprocess.stdio[3]).toBe<Writable>();

const outputPipeSubprocess = execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', {value: 'pipe'}]});
expectTypeOf(outputPipeSubprocess.stdio[3]).toBe<Readable>();

const inputInheritSubprocess = execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', {value: 'inherit', input: true}]});
expectTypeOf(inputInheritSubprocess.stdio[3]).toBe<null>();

const inputFdSubprocess = execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', {value: 3, input: true}]});
expectTypeOf(inputFdSubprocess.stdio[3]).toBe<null>();

const inputFileSubprocess = execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', {value: {file: './example'}, input: true}]});
expectTypeOf(inputFileSubprocess.stdio[3]).toBe<Writable>();

const isInput = true as boolean;
const booleanInputPipeSubprocess = execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', {value: 'pipe', input: isInput}]});
expectTypeOf(booleanInputPipeSubprocess.stdio[3]).toBe<Readable | Writable>();

const optionalInputPipe: {readonly value: 'pipe'; readonly input?: boolean} = {value: 'pipe', input: isInput};
const optionalInputPipeSubprocess = execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', optionalInputPipe]});
expectTypeOf(optionalInputPipeSubprocess.stdio[3]).toBe<Readable | Writable>();

const optionalTrueInputPipe: {readonly value: 'pipe'; readonly input?: true} = {value: 'pipe', input: true};
const optionalTrueInputPipeSubprocess = execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', optionalTrueInputPipe]});
expectTypeOf(optionalTrueInputPipeSubprocess.stdio[3]).toBe<Readable | Writable>();

const stdoutInputPipeSubprocess = execa('unicorns', {stdout: {value: 'pipe', input: true}});
expectTypeOf(stdoutInputPipeSubprocess.stdout).toBe<Readable>();
expectTypeOf(stdoutInputPipeSubprocess.stdio[1]).toBe<Readable>();

const stderrInputPipeSubprocess = execa('unicorns', {stderr: {value: 'pipe', input: true}});
expectTypeOf(stderrInputPipeSubprocess.stderr).toBe<Readable>();
expectTypeOf(stderrInputPipeSubprocess.stdio[2]).toBe<Readable>();

const noIpcSubprocess = execa('unicorns');
expectTypeOf(noIpcSubprocess.stdio[0]).toBe<Writable>();
expectTypeOf(noIpcSubprocess.stdio[1]).toBe<Readable>();
expectTypeOf(noIpcSubprocess.stdio[2]).toBe<Readable>();

const ipcSubprocess = execa('unicorns', {ipc: true});
expectTypeOf(ipcSubprocess.stdio[0]).toBe<Writable>();
expectTypeOf(ipcSubprocess.stdio[1]).toBe<Readable>();
expectTypeOf(ipcSubprocess.stdio[2]).toBe<Readable>();
expectTypeOf(ipcSubprocess.stdio[3]).toBe<null>();

const ipcInputSubprocess = execa('unicorns', {ipcInput: ''});
expectTypeOf(ipcInputSubprocess.stdio[3]).toBe<null>();

const execaNodeSubprocess = execaNode('unicorns');
expectTypeOf(execaNodeSubprocess.stdio[3]).toBe<null>();

const fd3IpcSubprocess = execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'pipe'], ipc: true});
expectTypeOf(fd3IpcSubprocess.stdio[3]).toBe<Readable>();
expectTypeOf(fd3IpcSubprocess.stdio[4]).toBe<null>();

const fd5IpcSubprocess = execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'pipe', 'pipe', 'pipe'], ipc: true});
expectTypeOf(fd5IpcSubprocess.stdio[5]).toBe<Readable>();
expectTypeOf(fd5IpcSubprocess.stdio[6]).toBe<null>();
expectTypeOf(fd5IpcSubprocess.stdio[7]).toBe<Readable | Writable | null>();

expectTypeOf(noIpcSubprocess.stdio[3]).toBe<Readable | Writable | null>();
