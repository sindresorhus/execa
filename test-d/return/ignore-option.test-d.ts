import {type Readable, type Writable} from 'node:stream';
import {expectTypeOf} from 'nz';
import {
	execa,
	execaSync,
	type ExecaError,
	type ExecaSyncError,
} from '../../index.js';

const ignoreAnySubprocess = execa('unicorns', {
	stdin: 'ignore',
	stdout: 'ignore',
	stderr: 'ignore',
	all: true,
});
expectTypeOf(ignoreAnySubprocess.stdin).toBe<null>();
expectTypeOf(ignoreAnySubprocess.stdio[0]).toBe<null>();
expectTypeOf(ignoreAnySubprocess.stdout).toBe<null>();
expectTypeOf(ignoreAnySubprocess.stdio[1]).toBe<null>();
expectTypeOf(ignoreAnySubprocess.stderr).toBe<null>();
expectTypeOf(ignoreAnySubprocess.stdio[2]).toBe<null>();
expectTypeOf(ignoreAnySubprocess.all).toBe<undefined>();

const ignoreAnyResult = await ignoreAnySubprocess;
expectTypeOf(ignoreAnyResult.stdout).toBe<undefined>();
expectTypeOf(ignoreAnyResult.stdio[1]).toBe<undefined>();
expectTypeOf(ignoreAnyResult.stderr).toBe<undefined>();
expectTypeOf(ignoreAnyResult.stdio[2]).toBe<undefined>();
expectTypeOf(ignoreAnyResult.all).toBe<undefined>();

const ignoreAllSubprocess = execa('unicorns', {stdio: 'ignore', all: true});
expectTypeOf(ignoreAllSubprocess.stdin).toBe<null>();
expectTypeOf(ignoreAllSubprocess.stdio[0]).toBe<null>();
expectTypeOf(ignoreAllSubprocess.stdout).toBe<null>();
expectTypeOf(ignoreAllSubprocess.stdio[1]).toBe<null>();
expectTypeOf(ignoreAllSubprocess.stderr).toBe<null>();
expectTypeOf(ignoreAllSubprocess.stdio[2]).toBe<null>();
expectTypeOf(ignoreAllSubprocess.all).toBe<undefined>();

const ignoreAllResult = await ignoreAllSubprocess;
expectTypeOf(ignoreAllResult.stdout).toBe<undefined>();
expectTypeOf(ignoreAllResult.stdio[1]).toBe<undefined>();
expectTypeOf(ignoreAllResult.stderr).toBe<undefined>();
expectTypeOf(ignoreAllResult.stdio[2]).toBe<undefined>();
expectTypeOf(ignoreAllResult.all).toBe<undefined>();

const ignoreStdioArraySubprocess = execa('unicorns', {stdio: ['ignore', 'ignore', 'pipe', 'pipe'], all: true});
expectTypeOf(ignoreStdioArraySubprocess.stdin).toBe<null>();
expectTypeOf(ignoreStdioArraySubprocess.stdio[0]).toBe<null>();
expectTypeOf(ignoreStdioArraySubprocess.stdout).toBe<null>();
expectTypeOf(ignoreStdioArraySubprocess.stdio[1]).toBe<null>();
expectTypeOf(ignoreStdioArraySubprocess.stderr).toBe<Readable>();
expectTypeOf(ignoreStdioArraySubprocess.stdio[2]).toBe<Readable>();
expectTypeOf(ignoreStdioArraySubprocess.all).toBe<Readable>();
expectTypeOf(ignoreStdioArraySubprocess.stdio[3]).toBe<Readable>();
const ignoreStdioArrayResult = await ignoreStdioArraySubprocess;
expectTypeOf(ignoreStdioArrayResult.stdout).toBe<undefined>();
expectTypeOf(ignoreStdioArrayResult.stdio[1]).toBe<undefined>();
expectTypeOf(ignoreStdioArrayResult.stderr).toBe<string>();
expectTypeOf(ignoreStdioArrayResult.stdio[2]).toBe<string>();
expectTypeOf(ignoreStdioArrayResult.all).toBe<string>();

const ignoreStdioArrayReadSubprocess = execa('unicorns', {stdio: ['ignore', 'ignore', 'pipe', new Uint8Array()], all: true});
expectTypeOf(ignoreStdioArrayReadSubprocess.stdio[3]).toBe<Writable>();

const ignoreStdinSubprocess = execa('unicorns', {stdin: 'ignore'});
expectTypeOf(ignoreStdinSubprocess.stdin).toBe<null>();

const ignoreStdoutSubprocess = execa('unicorns', {stdout: 'ignore', all: true});
expectTypeOf(ignoreStdoutSubprocess.stdin).toBe<Writable>();
expectTypeOf(ignoreStdoutSubprocess.stdio[0]).toBe<Writable>();
expectTypeOf(ignoreStdoutSubprocess.stdout).toBe<null>();
expectTypeOf(ignoreStdoutSubprocess.stdio[1]).toBe<null>();
expectTypeOf(ignoreStdoutSubprocess.stderr).toBe<Readable>();
expectTypeOf(ignoreStdoutSubprocess.stdio[2]).toBe<Readable>();
expectTypeOf(ignoreStdoutSubprocess.all).toBe<Readable>();

