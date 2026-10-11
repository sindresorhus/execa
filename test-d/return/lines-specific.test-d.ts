import {expectTypeOf} from 'nz';
import {execa, execaSync} from '../../index.js';

const linesStdoutResult = await execa('unicorns', {all: true, lines: {stdout: true}});
expectTypeOf(linesStdoutResult.stdout).toBe<string[]>();
expectTypeOf(linesStdoutResult.stdio[1]).toBe<string[]>();
expectTypeOf(linesStdoutResult.stderr).toBe<string>();
expectTypeOf(linesStdoutResult.stdio[2]).toBe<string>();
expectTypeOf(linesStdoutResult.all).toBe<string[]>();

const linesStderrResult = await execa('unicorns', {all: true, lines: {stderr: true}});
expectTypeOf(linesStderrResult.stdout).toBe<string>();
expectTypeOf(linesStderrResult.stdio[1]).toBe<string>();
expectTypeOf(linesStderrResult.stderr).toBe<string[]>();
expectTypeOf(linesStderrResult.stdio[2]).toBe<string[]>();
expectTypeOf(linesStderrResult.all).toBe<string[]>();

const linesFd1Result = await execa('unicorns', {all: true, lines: {fd1: true}});
expectTypeOf(linesFd1Result.stdout).toBe<string[]>();
expectTypeOf(linesFd1Result.stdio[1]).toBe<string[]>();
expectTypeOf(linesFd1Result.stderr).toBe<string>();
expectTypeOf(linesFd1Result.stdio[2]).toBe<string>();
expectTypeOf(linesFd1Result.all).toBe<string[]>();

const linesFd2Result = await execa('unicorns', {all: true, lines: {fd2: true}});
expectTypeOf(linesFd2Result.stdout).toBe<string>();
expectTypeOf(linesFd2Result.stdio[1]).toBe<string>();
expectTypeOf(linesFd2Result.stderr).toBe<string[]>();
expectTypeOf(linesFd2Result.stdio[2]).toBe<string[]>();
expectTypeOf(linesFd2Result.all).toBe<string[]>();

const linesAllResult = await execa('unicorns', {all: true, lines: {all: true}});
expectTypeOf(linesAllResult.stdout).toBe<string[]>();
expectTypeOf(linesAllResult.stdio[1]).toBe<string[]>();
expectTypeOf(linesAllResult.stderr).toBe<string[]>();
expectTypeOf(linesAllResult.stdio[2]).toBe<string[]>();
expectTypeOf(linesAllResult.all).toBe<string[]>();

const linesFd3Result = await execa('unicorns', {all: true, lines: {fd3: true}, stdio: ['pipe', 'pipe', 'pipe', 'pipe', 'pipe']});
expectTypeOf(linesFd3Result.stdout).toBe<string>();
expectTypeOf(linesFd3Result.stdio[1]).toBe<string>();
expectTypeOf(linesFd3Result.stderr).toBe<string>();
expectTypeOf(linesFd3Result.stdio[2]).toBe<string>();
expectTypeOf(linesFd3Result.all).toBe<string>();
expectTypeOf(linesFd3Result.stdio[3]).toBe<string[]>();
expectTypeOf(linesFd3Result.stdio[4]).toBe<string>();

const linesStdoutResultSync = execaSync('unicorns', {all: true, lines: {stdout: true}});
expectTypeOf(linesStdoutResultSync.stdout).toBe<string[]>();
expectTypeOf(linesStdoutResultSync.stdio[1]).toBe<string[]>();
expectTypeOf(linesStdoutResultSync.stderr).toBe<string>();
expectTypeOf(linesStdoutResultSync.stdio[2]).toBe<string>();
expectTypeOf(linesStdoutResultSync.all).toBe<string[]>();

const linesStderrResultSync = execaSync('unicorns', {all: true, lines: {stderr: true}});
expectTypeOf(linesStderrResultSync.stdout).toBe<string>();
expectTypeOf(linesStderrResultSync.stdio[1]).toBe<string>();
expectTypeOf(linesStderrResultSync.stderr).toBe<string[]>();
expectTypeOf(linesStderrResultSync.stdio[2]).toBe<string[]>();
expectTypeOf(linesStderrResultSync.all).toBe<string[]>();

const linesFd1ResultSync = execaSync('unicorns', {all: true, lines: {fd1: true}});
expectTypeOf(linesFd1ResultSync.stdout).toBe<string[]>();
expectTypeOf(linesFd1ResultSync.stdio[1]).toBe<string[]>();
expectTypeOf(linesFd1ResultSync.stderr).toBe<string>();
expectTypeOf(linesFd1ResultSync.stdio[2]).toBe<string>();
expectTypeOf(linesFd1ResultSync.all).toBe<string[]>();

const linesFd2ResultSync = execaSync('unicorns', {all: true, lines: {fd2: true}});
expectTypeOf(linesFd2ResultSync.stdout).toBe<string>();
expectTypeOf(linesFd2ResultSync.stdio[1]).toBe<string>();
expectTypeOf(linesFd2ResultSync.stderr).toBe<string[]>();
expectTypeOf(linesFd2ResultSync.stdio[2]).toBe<string[]>();
expectTypeOf(linesFd2ResultSync.all).toBe<string[]>();

const linesAllResultSync = execaSync('unicorns', {all: true, lines: {all: true}});
expectTypeOf(linesAllResultSync.stdout).toBe<string[]>();
expectTypeOf(linesAllResultSync.stdio[1]).toBe<string[]>();
expectTypeOf(linesAllResultSync.stderr).toBe<string[]>();
expectTypeOf(linesAllResultSync.stdio[2]).toBe<string[]>();
expectTypeOf(linesAllResultSync.all).toBe<string[]>();

const linesFd3ResultSync = execaSync('unicorns', {all: true, lines: {fd3: true}, stdio: ['pipe', 'pipe', 'pipe', 'pipe', 'pipe']});
expectTypeOf(linesFd3ResultSync.stdout).toBe<string>();
expectTypeOf(linesFd3ResultSync.stdio[1]).toBe<string>();
expectTypeOf(linesFd3ResultSync.stderr).toBe<string>();
expectTypeOf(linesFd3ResultSync.stdio[2]).toBe<string>();
expectTypeOf(linesFd3ResultSync.all).toBe<string>();
expectTypeOf(linesFd3ResultSync.stdio[3]).toBe<string[]>();
expectTypeOf(linesFd3ResultSync.stdio[4]).toBe<string>();
