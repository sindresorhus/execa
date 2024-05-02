import type {Readable, Writable} from 'node:stream';
import {expectType, expectError} from 'tsd';
import {execa, type Subprocess} from '../../index.js';

expectType<Writable | null>({} as Subprocess['stdin']);
expectType<Readable | null>({} as Subprocess['stdout']);
expectType<Readable | null>({} as Subprocess['stderr']);
expectType<Readable | undefined>({} as Subprocess['all']);

const bufferSubprocess = execa('unicorns', {encoding: 'buffer', all: true});
expectType<Writable>(bufferSubprocess.stdin);
expectType<Writable>(bufferSubprocess.stdio[0]);
expectType<Readable>(bufferSubprocess.stdout);
expectType<Readable>(bufferSubprocess.stdio[1]);
expectType<Readable>(bufferSubprocess.stderr);
expectType<Readable>(bufferSubprocess.stdio[2]);
expectType<Readable>(bufferSubprocess.all);
expectError(bufferSubprocess.stdio[3].destroy());

const hexSubprocess = execa('unicorns', {encoding: 'hex', all: true});
expectType<Writable>(hexSubprocess.stdin);
expectType<Writable>(hexSubprocess.stdio[0]);
expectType<Readable>(hexSubprocess.stdout);
expectType<Readable>(hexSubprocess.stdio[1]);
expectType<Readable>(hexSubprocess.stderr);
expectType<Readable>(hexSubprocess.stdio[2]);
expectType<Readable>(hexSubprocess.all);
expectError(hexSubprocess.stdio[3].destroy());

const multipleStdinSubprocess = execa('unicorns', {stdin: ['inherit', 'pipe']});
expectType<Writable>(multipleStdinSubprocess.stdin);

const multipleStdoutSubprocess = execa('unicorns', {stdout: ['inherit', 'pipe'] as ['inherit', 'pipe'], all: true});
expectType<Writable>(multipleStdoutSubprocess.stdin);
expectType<Writable>(multipleStdoutSubprocess.stdio[0]);
expectType<Readable>(multipleStdoutSubprocess.stdout);
expectType<Readable>(multipleStdoutSubprocess.stdio[1]);
expectType<Readable>(multipleStdoutSubprocess.stderr);
expectType<Readable>(multipleStdoutSubprocess.stdio[2]);
expectType<Readable>(multipleStdoutSubprocess.all);
expectError(multipleStdoutSubprocess.stdio[3].destroy());
