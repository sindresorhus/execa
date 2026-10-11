import type {Readable, Writable} from 'node:stream';
import {expectTypeOf} from 'nz';
import {
	execa,
	execaSync,
	type ExecaError,
	type ExecaSyncError,
} from '../../index.js';

const noBufferSubprocess = execa('unicorns', {buffer: false, all: true});
expectTypeOf(noBufferSubprocess.stdin).toBe<Writable>();
expectTypeOf(noBufferSubprocess.stdio[0]).toBe<Writable>();
expectTypeOf(noBufferSubprocess.stdout).toBe<Readable>();
expectTypeOf(noBufferSubprocess.stdio[1]).toBe<Readable>();
expectTypeOf(noBufferSubprocess.stderr).toBe<Readable>();
expectTypeOf(noBufferSubprocess.stdio[2]).toBe<Readable>();
expectTypeOf(noBufferSubprocess.all).toBe<Readable>();

const noBufferResult = await noBufferSubprocess;
expectTypeOf(noBufferResult.stdout).toBe<undefined>();
expectTypeOf(noBufferResult.stdio[1]).toBe<undefined>();
expectTypeOf(noBufferResult.stderr).toBe<undefined>();
expectTypeOf(noBufferResult.stdio[2]).toBe<undefined>();
expectTypeOf(noBufferResult.all).toBe<undefined>();

const noBufferResultSync = execaSync('unicorns', {buffer: false, all: true});
expectTypeOf(noBufferResultSync.stdout).toBe<undefined>();
expectTypeOf(noBufferResultSync.stderr).toBe<undefined>();
expectTypeOf(noBufferResultSync.all).toBe<undefined>();

const noBuffer3Result = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'pipe'], buffer: false});
expectTypeOf(noBuffer3Result.stdio[3]).toBe<undefined>();

const noBufferError = new Error('.') as ExecaError<{buffer: false; all: true}>;
expectTypeOf(noBufferError.stdout).toBe<undefined>();
expectTypeOf(noBufferError.stdio[1]).toBe<undefined>();
expectTypeOf(noBufferError.stderr).toBe<undefined>();
expectTypeOf(noBufferError.stdio[2]).toBe<undefined>();
expectTypeOf(noBufferError.all).toBe<undefined>();

const noBufferErrorSync = new Error('.') as ExecaSyncError<{buffer: false; all: true}>;
expectTypeOf(noBufferErrorSync.stdout).toBe<undefined>();
expectTypeOf(noBufferErrorSync.stderr).toBe<undefined>();
expectTypeOf(noBufferErrorSync.all).toBe<undefined>();
