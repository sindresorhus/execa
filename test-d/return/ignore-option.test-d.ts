import {type Readable, type Writable} from 'node:stream';
import {expectType, expectError} from 'tsd';
import {
	execa,
	execaSync,
	type ExecaError,
	type ExecaSyncError,
} from '../../index.js';

const ignoreAnyPromise = execa('unicorns', {
	stdin: 'ignore',
	stdout: 'ignore',
	stderr: 'ignore',
	all: true,
});
expectType<null>(ignoreAnyPromise.stdin);
expectType<null>(ignoreAnyPromise.stdio[0]);
expectType<null>(ignoreAnyPromise.stdout);
expectType<null>(ignoreAnyPromise.stdio[1]);
expectType<null>(ignoreAnyPromise.stderr);
expectType<null>(ignoreAnyPromise.stdio[2]);
expectType<undefined>(ignoreAnyPromise.all);
expectError(ignoreAnyPromise.stdio[3].destroy());

const ignoreAnyResult = await ignoreAnyPromise;
expectType<undefined>(ignoreAnyResult.stdout);
expectType<undefined>(ignoreAnyResult.stdio[1]);
expectType<undefined>(ignoreAnyResult.stderr);
expectType<undefined>(ignoreAnyResult.stdio[2]);
expectType<undefined>(ignoreAnyResult.all);

const ignoreAllPromise = execa('unicorns', {stdio: 'ignore', all: true});
expectType<null>(ignoreAllPromise.stdin);
expectType<null>(ignoreAllPromise.stdio[0]);
expectType<null>(ignoreAllPromise.stdout);
expectType<null>(ignoreAllPromise.stdio[1]);
expectType<null>(ignoreAllPromise.stderr);
expectType<null>(ignoreAllPromise.stdio[2]);
expectType<undefined>(ignoreAllPromise.all);
expectError(ignoreAllPromise.stdio[3].destroy());

const ignoreAllResult = await ignoreAllPromise;
expectType<undefined>(ignoreAllResult.stdout);
expectType<undefined>(ignoreAllResult.stdio[1]);
expectType<undefined>(ignoreAllResult.stderr);
expectType<undefined>(ignoreAllResult.stdio[2]);
expectType<undefined>(ignoreAllResult.all);

const ignoreStdioArrayPromise = execa('unicorns', {stdio: ['ignore', 'ignore', 'pipe', 'pipe'], all: true});
expectType<null>(ignoreStdioArrayPromise.stdin);
expectType<null>(ignoreStdioArrayPromise.stdio[0]);
expectType<null>(ignoreStdioArrayPromise.stdout);
expectType<null>(ignoreStdioArrayPromise.stdio[1]);
expectType<Readable>(ignoreStdioArrayPromise.stderr);
expectType<Readable>(ignoreStdioArrayPromise.stdio[2]);
expectType<Readable>(ignoreStdioArrayPromise.all);
expectType<Readable>(ignoreStdioArrayPromise.stdio[3]);
const ignoreStdioArrayResult = await ignoreStdioArrayPromise;
expectType<undefined>(ignoreStdioArrayResult.stdout);
expectType<undefined>(ignoreStdioArrayResult.stdio[1]);
expectType<string>(ignoreStdioArrayResult.stderr);
expectType<string>(ignoreStdioArrayResult.stdio[2]);
expectType<string>(ignoreStdioArrayResult.all);

const ignoreStdioArrayReadPromise = execa('unicorns', {stdio: ['ignore', 'ignore', 'pipe', new Uint8Array()], all: true});
expectType<Writable>(ignoreStdioArrayReadPromise.stdio[3]);

const ignoreStdinPromise = execa('unicorns', {stdin: 'ignore'});
expectType<null>(ignoreStdinPromise.stdin);

const ignoreStdoutPromise = execa('unicorns', {stdout: 'ignore', all: true});
expectType<Writable>(ignoreStdoutPromise.stdin);
expectType<Writable>(ignoreStdoutPromise.stdio[0]);
expectType<null>(ignoreStdoutPromise.stdout);
expectType<null>(ignoreStdoutPromise.stdio[1]);
expectType<Readable>(ignoreStdoutPromise.stderr);
expectType<Readable>(ignoreStdoutPromise.stdio[2]);
expectType<Readable>(ignoreStdoutPromise.all);
expectError(ignoreStdoutPromise.stdio[3].destroy());

const ignoreStdoutResult = await ignoreStdoutPromise;
expectType<undefined>(ignoreStdoutResult.stdout);
expectType<string>(ignoreStdoutResult.stderr);
expectType<string>(ignoreStdoutResult.all);

const ignoreStderrPromise = execa('unicorns', {stderr: 'ignore', all: true});
expectType<Writable>(ignoreStderrPromise.stdin);
expectType<Writable>(ignoreStderrPromise.stdio[0]);
expectType<Readable>(ignoreStderrPromise.stdout);
expectType<Readable>(ignoreStderrPromise.stdio[1]);
expectType<null>(ignoreStderrPromise.stderr);
expectType<null>(ignoreStderrPromise.stdio[2]);
expectType<Readable>(ignoreStderrPromise.all);
expectError(ignoreStderrPromise.stdio[3].destroy());

const ignoreStderrResult = await ignoreStderrPromise;
expectType<string>(ignoreStderrResult.stdout);
expectType<undefined>(ignoreStderrResult.stderr);
expectType<string>(ignoreStderrResult.all);

const ignoreStdioPromise = execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'ignore'], all: true});
expectType<Writable>(ignoreStdioPromise.stdin);
expectType<Writable>(ignoreStdioPromise.stdio[0]);
expectType<Readable>(ignoreStdioPromise.stdout);
expectType<Readable>(ignoreStdioPromise.stdio[1]);
expectType<Readable>(ignoreStdioPromise.stderr);
expectType<Readable>(ignoreStdioPromise.stdio[2]);
expectType<Readable>(ignoreStdioPromise.all);
expectType<null>(ignoreStdioPromise.stdio[3]);

const ignoreStdioResult = await ignoreStdioPromise;
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
