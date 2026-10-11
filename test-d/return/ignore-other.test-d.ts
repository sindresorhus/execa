import * as process from 'node:process';
import {expectTypeOf} from 'nz';
import {
	execa,
	execaSync,
	type ExecaError,
	type ExecaSyncError,
} from '../../index.js';

const inheritStdoutResult = await execa('unicorns', {stdout: 'inherit', all: true});
expectTypeOf(inheritStdoutResult.stdout).toBe<undefined>();
expectTypeOf(inheritStdoutResult.stderr).toBe<string>();
expectTypeOf(inheritStdoutResult.all).toBe<string>();

const inheritStderrResult = await execa('unicorns', {stderr: 'inherit', all: true});
expectTypeOf(inheritStderrResult.stdout).toBe<string>();
expectTypeOf(inheritStderrResult.stderr).toBe<undefined>();
expectTypeOf(inheritStderrResult.all).toBe<string>();

const inheritArrayStdoutResult = await execa('unicorns', {stdout: ['inherit'] as ['inherit'], all: true});
expectTypeOf(inheritArrayStdoutResult.stdout).toBe<undefined>();
expectTypeOf(inheritArrayStdoutResult.stderr).toBe<string>();
expectTypeOf(inheritArrayStdoutResult.all).toBe<string>();

const inheritArrayStderrResult = await execa('unicorns', {stderr: ['inherit'] as ['inherit'], all: true});
expectTypeOf(inheritArrayStderrResult.stdout).toBe<string>();
expectTypeOf(inheritArrayStderrResult.stderr).toBe<undefined>();
expectTypeOf(inheritArrayStderrResult.all).toBe<string>();

const inheritStdoutResultSync = execaSync('unicorns', {stdout: 'inherit', all: true});
expectTypeOf(inheritStdoutResultSync.stdout).toBe<undefined>();
expectTypeOf(inheritStdoutResultSync.stderr).toBe<string>();
expectTypeOf(inheritStdoutResultSync.all).toBe<string>();

const inheritStderrResultSync = execaSync('unicorns', {stderr: 'inherit', all: true});
expectTypeOf(inheritStderrResultSync.stdout).toBe<string>();
expectTypeOf(inheritStderrResultSync.stderr).toBe<undefined>();
expectTypeOf(inheritStderrResultSync.all).toBe<string>();

const inheritStdoutError = new Error('.') as ExecaError<{stdout: 'inherit'; all: true}>;
expectTypeOf(inheritStdoutError.stdout).toBe<undefined>();
expectTypeOf(inheritStdoutError.stderr).toBe<string>();
expectTypeOf(inheritStdoutError.all).toBe<string>();

const inheritStderrError = new Error('.') as ExecaError<{stderr: 'inherit'; all: true}>;
expectTypeOf(inheritStderrError.stdout).toBe<string>();
expectTypeOf(inheritStderrError.stderr).toBe<undefined>();
expectTypeOf(inheritStderrError.all).toBe<string>();

const inheritStdoutErrorSync = new Error('.') as ExecaSyncError<{stdout: 'inherit'; all: true}>;
expectTypeOf(inheritStdoutErrorSync.stdout).toBe<undefined>();
expectTypeOf(inheritStdoutErrorSync.stderr).toBe<string>();
expectTypeOf(inheritStdoutErrorSync.all).toBe<string>();

const inheritStderrErrorSync = new Error('.') as ExecaSyncError<{stderr: 'inherit'; all: true}>;
expectTypeOf(inheritStderrErrorSync.stdout).toBe<string>();
expectTypeOf(inheritStderrErrorSync.stderr).toBe<undefined>();
expectTypeOf(inheritStderrErrorSync.all).toBe<string>();

const streamStdoutResult = await execa('unicorns', {stdout: process.stdout, all: true});
expectTypeOf(streamStdoutResult.stdout).toBe<undefined>();
expectTypeOf(streamStdoutResult.stderr).toBe<string>();
expectTypeOf(streamStdoutResult.all).toBe<string>();

const streamArrayStdoutResult = await execa('unicorns', {stdout: [process.stdout] as [typeof process.stdout], all: true});
expectTypeOf(streamArrayStdoutResult.stdout).toBe<undefined>();
expectTypeOf(streamArrayStdoutResult.stderr).toBe<string>();
expectTypeOf(streamArrayStdoutResult.all).toBe<string>();

