import {expectType} from 'tsd';
import {
	execa,
	execaSync,
	type ExecaError,
	type ExecaSyncError,
} from '../../index.js';

const linesResult = await execa('unicorns', {lines: true, all: true});
expectType<string[]>(linesResult.stdout);
expectType<string[]>(linesResult.stdio[1]);
expectType<string[]>(linesResult.stderr);
expectType<string[]>(linesResult.stdio[2]);
expectType<string[]>(linesResult.all);

const linesBufferResult = await execa('unicorns', {lines: true, encoding: 'buffer', all: true});
expectType<Uint8Array>(linesBufferResult.stdout);
expectType<Uint8Array>(linesBufferResult.stdio[1]);
expectType<Uint8Array>(linesBufferResult.stderr);
expectType<Uint8Array>(linesBufferResult.stdio[2]);
expectType<Uint8Array>(linesBufferResult.all);

const linesHexResult = await execa('unicorns', {lines: true, encoding: 'hex', all: true});
expectType<string>(linesHexResult.stdout);
expectType<string>(linesHexResult.stdio[1]);
expectType<string>(linesHexResult.stderr);
expectType<string>(linesHexResult.stdio[2]);
expectType<string>(linesHexResult.all);

const linesFd3Result = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'pipe'], lines: true});
expectType<string[]>(linesFd3Result.stdio[3]);

const linesBufferFd3Result = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'pipe'], lines: true, encoding: 'buffer'});
expectType<Uint8Array>(linesBufferFd3Result.stdio[3]);

const execaLinesError = new Error('.') as ExecaError<{lines: true; all: true}>;
expectType<string[]>(execaLinesError.stdout);
expectType<string[]>(execaLinesError.stdio[1]);
expectType<string[]>(execaLinesError.stderr);
expectType<string[]>(execaLinesError.stdio[2]);
expectType<string[]>(execaLinesError.all);

const execaLinesBufferError = new Error('.') as ExecaError<{lines: true; encoding: 'buffer'; all: true}>;
expectType<Uint8Array>(execaLinesBufferError.stdout);
expectType<Uint8Array>(execaLinesBufferError.stdio[1]);
expectType<Uint8Array>(execaLinesBufferError.stderr);
expectType<Uint8Array>(execaLinesBufferError.stdio[2]);
expectType<Uint8Array>(execaLinesBufferError.all);

const linesResultSync = execaSync('unicorns', {lines: true, all: true});
expectType<string[]>(linesResultSync.stdout);
expectType<string[]>(linesResultSync.stderr);
expectType<string[]>(linesResultSync.all);

const linesBufferResultSync = execaSync('unicorns', {lines: true, encoding: 'buffer', all: true});
expectType<Uint8Array>(linesBufferResultSync.stdout);
expectType<Uint8Array>(linesBufferResultSync.stderr);
expectType<Uint8Array>(linesBufferResultSync.all);

const linesHexResultSync = execaSync('unicorns', {lines: true, encoding: 'hex', all: true});
expectType<string>(linesHexResultSync.stdout);
expectType<string>(linesHexResultSync.stderr);
expectType<string>(linesHexResultSync.all);

const execaLinesErrorSync = new Error('.') as ExecaSyncError<{lines: true; all: true}>;
expectType<string[]>(execaLinesErrorSync.stdout);
expectType<string[]>(execaLinesErrorSync.stderr);
expectType<string[]>(execaLinesErrorSync.all);

const execaLinesBufferErrorSync = new Error('.') as ExecaSyncError<{lines: true; encoding: 'buffer'; all: true}>;
expectType<Uint8Array>(execaLinesBufferErrorSync.stdout);
expectType<Uint8Array>(execaLinesBufferErrorSync.stderr);
expectType<Uint8Array>(execaLinesBufferErrorSync.all);