const ignoreStdoutResult = await ignoreStdoutSubprocess;
expectTypeOf(ignoreStdoutResult.stdout).toBe<undefined>();
expectTypeOf(ignoreStdoutResult.stderr).toBe<string>();
expectTypeOf(ignoreStdoutResult.all).toBe<string>();

const ignoreStderrSubprocess = execa('unicorns', {stderr: 'ignore', all: true});
expectTypeOf(ignoreStderrSubprocess.stdin).toBe<Writable>();
expectTypeOf(ignoreStderrSubprocess.stdio[0]).toBe<Writable>();
expectTypeOf(ignoreStderrSubprocess.stdout).toBe<Readable>();
expectTypeOf(ignoreStderrSubprocess.stdio[1]).toBe<Readable>();
expectTypeOf(ignoreStderrSubprocess.stderr).toBe<null>();
expectTypeOf(ignoreStderrSubprocess.stdio[2]).toBe<null>();
expectTypeOf(ignoreStderrSubprocess.all).toBe<Readable>();

const ignoreStderrResult = await ignoreStderrSubprocess;
expectTypeOf(ignoreStderrResult.stdout).toBe<string>();
expectTypeOf(ignoreStderrResult.stderr).toBe<undefined>();
expectTypeOf(ignoreStderrResult.all).toBe<string>();

const ignoreStdioSubprocess = execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'ignore'], all: true});
expectTypeOf(ignoreStdioSubprocess.stdin).toBe<Writable>();
expectTypeOf(ignoreStdioSubprocess.stdio[0]).toBe<Writable>();
expectTypeOf(ignoreStdioSubprocess.stdout).toBe<Readable>();
expectTypeOf(ignoreStdioSubprocess.stdio[1]).toBe<Readable>();
expectTypeOf(ignoreStdioSubprocess.stderr).toBe<Readable>();
expectTypeOf(ignoreStdioSubprocess.stdio[2]).toBe<Readable>();
expectTypeOf(ignoreStdioSubprocess.all).toBe<Readable>();
expectTypeOf(ignoreStdioSubprocess.stdio[3]).toBe<null>();

const ignoreStdioResult = await ignoreStdioSubprocess;
expectTypeOf(ignoreStdioResult.stdout).toBe<string>();
expectTypeOf(ignoreStdioResult.stderr).toBe<string>();
expectTypeOf(ignoreStdioResult.all).toBe<string>();

const ignoreStdoutResultSync = execaSync('unicorns', {stdout: 'ignore', all: true});
expectTypeOf(ignoreStdoutResultSync.stdout).toBe<undefined>();
expectTypeOf(ignoreStdoutResultSync.stdio[1]).toBe<undefined>();
expectTypeOf(ignoreStdoutResultSync.stderr).toBe<string>();
expectTypeOf(ignoreStdoutResultSync.stdio[2]).toBe<string>();
expectTypeOf(ignoreStdoutResultSync.all).toBe<string>();

const ignoreStderrResultSync = execaSync('unicorns', {stderr: 'ignore', all: true});
expectTypeOf(ignoreStderrResultSync.stdout).toBe<string>();
expectTypeOf(ignoreStderrResultSync.stderr).toBe<undefined>();
expectTypeOf(ignoreStderrResultSync.all).toBe<string>();

const ignoreFd3Result = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'ignore']});
expectTypeOf(ignoreFd3Result.stdio[3]).toBe<undefined>();

const ignoreStdoutError = new Error('.') as ExecaError<{stdout: 'ignore'; all: true}>;
expectTypeOf(ignoreStdoutError.stdout).toBe<undefined>();
expectTypeOf(ignoreStdoutError.stdio[1]).toBe<undefined>();
expectTypeOf(ignoreStdoutError.stderr).toBe<string>();
expectTypeOf(ignoreStdoutError.stdio[2]).toBe<string>();
expectTypeOf(ignoreStdoutError.all).toBe<string>();

const ignoreStderrError = new Error('.') as ExecaError<{stderr: 'ignore'; all: true}>;
expectTypeOf(ignoreStderrError.stdout).toBe<string>();
expectTypeOf(ignoreStderrError.stderr).toBe<undefined>();
expectTypeOf(ignoreStderrError.all).toBe<string>();

const ignoreStdoutErrorSync = new Error('.') as ExecaSyncError<{stdout: 'ignore'; all: true}>;
expectTypeOf(ignoreStdoutErrorSync.stdout).toBe<undefined>();
expectTypeOf(ignoreStdoutErrorSync.stdio[1]).toBe<undefined>();
expectTypeOf(ignoreStdoutErrorSync.stderr).toBe<string>();
expectTypeOf(ignoreStdoutErrorSync.stdio[2]).toBe<string>();
expectTypeOf(ignoreStdoutErrorSync.all).toBe<string>();

const ignoreStderrErrorSync = new Error('.') as ExecaSyncError<{stderr: 'ignore'; all: true}>;
expectTypeOf(ignoreStderrErrorSync.stdout).toBe<string>();
expectTypeOf(ignoreStderrErrorSync.stderr).toBe<undefined>();
expectTypeOf(ignoreStderrErrorSync.all).toBe<string>();