const streamStderrResult = await execa('unicorns', {stderr: process.stdout, all: true});
expectTypeOf(streamStderrResult.stdout).toBe<string>();
expectTypeOf(streamStderrResult.stderr).toBe<undefined>();
expectTypeOf(streamStderrResult.all).toBe<string>();

const streamArrayStderrResult = await execa('unicorns', {stderr: [process.stdout] as [typeof process.stdout], all: true});
expectTypeOf(streamArrayStderrResult.stdout).toBe<string>();
expectTypeOf(streamArrayStderrResult.stderr).toBe<undefined>();
expectTypeOf(streamArrayStderrResult.all).toBe<string>();

const streamStdoutError = new Error('.') as ExecaError<{stdout: typeof process.stdout; all: true}>;
expectTypeOf(streamStdoutError.stdout).toBe<undefined>();
expectTypeOf(streamStdoutError.stderr).toBe<string>();
expectTypeOf(streamStdoutError.all).toBe<string>();

const streamStderrError = new Error('.') as ExecaError<{stderr: typeof process.stdout; all: true}>;
expectTypeOf(streamStderrError.stdout).toBe<string>();
expectTypeOf(streamStderrError.stderr).toBe<undefined>();
expectTypeOf(streamStderrError.all).toBe<string>();

const numberStdoutResult = await execa('unicorns', {stdout: 1, all: true});
expectTypeOf(numberStdoutResult.stdout).toBe<undefined>();
expectTypeOf(numberStdoutResult.stderr).toBe<string>();
expectTypeOf(numberStdoutResult.all).toBe<string>();

const numberStderrResult = await execa('unicorns', {stderr: 1, all: true});
expectTypeOf(numberStderrResult.stdout).toBe<string>();
expectTypeOf(numberStderrResult.stderr).toBe<undefined>();
expectTypeOf(numberStderrResult.all).toBe<string>();

const numberArrayStdoutResult = await execa('unicorns', {stdout: [1] as [1], all: true});
expectTypeOf(numberArrayStdoutResult.stdout).toBe<undefined>();
expectTypeOf(numberArrayStdoutResult.stderr).toBe<string>();
expectTypeOf(numberArrayStdoutResult.all).toBe<string>();

const numberArrayStderrResult = await execa('unicorns', {stderr: [1] as [1], all: true});
expectTypeOf(numberArrayStderrResult.stdout).toBe<string>();
expectTypeOf(numberArrayStderrResult.stderr).toBe<undefined>();
expectTypeOf(numberArrayStderrResult.all).toBe<string>();

const numberStdoutResultSync = execaSync('unicorns', {stdout: 1, all: true});
expectTypeOf(numberStdoutResultSync.stdout).toBe<undefined>();
expectTypeOf(numberStdoutResultSync.stderr).toBe<string>();
expectTypeOf(numberStdoutResultSync.all).toBe<string>();

const numberStderrResultSync = execaSync('unicorns', {stderr: 1, all: true});
expectTypeOf(numberStderrResultSync.stdout).toBe<string>();
expectTypeOf(numberStderrResultSync.stderr).toBe<undefined>();
expectTypeOf(numberStderrResultSync.all).toBe<string>();

const numberStdoutError = new Error('.') as ExecaError<{stdout: 1; all: true}>;
expectTypeOf(numberStdoutError.stdout).toBe<undefined>();
expectTypeOf(numberStdoutError.stderr).toBe<string>();
expectTypeOf(numberStdoutError.all).toBe<string>();

const numberStderrError = new Error('.') as ExecaError<{stderr: 1; all: true}>;
expectTypeOf(numberStderrError.stdout).toBe<string>();
expectTypeOf(numberStderrError.stderr).toBe<undefined>();
expectTypeOf(numberStderrError.all).toBe<string>();

const numberStdoutErrorSync = new Error('.') as ExecaSyncError<{stdout: 1; all: true}>;
expectTypeOf(numberStdoutErrorSync.stdout).toBe<undefined>();
expectTypeOf(numberStdoutErrorSync.stderr).toBe<string>();
expectTypeOf(numberStdoutErrorSync.all).toBe<string>();

const numberStderrErrorSync = new Error('.') as ExecaSyncError<{stderr: 1; all: true}>;
expectTypeOf(numberStderrErrorSync.stdout).toBe<string>();
expectTypeOf(numberStderrErrorSync.stderr).toBe<undefined>();
expectTypeOf(numberStderrErrorSync.all).toBe<string>();
