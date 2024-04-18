import type {Readable, Writable} from 'node:stream';
import {expectType, expectError} from 'tsd';
import {execa, execaSync, type ExecaError, type ExecaSyncError} from '../../index.js';

const noBufferPromise = execa('unicorns', {buffer: false, all: true});
expectType<Writable>(noBufferPromise.stdin);
expectType<Writable>(noBufferPromise.stdio[0]);
expectType<Readable>(noBufferPromise.stdout);
expectType<Readable>(noBufferPromise.stdio[1]);
expectType<Readable>(noBufferPromise.stderr);
expectType<Readable>(noBufferPromise.stdio[2]);
expectType<Readable>(noBufferPromise.all);
expectError(noBufferPromise.stdio[3].destroy());

const noBufferResult = await noBufferPromise;
expectType<undefined>(noBufferResult.stdout);
expectType<undefined>(noBufferResult.stdio[1]);
expectType<undefined>(noBufferResult.stderr);
expectType<undefined>(noBufferResult.stdio[2]);
expectType<undefined>(noBufferResult.all);

const noBufferResultSync = execaSync('unicorns', {buffer: false, all: true});
expectType<undefined>(noBufferResultSync.stdout);
expectType<undefined>(noBufferResultSync.stderr);
expectType<undefined>(noBufferResultSync.all);

const noBuffer3Result = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'pipe'], buffer: false});
expectType<undefined>(noBuffer3Result.stdio[3]);

const noBufferError = new Error('.') as ExecaError<{buffer: false; all: true}>;
expectType<undefined>(noBufferError.stdout);
expectType<undefined>(noBufferError.stdio[1]);
expectType<undefined>(noBufferError.stderr);
expectType<undefined>(noBufferError.stdio[2]);
expectType<undefined>(noBufferError.all);

const noBufferErrorSync = new Error('.') as ExecaSyncError<{buffer: false; all: true}>;
expectType<undefined>(noBufferErrorSync.stdout);
expectType<undefined>(noBufferErrorSync.stderr);
expectType<undefined>(noBufferErrorSync.all);
