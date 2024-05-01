import {type Readable, type Writable} from 'node:stream';
import {expectType, expectError} from 'tsd';
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
expectType<null>(ignoreAnySubprocess.stdin);
expectType<null>(ignoreAnySubprocess.stdio[0]);
expectType<null>(ignoreAnySubprocess.stdout);
expectType<null>(ignoreAnySubprocess.stdio[1]);
expectType<null>(ignoreAnySubprocess.stderr);
expectType<null>(ignoreAnySubprocess.stdio[2]);
expectType<undefined>(ignoreAnySubprocess.all);
expectError(ignoreAnySubprocess.stdio[3].destroy());

const ignoreAnyResult = await ignoreAnySubprocess;
expectType<undefined>(ignoreAnyResult.stdout);
expectType<undefined>(ignoreAnyResult.stdio[1]);
expectType<undefined>(ignoreAnyResult.stderr);
expectType<undefined>(ignoreAnyResult.stdio[2]);
expectType<undefined>(ignoreAnyResult.all);

const ignoreAllSubprocess = execa('unicorns', {stdio: 'ignore', all: true});
expectType<null>(ignoreAllSubprocess.stdin);
expectType<null>(ignoreAllSubprocess.stdio[0]);
expectType<null>(ignoreAllSubprocess.stdout);
expectType<null>(ignoreAllSubprocess.stdio[1]);
expectType<null>(ignoreAllSubprocess.stderr);
expectType<null>(ignoreAllSubprocess.stdio[2]);
expectType<undefined>(ignoreAllSubprocess.all);
expectError(ignoreAllSubprocess.stdio[3].destroy());

const ignoreAllResult = await ignoreAllSubprocess;
expectType<undefined>(ignoreAllResult.stdout);
expectType<undefined>(ignoreAllResult.stdio[1]);
expectType<undefined>(ignoreAllResult.stderr);
expectType<undefined>(ignoreAllResult.stdio[2]);
expectType<undefined>(ignoreAllResult.all);

const ignoreStdioArraySubprocess = execa('unicorns', {stdio: ['ignore', 'ignore', 'pipe', 'pipe'], all: true});
expectType<null>(ignoreStdioArraySubprocess.stdin);
expectType<null>(ignoreStdioArraySubprocess.stdio[0]);
expectType<null>(ignoreStdioArraySubprocess.stdout);
expectType<null>(ignoreStdioArraySubprocess.stdio[1]);
expectType<Readable>(ignoreStdioArraySubprocess.stderr);
expectType<Readable>(ignoreStdioArraySubprocess.stdio[2]);
expectType<Readable>(ignoreStdioArraySubprocess.all);
expectType<Readable>(ignoreStdioArraySubprocess.stdio[3]);
const ignoreStdioArrayResult = await ignoreStdioArraySubprocess;
expectType<undefined>(ignoreStdioArrayResult.stdout);
expectType<undefined>(ignoreStdioArrayResult.stdio[1]);
expectType<string>(ignoreStdioArrayResult.stderr);
expectType<string>(ignoreStdioArrayResult.stdio[2]);
expectType<string>(ignoreStdioArrayResult.all);

const ignoreStdioArrayReadSubprocess = execa('unicorns', {stdio: ['ignore', 'ignore', 'pipe', new Uint8Array()], all: true});
expectType<Writable>(ignoreStdioArrayReadSubprocess.stdio[3]);

const ignoreStdinSubprocess = execa('unicorns', {stdin: 'ignore'});
expectType<null>(ignoreStdinSubprocess.stdin);

const ignoreStdoutSubprocess = execa('unicorns', {stdout: 'ignore', all: true});
expectType<Writable>(ignoreStdoutSubprocess.stdin);
expectType<Writable>(ignoreStdoutSubprocess.stdio[0]);
expectType<null>(ignoreStdoutSubprocess.stdout);
expectType<null>(ignoreStdoutSubprocess.stdio[1]);
expectType<Readable>(ignoreStdoutSubprocess.stderr);
expectType<Readable>(ignoreStdoutSubprocess.stdio[2]);
expectType<Readable>(ignoreStdoutSubprocess.all);
expectError(ignoreStdoutSubprocess.stdio[3].destroy());

