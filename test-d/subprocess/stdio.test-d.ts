import type {Readable, Writable} from 'node:stream';
import {expectType, expectError} from 'tsd';
import {execa, type ExecaSubprocess} from '../../index.js';

expectType<Writable | null>({} as ExecaSubprocess['stdin']);
expectType<Readable | null>({} as ExecaSubprocess['stdout']);
expectType<Readable | null>({} as ExecaSubprocess['stderr']);
expectType<Readable | undefined>({} as ExecaSubprocess['all']);

const execaBufferPromise = execa('unicorns', {encoding: 'buffer', all: true});
expectType<Writable>(execaBufferPromise.stdin);
expectType<Writable>(execaBufferPromise.stdio[0]);
expectType<Readable>(execaBufferPromise.stdout);
expectType<Readable>(execaBufferPromise.stdio[1]);
expectType<Readable>(execaBufferPromise.stderr);
expectType<Readable>(execaBufferPromise.stdio[2]);
expectType<Readable>(execaBufferPromise.all);
expectError(execaBufferPromise.stdio[3].destroy());

const execaHexPromise = execa('unicorns', {encoding: 'hex', all: true});
expectType<Writable>(execaHexPromise.stdin);
expectType<Writable>(execaHexPromise.stdio[0]);
expectType<Readable>(execaHexPromise.stdout);
expectType<Readable>(execaHexPromise.stdio[1]);
expectType<Readable>(execaHexPromise.stderr);
expectType<Readable>(execaHexPromise.stdio[2]);
expectType<Readable>(execaHexPromise.all);
expectError(execaHexPromise.stdio[3].destroy());

const multipleStdinPromise = execa('unicorns', {stdin: ['inherit', 'pipe']});
expectType<Writable>(multipleStdinPromise.stdin);

const multipleStdoutPromise = execa('unicorns', {stdout: ['inherit', 'pipe'] as ['inherit', 'pipe'], all: true});
expectType<Writable>(multipleStdoutPromise.stdin);
expectType<Writable>(multipleStdoutPromise.stdio[0]);
expectType<Readable>(multipleStdoutPromise.stdout);
expectType<Readable>(multipleStdoutPromise.stdio[1]);
expectType<Readable>(multipleStdoutPromise.stderr);
expectType<Readable>(multipleStdoutPromise.stdio[2]);
expectType<Readable>(multipleStdoutPromise.all);
expectError(multipleStdoutPromise.stdio[3].destroy());
