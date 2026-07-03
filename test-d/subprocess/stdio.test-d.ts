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

const inputPipeSubprocess = execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', {value: 'pipe', input: true}]});
expectType<Writable>(inputPipeSubprocess.stdio[3]);

const outputPipeSubprocess = execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', {value: 'pipe'}]});
expectType<Readable>(outputPipeSubprocess.stdio[3]);

const input = true as boolean;
const booleanInputPipeSubprocess = execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', {value: 'pipe', input}]});
expectType<Readable | Writable>(booleanInputPipeSubprocess.stdio[3]);

const optionalInputPipe: {readonly value: 'pipe'; readonly input?: boolean} = {value: 'pipe', input};
const optionalInputPipeSubprocess = execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', optionalInputPipe]});
expectType<Readable | Writable>(optionalInputPipeSubprocess.stdio[3]);

const optionalTrueInputPipe: {readonly value: 'pipe'; readonly input?: true} = {value: 'pipe', input: true};
const optionalTrueInputPipeSubprocess = execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', optionalTrueInputPipe]});
expectType<Readable | Writable>(optionalTrueInputPipeSubprocess.stdio[3]);

const stdoutInputPipeSubprocess = execa('unicorns', {stdout: {value: 'pipe', input: true}});
expectType<Readable>(stdoutInputPipeSubprocess.stdout);
expectType<Readable>(stdoutInputPipeSubprocess.stdio[1]);

const stderrInputPipeSubprocess = execa('unicorns', {stderr: {value: 'pipe', input: true}});
expectType<Readable>(stderrInputPipeSubprocess.stderr);
expectType<Readable>(stderrInputPipeSubprocess.stdio[2]);
