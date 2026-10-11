import {expectTypeOf} from 'nz';
import {execa, execaSync} from '../../index.js';

const noBufferStdoutResult = await execa('unicorns', {all: true, buffer: {stdout: false}});
expectTypeOf(noBufferStdoutResult.stdout).toBe<undefined>();
expectTypeOf(noBufferStdoutResult.stdio[1]).toBe<undefined>();
expectTypeOf(noBufferStdoutResult.stderr).toBe<string>();
expectTypeOf(noBufferStdoutResult.stdio[2]).toBe<string>();
expectTypeOf(noBufferStdoutResult.all).toBe<string>();

const noBufferStderrResult = await execa('unicorns', {all: true, buffer: {stderr: false}});
expectTypeOf(noBufferStderrResult.stdout).toBe<string>();
expectTypeOf(noBufferStderrResult.stdio[1]).toBe<string>();
expectTypeOf(noBufferStderrResult.stderr).toBe<undefined>();
expectTypeOf(noBufferStderrResult.stdio[2]).toBe<undefined>();
expectTypeOf(noBufferStderrResult.all).toBe<string>();

const noBufferFd1Result = await execa('unicorns', {all: true, buffer: {fd1: false}});
expectTypeOf(noBufferFd1Result.stdout).toBe<undefined>();
expectTypeOf(noBufferFd1Result.stdio[1]).toBe<undefined>();
expectTypeOf(noBufferFd1Result.stderr).toBe<string>();
expectTypeOf(noBufferFd1Result.stdio[2]).toBe<string>();
expectTypeOf(noBufferFd1Result.all).toBe<string>();

const noBufferFd2Result = await execa('unicorns', {all: true, buffer: {fd2: false}});
expectTypeOf(noBufferFd2Result.stdout).toBe<string>();
expectTypeOf(noBufferFd2Result.stdio[1]).toBe<string>();
expectTypeOf(noBufferFd2Result.stderr).toBe<undefined>();
expectTypeOf(noBufferFd2Result.stdio[2]).toBe<undefined>();
expectTypeOf(noBufferFd2Result.all).toBe<string>();

const noBufferAllResult = await execa('unicorns', {all: true, buffer: {all: false}});
expectTypeOf(noBufferAllResult.stdout).toBe<undefined>();
expectTypeOf(noBufferAllResult.stdio[1]).toBe<undefined>();
expectTypeOf(noBufferAllResult.stderr).toBe<undefined>();
expectTypeOf(noBufferAllResult.stdio[2]).toBe<undefined>();
expectTypeOf(noBufferAllResult.all).toBe<undefined>();

const noBufferFd3Result = await execa('unicorns', {all: true, buffer: {fd3: false}, stdio: ['pipe', 'pipe', 'pipe', 'pipe', 'pipe']});
expectTypeOf(noBufferFd3Result.stdout).toBe<string>();
expectTypeOf(noBufferFd3Result.stdio[1]).toBe<string>();
expectTypeOf(noBufferFd3Result.stderr).toBe<string>();
expectTypeOf(noBufferFd3Result.stdio[2]).toBe<string>();
expectTypeOf(noBufferFd3Result.all).toBe<string>();
expectTypeOf(noBufferFd3Result.stdio[3]).toBe<undefined>();
expectTypeOf(noBufferFd3Result.stdio[4]).toBe<string>();

const noBufferIpcResult = await execa('unicorns', {buffer: {ipc: false}, ipc: true, stdio: ['pipe', 'pipe', 'pipe', 'pipe']});
expectTypeOf(noBufferIpcResult.stdio[3]).toBe<string>();
expectTypeOf(noBufferIpcResult.ipcOutput).toBe<[]>();

const noBufferStdoutResultSync = execaSync('unicorns', {all: true, buffer: {stdout: false}});
expectTypeOf(noBufferStdoutResultSync.stdout).toBe<undefined>();
expectTypeOf(noBufferStdoutResultSync.stdio[1]).toBe<undefined>();
expectTypeOf(noBufferStdoutResultSync.stderr).toBe<string>();
expectTypeOf(noBufferStdoutResultSync.stdio[2]).toBe<string>();
expectTypeOf(noBufferStdoutResultSync.all).toBe<string>();

const noBufferStderrResultSync = execaSync('unicorns', {all: true, buffer: {stderr: false}});
expectTypeOf(noBufferStderrResultSync.stdout).toBe<string>();
expectTypeOf(noBufferStderrResultSync.stdio[1]).toBe<string>();
expectTypeOf(noBufferStderrResultSync.stderr).toBe<undefined>();
expectTypeOf(noBufferStderrResultSync.stdio[2]).toBe<undefined>();
expectTypeOf(noBufferStderrResultSync.all).toBe<string>();

const noBufferFd1ResultSync = execaSync('unicorns', {all: true, buffer: {fd1: false}});
expectTypeOf(noBufferFd1ResultSync.stdout).toBe<undefined>();
expectTypeOf(noBufferFd1ResultSync.stdio[1]).toBe<undefined>();
expectTypeOf(noBufferFd1ResultSync.stderr).toBe<string>();
expectTypeOf(noBufferFd1ResultSync.stdio[2]).toBe<string>();
expectTypeOf(noBufferFd1ResultSync.all).toBe<string>();

const noBufferFd2ResultSync = execaSync('unicorns', {all: true, buffer: {fd2: false}});
expectTypeOf(noBufferFd2ResultSync.stdout).toBe<string>();
expectTypeOf(noBufferFd2ResultSync.stdio[1]).toBe<string>();
expectTypeOf(noBufferFd2ResultSync.stderr).toBe<undefined>();
expectTypeOf(noBufferFd2ResultSync.stdio[2]).toBe<undefined>();
expectTypeOf(noBufferFd2ResultSync.all).toBe<string>();

const noBufferAllResultSync = execaSync('unicorns', {all: true, buffer: {all: false}});
expectTypeOf(noBufferAllResultSync.stdout).toBe<undefined>();
expectTypeOf(noBufferAllResultSync.stdio[1]).toBe<undefined>();
expectTypeOf(noBufferAllResultSync.stderr).toBe<undefined>();
expectTypeOf(noBufferAllResultSync.stdio[2]).toBe<undefined>();
expectTypeOf(noBufferAllResultSync.all).toBe<undefined>();

const noBufferFd3ResultSync = execaSync('unicorns', {all: true, buffer: {fd3: false}, stdio: ['pipe', 'pipe', 'pipe', 'pipe', 'pipe']});
expectTypeOf(noBufferFd3ResultSync.stdout).toBe<string>();
expectTypeOf(noBufferFd3ResultSync.stdio[1]).toBe<string>();
expectTypeOf(noBufferFd3ResultSync.stderr).toBe<string>();
expectTypeOf(noBufferFd3ResultSync.stdio[2]).toBe<string>();
expectTypeOf(noBufferFd3ResultSync.all).toBe<string>();
expectTypeOf(noBufferFd3ResultSync.stdio[3]).toBe<undefined>();
expectTypeOf(noBufferFd3ResultSync.stdio[4]).toBe<string>();

const noBufferIpcStdioResultSync = execaSync('unicorns', {buffer: {ipc: false}, stdio: ['pipe', 'pipe', 'pipe', 'pipe']});
expectTypeOf(noBufferIpcStdioResultSync.stdio[3]).toBe<string>();
