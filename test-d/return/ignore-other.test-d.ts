import * as process from 'node:process';
import {expectType} from 'tsd';
import {execa, execaSync, type ExecaError, type ExecaSyncError} from '../../index.js';

const inheritStdoutResult = await execa('unicorns', {stdout: 'inherit', all: true});
expectType<undefined>(inheritStdoutResult.stdout);
expectType<string>(inheritStdoutResult.stderr);
expectType<string>(inheritStdoutResult.all);

const inheritStderrResult = await execa('unicorns', {stderr: 'inherit', all: true});
expectType<string>(inheritStderrResult.stdout);
expectType<undefined>(inheritStderrResult.stderr);
expectType<string>(inheritStderrResult.all);

const inheritArrayStdoutResult = await execa('unicorns', {stdout: ['inherit'] as ['inherit'], all: true});
expectType<undefined>(inheritArrayStdoutResult.stdout);
expectType<string>(inheritArrayStdoutResult.stderr);
expectType<string>(inheritArrayStdoutResult.all);

const inheritArrayStderrResult = await execa('unicorns', {stderr: ['inherit'] as ['inherit'], all: true});
expectType<string>(inheritArrayStderrResult.stdout);
expectType<undefined>(inheritArrayStderrResult.stderr);
expectType<string>(inheritArrayStderrResult.all);

const inheritStdoutResultSync = execaSync('unicorns', {stdout: 'inherit', all: true});
expectType<undefined>(inheritStdoutResultSync.stdout);
expectType<string>(inheritStdoutResultSync.stderr);
expectType<string>(inheritStdoutResultSync.all);

const inheritStderrResultSync = execaSync('unicorns', {stderr: 'inherit', all: true});
expectType<string>(inheritStderrResultSync.stdout);
expectType<undefined>(inheritStderrResultSync.stderr);
expectType<string>(inheritStderrResultSync.all);

const inheritStdoutError = new Error('.') as ExecaError<{stdout: 'inherit'; all: true}>;
expectType<undefined>(inheritStdoutError.stdout);
expectType<string>(inheritStdoutError.stderr);
expectType<string>(inheritStdoutError.all);

const inheritStderrError = new Error('.') as ExecaError<{stderr: 'inherit'; all: true}>;
expectType<string>(inheritStderrError.stdout);
expectType<undefined>(inheritStderrError.stderr);
expectType<string>(inheritStderrError.all);

const inheritStdoutErrorSync = new Error('.') as ExecaSyncError<{stdout: 'inherit'; all: true}>;
expectType<undefined>(inheritStdoutErrorSync.stdout);
expectType<string>(inheritStdoutErrorSync.stderr);
expectType<string>(inheritStdoutErrorSync.all);

const inheritStderrErrorSync = new Error('.') as ExecaSyncError<{stderr: 'inherit'; all: true}>;
expectType<string>(inheritStderrErrorSync.stdout);
expectType<undefined>(inheritStderrErrorSync.stderr);
expectType<string>(inheritStderrErrorSync.all);

const ipcStdoutResult = await execa('unicorns', {stdout: 'ipc', all: true});
expectType<undefined>(ipcStdoutResult.stdout);
expectType<string>(ipcStdoutResult.stderr);
expectType<string>(ipcStdoutResult.all);

const ipcStderrResult = await execa('unicorns', {stderr: 'ipc', all: true});
expectType<string>(ipcStderrResult.stdout);
expectType<undefined>(ipcStderrResult.stderr);
expectType<string>(ipcStderrResult.all);

const ipcStdoutError = new Error('.') as ExecaError<{stdout: 'ipc'; all: true}>;
expectType<undefined>(ipcStdoutError.stdout);
expectType<string>(ipcStdoutError.stderr);
expectType<string>(ipcStdoutError.all);

const ipcStderrError = new Error('.') as ExecaError<{stderr: 'ipc'; all: true}>;
expectType<string>(ipcStderrError.stdout);
expectType<undefined>(ipcStderrError.stderr);
expectType<string>(ipcStderrError.all);