const ignoreStdoutResult = await ignoreStdoutSubprocess;
expectType<undefined>(ignoreStdoutResult.stdout);
expectType<string>(ignoreStdoutResult.stderr);
expectType<string>(ignoreStdoutResult.all);

const ignoreStderrSubprocess = execa('unicorns', {stderr: 'ignore', all: true});
expectType<Writable>(ignoreStderrSubprocess.stdin);
expectType<Writable>(ignoreStderrSubprocess.stdio[0]);
expectType<Readable>(ignoreStderrSubprocess.stdout);
expectType<Readable>(ignoreStderrSubprocess.stdio[1]);
expectType<null>(ignoreStderrSubprocess.stderr);
expectType<null>(ignoreStderrSubprocess.stdio[2]);
expectType<Readable>(ignoreStderrSubprocess.all);
expectError(ignoreStderrSubprocess.stdio[3].destroy());

const ignoreStderrResult = await ignoreStderrSubprocess;
expectType<string>(ignoreStderrResult.stdout);
expectType<undefined>(ignoreStderrResult.stderr);
expectType<string>(ignoreStderrResult.all);

const ignoreStdioSubprocess = execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'ignore'], all: true});
expectType<Writable>(ignoreStdioSubprocess.stdin);
expectType<Writable>(ignoreStdioSubprocess.stdio[0]);
expectType<Readable>(ignoreStdioSubprocess.stdout);
expectType<Readable>(ignoreStdioSubprocess.stdio[1]);
expectType<Readable>(ignoreStdioSubprocess.stderr);
expectType<Readable>(ignoreStdioSubprocess.stdio[2]);
expectType<Readable>(ignoreStdioSubprocess.all);
expectType<null>(ignoreStdioSubprocess.stdio[3]);

const ignoreStdioResult = await ignoreStdioSubprocess;
expectType<string>(ignoreStdioResult.stdout);
expectType<string>(ignoreStdioResult.stderr);
expectType<string>(ignoreStdioResult.all);

const ignoreStdoutResultSync = execaSync('unicorns', {stdout: 'ignore', all: true});
expectType<undefined>(ignoreStdoutResultSync.stdout);
expectType<undefined>(ignoreStdoutResultSync.stdio[1]);
expectType<string>(ignoreStdoutResultSync.stderr);
expectType<string>(ignoreStdoutResultSync.stdio[2]);
expectType<string>(ignoreStdoutResultSync.all);

const ignoreStderrResultSync = execaSync('unicorns', {stderr: 'ignore', all: true});
expectType<string>(ignoreStderrResultSync.stdout);
expectType<undefined>(ignoreStderrResultSync.stderr);
expectType<string>(ignoreStderrResultSync.all);

const ignoreFd3Result = await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'ignore']});
expectType<undefined>(ignoreFd3Result.stdio[3]);

const ignoreStdoutError = new Error('.') as ExecaError<{stdout: 'ignore'; all: true}>;
expectType<undefined>(ignoreStdoutError.stdout);
expectType<undefined>(ignoreStdoutError.stdio[1]);
expectType<string>(ignoreStdoutError.stderr);
expectType<string>(ignoreStdoutError.stdio[2]);
expectType<string>(ignoreStdoutError.all);

const ignoreStderrError = new Error('.') as ExecaError<{stderr: 'ignore'; all: true}>;
expectType<string>(ignoreStderrError.stdout);
expectType<undefined>(ignoreStderrError.stderr);
expectType<string>(ignoreStderrError.all);

const ignoreStdoutErrorSync = new Error('.') as ExecaSyncError<{stdout: 'ignore'; all: true}>;
expectType<undefined>(ignoreStdoutErrorSync.stdout);
expectType<undefined>(ignoreStdoutErrorSync.stdio[1]);
expectType<string>(ignoreStdoutErrorSync.stderr);
expectType<string>(ignoreStdoutErrorSync.stdio[2]);
expectType<string>(ignoreStdoutErrorSync.all);

const ignoreStderrErrorSync = new Error('.') as ExecaSyncError<{stderr: 'ignore'; all: true}>;
expectType<string>(ignoreStderrErrorSync.stdout);
expectType<undefined>(ignoreStderrErrorSync.stderr);
expectType<string>(ignoreStderrErrorSync.all);
