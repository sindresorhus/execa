import {expectTypeOf} from 'nz';
import {
	execa,
	execaSync,
	type ExecaError,
	type ExecaSyncError,
} from '../../index.js';

const linesResult = await execa('unicorns', {lines: true, all: true});
expectTypeOf(linesResult.stdout).toBe<string[]>();
expectTypeOf(linesResult.stdio[1]).toBe<string[]>();
expectTypeOf(linesResult.stderr).toBe<string[]>();
expectTypeOf(linesResult.stdio[2]).toBe<string[]>();
expectTypeOf(linesResult.all).toBe<string[]>();

const linesBufferResult = await execa('unicorns', {lines: true, encoding: 'buffer', all: true});
expectTypeOf(linesBufferResult.stdout).toBe<Uint8Array>();
expectTypeOf(linesBufferResult.stdio[1]).toBe<Uint8Array>();
expectTypeOf(linesBufferResult.stderr).toBe<Uint8Array>();
expectTypeOf(linesBufferResult.stdio[2]).toBe<Uint8Array>();
expectTypeOf(linesBufferResult.all).toBe<Uint8Array>();

const linesHexResult = await execa('unicorns', {lines: true, encoding: 'hex', all: true});
expectTypeOf(linesHexResult.stdout).toBe<string>();
expectTypeOf(linesHexResult.stdio[1]).toBe<string>();
expectTypeOf(linesHexResult.stderr).toBe<string>();
expectTypeOf(linesHexResult.stdio[2]).toBe<string>();
expectTypeOf(linesHexResult.all).toBe<string>();

const linesFd3Result = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'pipe'], lines: true});
expectTypeOf(linesFd3Result.stdio[3]).toBe<string[]>();

const linesBufferFd3Result = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'pipe'], lines: true, encoding: 'buffer'});
expectTypeOf(linesBufferFd3Result.stdio[3]).toBe<Uint8Array>();

const execaLinesError = new Error('.') as ExecaError<{lines: true; all: true}>;
expectTypeOf(execaLinesError.stdout).toBe<string[]>();
expectTypeOf(execaLinesError.stdio[1]).toBe<string[]>();
expectTypeOf(execaLinesError.stderr).toBe<string[]>();
expectTypeOf(execaLinesError.stdio[2]).toBe<string[]>();
expectTypeOf(execaLinesError.all).toBe<string[]>();

const execaLinesBufferError = new Error('.') as ExecaError<{lines: true; encoding: 'buffer'; all: true}>;
expectTypeOf(execaLinesBufferError.stdout).toBe<Uint8Array>();
expectTypeOf(execaLinesBufferError.stdio[1]).toBe<Uint8Array>();
expectTypeOf(execaLinesBufferError.stderr).toBe<Uint8Array>();
expectTypeOf(execaLinesBufferError.stdio[2]).toBe<Uint8Array>();
expectTypeOf(execaLinesBufferError.all).toBe<Uint8Array>();

const linesResultSync = execaSync('unicorns', {lines: true, all: true});
expectTypeOf(linesResultSync.stdout).toBe<string[]>();
expectTypeOf(linesResultSync.stderr).toBe<string[]>();
expectTypeOf(linesResultSync.all).toBe<string[]>();

const linesBufferResultSync = execaSync('unicorns', {lines: true, encoding: 'buffer', all: true});
expectTypeOf(linesBufferResultSync.stdout).toBe<Uint8Array>();
expectTypeOf(linesBufferResultSync.stderr).toBe<Uint8Array>();
expectTypeOf(linesBufferResultSync.all).toBe<Uint8Array>();

const linesHexResultSync = execaSync('unicorns', {lines: true, encoding: 'hex', all: true});
expectTypeOf(linesHexResultSync.stdout).toBe<string>();
expectTypeOf(linesHexResultSync.stderr).toBe<string>();
expectTypeOf(linesHexResultSync.all).toBe<string>();

const execaLinesErrorSync = new Error('.') as ExecaSyncError<{lines: true; all: true}>;
expectTypeOf(execaLinesErrorSync.stdout).toBe<string[]>();
expectTypeOf(execaLinesErrorSync.stderr).toBe<string[]>();
expectTypeOf(execaLinesErrorSync.all).toBe<string[]>();

const execaLinesBufferErrorSync = new Error('.') as ExecaSyncError<{lines: true; encoding: 'buffer'; all: true}>;
expectTypeOf(execaLinesBufferErrorSync.stdout).toBe<Uint8Array>();
expectTypeOf(execaLinesBufferErrorSync.stderr).toBe<Uint8Array>();
expectTypeOf(execaLinesBufferErrorSync.all).toBe<Uint8Array>();