const streamStdoutResult = await execa('unicorns', {stdout: process.stdout, all: true});
expectType<undefined>(streamStdoutResult.stdout);
expectType<string>(streamStdoutResult.stderr);
expectType<string>(streamStdoutResult.all);

const streamArrayStdoutResult = await execa('unicorns', {stdout: [process.stdout] as [typeof process.stdout], all: true});
expectType<undefined>(streamArrayStdoutResult.stdout);
expectType<string>(streamArrayStdoutResult.stderr);
expectType<string>(streamArrayStdoutResult.all);

const streamStderrResult = await execa('unicorns', {stderr: process.stdout, all: true});
expectType<string>(streamStderrResult.stdout);
expectType<undefined>(streamStderrResult.stderr);
expectType<string>(streamStderrResult.all);

const streamArrayStderrResult = await execa('unicorns', {stderr: [process.stdout] as [typeof process.stdout], all: true});
expectType<string>(streamArrayStderrResult.stdout);
expectType<undefined>(streamArrayStderrResult.stderr);
expectType<string>(streamArrayStderrResult.all);

const streamStdoutError = new Error('.') as ExecaError<{stdout: typeof process.stdout; all: true}>;
expectType<undefined>(streamStdoutError.stdout);
expectType<string>(streamStdoutError.stderr);
expectType<string>(streamStdoutError.all);

const streamStderrError = new Error('.') as ExecaError<{stderr: typeof process.stdout; all: true}>;
expectType<string>(streamStderrError.stdout);
expectType<undefined>(streamStderrError.stderr);
expectType<string>(streamStderrError.all);

const numberStdoutResult = await execa('unicorns', {stdout: 1, all: true});
expectType<undefined>(numberStdoutResult.stdout);
expectType<string>(numberStdoutResult.stderr);
expectType<string>(numberStdoutResult.all);

const numberStderrResult = await execa('unicorns', {stderr: 1, all: true});
expectType<string>(numberStderrResult.stdout);
expectType<undefined>(numberStderrResult.stderr);
expectType<string>(numberStderrResult.all);

const numberArrayStdoutResult = await execa('unicorns', {stdout: [1] as [1], all: true});
expectType<undefined>(numberArrayStdoutResult.stdout);
expectType<string>(numberArrayStdoutResult.stderr);
expectType<string>(numberArrayStdoutResult.all);

const numberArrayStderrResult = await execa('unicorns', {stderr: [1] as [1], all: true});
expectType<string>(numberArrayStderrResult.stdout);
expectType<undefined>(numberArrayStderrResult.stderr);
expectType<string>(numberArrayStderrResult.all);

const numberStdoutResultSync = execaSync('unicorns', {stdout: 1, all: true});
expectType<undefined>(numberStdoutResultSync.stdout);
expectType<string>(numberStdoutResultSync.stderr);
expectType<string>(numberStdoutResultSync.all);

const numberStderrResultSync = execaSync('unicorns', {stderr: 1, all: true});
expectType<string>(numberStderrResultSync.stdout);
expectType<undefined>(numberStderrResultSync.stderr);
expectType<string>(numberStderrResultSync.all);

const numberStdoutError = new Error('.') as ExecaError<{stdout: 1; all: true}>;
expectType<undefined>(numberStdoutError.stdout);
expectType<string>(numberStdoutError.stderr);
expectType<string>(numberStdoutError.all);

const numberStderrError = new Error('.') as ExecaError<{stderr: 1; all: true}>;
expectType<string>(numberStderrError.stdout);
expectType<undefined>(numberStderrError.stderr);
expectType<string>(numberStderrError.all);

const numberStdoutErrorSync = new Error('.') as ExecaSyncError<{stdout: 1; all: true}>;
expectType<undefined>(numberStdoutErrorSync.stdout);
expectType<string>(numberStdoutErrorSync.stderr);
expectType<string>(numberStdoutErrorSync.all);

const numberStderrErrorSync = new Error('.') as ExecaSyncError<{stderr: 1; all: true}>;
expectType<string>(numberStderrErrorSync.stdout);
expectType<undefined>(numberStderrErrorSync.stderr);
expectType<string>(numberStderrErrorSync.all);
