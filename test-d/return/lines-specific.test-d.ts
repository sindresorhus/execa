import {expectType} from 'tsd';
import {execa, execaSync} from '../../index.js';

const linesStdoutResult = await execa('unicorns', {all: true, lines: {stdout: true}});
expectType<string[]>(linesStdoutResult.stdout);
expectType<string[]>(linesStdoutResult.stdio[1]);
expectType<string>(linesStdoutResult.stderr);
expectType<string>(linesStdoutResult.stdio[2]);
expectType<string[]>(linesStdoutResult.all);

const linesStderrResult = await execa('unicorns', {all: true, lines: {stderr: true}});
expectType<string>(linesStderrResult.stdout);
expectType<string>(linesStderrResult.stdio[1]);
expectType<string[]>(linesStderrResult.stderr);
expectType<string[]>(linesStderrResult.stdio[2]);
expectType<string[]>(linesStderrResult.all);

const linesFd1Result = await execa('unicorns', {all: true, lines: {fd1: true}});
expectType<string[]>(linesFd1Result.stdout);
expectType<string[]>(linesFd1Result.stdio[1]);
expectType<string>(linesFd1Result.stderr);
expectType<string>(linesFd1Result.stdio[2]);
expectType<string[]>(linesFd1Result.all);

const linesFd2Result = await execa('unicorns', {all: true, lines: {fd2: true}});
expectType<string>(linesFd2Result.stdout);
expectType<string>(linesFd2Result.stdio[1]);
expectType<string[]>(linesFd2Result.stderr);
expectType<string[]>(linesFd2Result.stdio[2]);
expectType<string[]>(linesFd2Result.all);

const linesAllResult = await execa('unicorns', {all: true, lines: {all: true}});
expectType<string[]>(linesAllResult.stdout);
expectType<string[]>(linesAllResult.stdio[1]);
expectType<string[]>(linesAllResult.stderr);
expectType<string[]>(linesAllResult.stdio[2]);
expectType<string[]>(linesAllResult.all);

const linesFd3Result = await execa('unicorns', {all: true, lines: {fd3: true}, stdio: ['pipe', 'pipe', 'pipe', 'pipe', 'pipe']});
expectType<string>(linesFd3Result.stdout);
expectType<string>(linesFd3Result.stdio[1]);
expectType<string>(linesFd3Result.stderr);
expectType<string>(linesFd3Result.stdio[2]);
expectType<string>(linesFd3Result.all);
expectType<string[]>(linesFd3Result.stdio[3]);
expectType<string>(linesFd3Result.stdio[4]);

const linesStdoutResultSync = execaSync('unicorns', {all: true, lines: {stdout: true}});
expectType<string[]>(linesStdoutResultSync.stdout);
expectType<string[]>(linesStdoutResultSync.stdio[1]);
expectType<string>(linesStdoutResultSync.stderr);
expectType<string>(linesStdoutResultSync.stdio[2]);
expectType<string[]>(linesStdoutResultSync.all);

const linesStderrResultSync = execaSync('unicorns', {all: true, lines: {stderr: true}});
expectType<string>(linesStderrResultSync.stdout);
expectType<string>(linesStderrResultSync.stdio[1]);
expectType<string[]>(linesStderrResultSync.stderr);
expectType<string[]>(linesStderrResultSync.stdio[2]);
expectType<string[]>(linesStderrResultSync.all);

const linesFd1ResultSync = execaSync('unicorns', {all: true, lines: {fd1: true}});
expectType<string[]>(linesFd1ResultSync.stdout);
expectType<string[]>(linesFd1ResultSync.stdio[1]);
expectType<string>(linesFd1ResultSync.stderr);
expectType<string>(linesFd1ResultSync.stdio[2]);
expectType<string[]>(linesFd1ResultSync.all);

const linesFd2ResultSync = execaSync('unicorns', {all: true, lines: {fd2: true}});
expectType<string>(linesFd2ResultSync.stdout);
expectType<string>(linesFd2ResultSync.stdio[1]);
expectType<string[]>(linesFd2ResultSync.stderr);
expectType<string[]>(linesFd2ResultSync.stdio[2]);
expectType<string[]>(linesFd2ResultSync.all);

const linesAllResultSync = execaSync('unicorns', {all: true, lines: {all: true}});
expectType<string[]>(linesAllResultSync.stdout);
expectType<string[]>(linesAllResultSync.stdio[1]);
expectType<string[]>(linesAllResultSync.stderr);
expectType<string[]>(linesAllResultSync.stdio[2]);
expectType<string[]>(linesAllResultSync.all);

const linesFd3ResultSync = execaSync('unicorns', {all: true, lines: {fd3: true}, stdio: ['pipe', 'pipe', 'pipe', 'pipe', 'pipe']});
expectType<string>(linesFd3ResultSync.stdout);
expectType<string>(linesFd3ResultSync.stdio[1]);
expectType<string>(linesFd3ResultSync.stderr);
expectType<string>(linesFd3ResultSync.stdio[2]);
expectType<string>(linesFd3ResultSync.all);
expectType<string[]>(linesFd3ResultSync.stdio[3]);
expectType<string>(linesFd3ResultSync.stdio[4]);
