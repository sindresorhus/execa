import {Readable, Writable} from 'node:stream';
import {expectType} from 'tsd';
import {
	execa,
	execaSync,
	type ExecaError,
	type ExecaSyncError,
} from '../../index.js';

const unicornsResult = await execa('unicorns', {all: true});
expectType<undefined>(unicornsResult.stdio[0]);
expectType<string>(unicornsResult.stdout);
expectType<string>(unicornsResult.stdio[1]);
expectType<string>(unicornsResult.stderr);
expectType<string>(unicornsResult.stdio[2]);
expectType<string>(unicornsResult.all);
expectType<string | undefined>(unicornsResult.stdio[3 as number]);

const bufferResult = await execa('unicorns', {encoding: 'buffer', all: true});
expectType<Uint8Array>(bufferResult.stdout);
expectType<Uint8Array>(bufferResult.stdio[1]);
expectType<Uint8Array>(bufferResult.stderr);
expectType<Uint8Array>(bufferResult.stdio[2]);
expectType<Uint8Array>(bufferResult.all);

const hexResult = await execa('unicorns', {encoding: 'hex', all: true});
expectType<string>(hexResult.stdout);
expectType<string>(hexResult.stdio[1]);
expectType<string>(hexResult.stderr);
expectType<string>(hexResult.stdio[2]);
expectType<string>(hexResult.all);

const unicornsResultSync = execaSync('unicorns', {all: true});
expectType<undefined>(unicornsResultSync.stdio[0]);
expectType<string>(unicornsResultSync.stdout);
expectType<string>(unicornsResultSync.stdio[1]);
expectType<string>(unicornsResultSync.stderr);
expectType<string>(unicornsResultSync.stdio[2]);
expectType<string>(unicornsResultSync.all);

const bufferResultSync = execaSync('unicorns', {encoding: 'buffer', all: true});
expectType<undefined>(bufferResultSync.stdio[0]);
expectType<Uint8Array>(bufferResultSync.stdout);
expectType<Uint8Array>(bufferResultSync.stdio[1]);
expectType<Uint8Array>(bufferResultSync.stderr);
expectType<Uint8Array>(bufferResultSync.stdio[2]);
expectType<Uint8Array>(bufferResultSync.all);

const execaStringError = new Error('.') as ExecaError<{all: true}>;
expectType<undefined>(execaStringError.stdio[0]);
expectType<string>(execaStringError.stdout);
expectType<string>(execaStringError.stdio[1]);
expectType<string>(execaStringError.stderr);
expectType<string>(execaStringError.stdio[2]);
expectType<string>(execaStringError.all);

const execaBufferError = new Error('.') as ExecaError<{encoding: 'buffer'; all: true}>;
expectType<undefined>(execaBufferError.stdio[0]);
expectType<Uint8Array>(execaBufferError.stdout);
expectType<Uint8Array>(execaBufferError.stdio[1]);
expectType<Uint8Array>(execaBufferError.stderr);
expectType<Uint8Array>(execaBufferError.stdio[2]);
expectType<Uint8Array>(execaBufferError.all);

const execaStringErrorSync = new Error('.') as ExecaSyncError<{all: true}>;
expectType<undefined>(execaStringErrorSync.stdio[0]);
expectType<string>(execaStringErrorSync.stdout);
expectType<string>(execaStringErrorSync.stdio[1]);
expectType<string>(execaStringErrorSync.stderr);
expectType<string>(execaStringErrorSync.stdio[2]);
expectType<string>(execaStringErrorSync.all);

const execaBufferErrorSync = new Error('.') as ExecaSyncError<{encoding: 'buffer'; all: true}>;
expectType<undefined>(execaBufferErrorSync.stdio[0]);
expectType<Uint8Array>(execaBufferErrorSync.stdout);
expectType<Uint8Array>(execaBufferErrorSync.stdio[1]);
expectType<Uint8Array>(execaBufferErrorSync.stderr);
expectType<Uint8Array>(execaBufferErrorSync.stdio[2]);
expectType<Uint8Array>(execaBufferErrorSync.all);

const multipleStdoutResult = await execa('unicorns', {stdout: ['inherit', 'pipe'] as ['inherit', 'pipe'], all: true});
expectType<string>(multipleStdoutResult.stdout);
expectType<string>(multipleStdoutResult.stdio[1]);
expectType<string>(multipleStdoutResult.stderr);
expectType<string>(multipleStdoutResult.stdio[2]);
expectType<string>(multipleStdoutResult.all);

const undefinedStdoutResult = await execa('unicorns', {stdout: undefined, all: true});
expectType<string>(undefinedStdoutResult.stdout);
expectType<string>(undefinedStdoutResult.stderr);
expectType<string>(undefinedStdoutResult.all);

const undefinedArrayStdoutResult = await execa('unicorns', {stdout: [undefined] as const, all: true});
expectType<string>(undefinedArrayStdoutResult.stdout);
expectType<string>(undefinedArrayStdoutResult.stderr);
expectType<string>(undefinedArrayStdoutResult.all);

const undefinedStderrResult = await execa('unicorns', {stderr: undefined, all: true});
expectType<string>(undefinedStderrResult.stdout);
expectType<string>(undefinedStderrResult.stderr);
expectType<string>(undefinedStderrResult.all);

const undefinedArrayStderrResult = await execa('unicorns', {stderr: [undefined] as const, all: true});
expectType<string>(undefinedArrayStderrResult.stdout);
expectType<string>(undefinedArrayStderrResult.stderr);
expectType<string>(undefinedArrayStderrResult.all);

const fd3Result = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'pipe']});
expectType<string>(fd3Result.stdio[3]);

const inputFd3Result = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', ['pipe', new Readable()]]});
expectType<undefined>(inputFd3Result.stdio[3]);

const outputFd3Result = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', ['pipe', new Writable()]]});
expectType<string>(outputFd3Result.stdio[3]);

const bufferFd3Result = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'pipe'], encoding: 'buffer'});
expectType<Uint8Array>(bufferFd3Result.stdio[3]);

const undefinedFd3Result = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', undefined]});
expectType<undefined>(undefinedFd3Result.stdio[3]);

const undefinedArrayFd3Result = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [undefined] as const]});
expectType<undefined>(undefinedArrayFd3Result.stdio[3]);
