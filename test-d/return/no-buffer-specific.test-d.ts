import {expectType} from 'tsd';
import {execa, execaSync} from '../../index.js';

const noBufferStdoutResult = await execa('unicorns', {all: true, buffer: {stdout: false}});
expectType<undefined>(noBufferStdoutResult.stdout);
expectType<undefined>(noBufferStdoutResult.stdio[1]);
expectType<string>(noBufferStdoutResult.stderr);
expectType<string>(noBufferStdoutResult.stdio[2]);
expectType<string>(noBufferStdoutResult.all);

const noBufferStderrResult = await execa('unicorns', {all: true, buffer: {stderr: false}});
expectType<string>(noBufferStderrResult.stdout);
expectType<string>(noBufferStderrResult.stdio[1]);
expectType<undefined>(noBufferStderrResult.stderr);
expectType<undefined>(noBufferStderrResult.stdio[2]);
expectType<string>(noBufferStderrResult.all);

const noBufferFd1Result = await execa('unicorns', {all: true, buffer: {fd1: false}});
expectType<undefined>(noBufferFd1Result.stdout);
expectType<undefined>(noBufferFd1Result.stdio[1]);
expectType<string>(noBufferFd1Result.stderr);
expectType<string>(noBufferFd1Result.stdio[2]);
expectType<string>(noBufferFd1Result.all);

const noBufferFd2Result = await execa('unicorns', {all: true, buffer: {fd2: false}});
expectType<string>(noBufferFd2Result.stdout);
expectType<string>(noBufferFd2Result.stdio[1]);
expectType<undefined>(noBufferFd2Result.stderr);
expectType<undefined>(noBufferFd2Result.stdio[2]);
expectType<string>(noBufferFd2Result.all);

const noBufferAllResult = await execa('unicorns', {all: true, buffer: {all: false}});
expectType<undefined>(noBufferAllResult.stdout);
expectType<undefined>(noBufferAllResult.stdio[1]);
expectType<undefined>(noBufferAllResult.stderr);
expectType<undefined>(noBufferAllResult.stdio[2]);
expectType<undefined>(noBufferAllResult.all);

const noBufferFd3Result = await execa('unicorns', {all: true, buffer: {fd3: false}, stdio: ['pipe', 'pipe', 'pipe', 'pipe', 'pipe']});
expectType<string>(noBufferFd3Result.stdout);
expectType<string>(noBufferFd3Result.stdio[1]);
expectType<string>(noBufferFd3Result.stderr);
expectType<string>(noBufferFd3Result.stdio[2]);
expectType<string>(noBufferFd3Result.all);
expectType<undefined>(noBufferFd3Result.stdio[3]);
expectType<string>(noBufferFd3Result.stdio[4]);

const noBufferStdoutResultSync = execaSync('unicorns', {all: true, buffer: {stdout: false}});
expectType<undefined>(noBufferStdoutResultSync.stdout);
expectType<undefined>(noBufferStdoutResultSync.stdio[1]);
expectType<string>(noBufferStdoutResultSync.stderr);
expectType<string>(noBufferStdoutResultSync.stdio[2]);
expectType<string>(noBufferStdoutResultSync.all);

const noBufferStderrResultSync = execaSync('unicorns', {all: true, buffer: {stderr: false}});
expectType<string>(noBufferStderrResultSync.stdout);
expectType<string>(noBufferStderrResultSync.stdio[1]);
expectType<undefined>(noBufferStderrResultSync.stderr);
expectType<undefined>(noBufferStderrResultSync.stdio[2]);
expectType<string>(noBufferStderrResultSync.all);

const noBufferFd1ResultSync = execaSync('unicorns', {all: true, buffer: {fd1: false}});
expectType<undefined>(noBufferFd1ResultSync.stdout);
expectType<undefined>(noBufferFd1ResultSync.stdio[1]);
expectType<string>(noBufferFd1ResultSync.stderr);
expectType<string>(noBufferFd1ResultSync.stdio[2]);
expectType<string>(noBufferFd1ResultSync.all);

const noBufferFd2ResultSync = execaSync('unicorns', {all: true, buffer: {fd2: false}});
expectType<string>(noBufferFd2ResultSync.stdout);
expectType<string>(noBufferFd2ResultSync.stdio[1]);
expectType<undefined>(noBufferFd2ResultSync.stderr);
expectType<undefined>(noBufferFd2ResultSync.stdio[2]);
expectType<string>(noBufferFd2ResultSync.all);

const noBufferAllResultSync = execaSync('unicorns', {all: true, buffer: {all: false}});
expectType<undefined>(noBufferAllResultSync.stdout);
expectType<undefined>(noBufferAllResultSync.stdio[1]);
expectType<undefined>(noBufferAllResultSync.stderr);
expectType<undefined>(noBufferAllResultSync.stdio[2]);
expectType<undefined>(noBufferAllResultSync.all);

const noBufferFd3ResultSync = execaSync('unicorns', {all: true, buffer: {fd3: false}, stdio: ['pipe', 'pipe', 'pipe', 'pipe', 'pipe']});
expectType<string>(noBufferFd3ResultSync.stdout);
expectType<string>(noBufferFd3ResultSync.stdio[1]);
expectType<string>(noBufferFd3ResultSync.stderr);
expectType<string>(noBufferFd3ResultSync.stdio[2]);
expectType<string>(noBufferFd3ResultSync.all);
expectType<undefined>(noBufferFd3ResultSync.stdio[3]);
expectType<string>(noBufferFd3ResultSync.stdio[4]);
