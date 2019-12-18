import {expectType, expectError} from 'tsd';
import {Readable as ReadableStream} from 'stream'
import execa = require('.');
import {
	ExecaReturnValue,
	ExecaChildProcess,
	ExecaError,
	ExecaSyncReturnValue,
	ExecaSyncError
} from '.';

try {
	const execaPromise = execa('unicorns');
	execaPromise.cancel();
	expectType<ReadableStream | undefined>(execaPromise.all)

	const unicornsResult = await execaPromise;
	expectType<string>(unicornsResult.command);
	expectType<number>(unicornsResult.exitCode);
	expectType<string>(unicornsResult.stdout);
	expectType<string>(unicornsResult.stderr);
	expectType<string | undefined>(unicornsResult.all);
	expectType<boolean>(unicornsResult.failed);
	expectType<boolean>(unicornsResult.timedOut);
	expectType<boolean>(unicornsResult.isCanceled);
	expectType<boolean>(unicornsResult.killed);
	expectType<string | undefined>(unicornsResult.signal);
	expectType<string | undefined>(unicornsResult.signalDescription);
} catch (error) {
	const execaError: ExecaError = error;

	expectType<string>(execaError.message);
	expectType<number>(execaError.exitCode);
	expectType<string>(execaError.stdout);
	expectType<string>(execaError.stderr);
	expectType<string | undefined>(execaError.all);
	expectType<boolean>(execaError.failed);
	expectType<boolean>(execaError.timedOut);
	expectType<boolean>(execaError.isCanceled);
	expectType<boolean>(execaError.killed);
	expectType<string | undefined>(execaError.signal);
	expectType<string | undefined>(execaError.signalDescription);
	expectType<string>(execaError.shortMessage);
	expectType<string | undefined>(execaError.originalMessage);
}

try {
	const unicornsResult = execa.sync('unicorns');
	expectType<string>(unicornsResult.command);
	expectType<number>(unicornsResult.exitCode);
	expectType<string>(unicornsResult.stdout);
	expectType<string>(unicornsResult.stderr);
	expectError(unicornsResult.all);
	expectType<boolean>(unicornsResult.failed);
	expectType<boolean>(unicornsResult.timedOut);
	expectError(unicornsResult.isCanceled);
	expectType<boolean>(unicornsResult.killed);
	expectType<string | undefined>(unicornsResult.signal);
	expectType<string | undefined>(unicornsResult.signalDescription);
} catch (error) {
	const execaError: ExecaSyncError = error;

	expectType<string>(execaError.message);
	expectType<number>(execaError.exitCode);
	expectType<string>(execaError.stdout);
	expectType<string>(execaError.stderr);
	expectError(execaError.all);
	expectType<boolean>(execaError.failed);
	expectType<boolean>(execaError.timedOut);
	expectError(execaError.isCanceled);
	expectType<boolean>(execaError.killed);
	expectType<string | undefined>(execaError.signal);
	expectType<string | undefined>(execaError.signalDescription);
	expectType<string>(execaError.shortMessage);
	expectType<string | undefined>(execaError.originalMessage);
}

execa('unicorns', {cleanup: false});
execa('unicorns', {preferLocal: false});
execa('unicorns', {localDir: '.'});
execa('unicorns', {execPath: '/path'});
execa('unicorns', {buffer: false});
execa('unicorns', {input: ''});
execa('unicorns', {input: Buffer.from('')});
execa('unicorns', {input: process.stdin});
execa('unicorns', {stdin: 'pipe'});
execa('unicorns', {stdin: 'ipc'});
execa('unicorns', {stdin: 'ignore'});
execa('unicorns', {stdin: 'inherit'});
execa('unicorns', {stdin: process.stdin});
execa('unicorns', {stdin: 1});
execa('unicorns', {stdin: undefined});
execa('unicorns', {stdout: 'pipe'});
execa('unicorns', {stdout: 'ipc'});
execa('unicorns', {stdout: 'ignore'});
execa('unicorns', {stdout: 'inherit'});
execa('unicorns', {stdout: process.stdout});
execa('unicorns', {stdout: 1});
execa('unicorns', {stdout: undefined});
execa('unicorns', {stderr: 'pipe'});
execa('unicorns', {stderr: 'ipc'});
execa('unicorns', {stderr: 'ignore'});
execa('unicorns', {stderr: 'inherit'});
execa('unicorns', {stderr: process.stderr});
execa('unicorns', {stderr: 1});
execa('unicorns', {stderr: undefined});
execa('unicorns', {all: true});
execa('unicorns', {reject: false});
execa('unicorns', {stripFinalNewline: false});
execa('unicorns', {extendEnv: false});
execa('unicorns', {cwd: '.'});
execa('unicorns', {env: {PATH: ''}});
execa('unicorns', {argv0: ''});
execa('unicorns', {stdio: 'pipe'});
execa('unicorns', {stdio: 'ignore'});
execa('unicorns', {stdio: 'inherit'});
execa('unicorns', {
	stdio: ['pipe', 'ipc', 'ignore', 'inherit', process.stdin, 1, undefined]
});
execa('unicorns', {serialization: 'advanced'});
execa('unicorns', {detached: true});
execa('unicorns', {uid: 0});
execa('unicorns', {gid: 0});
execa('unicorns', {shell: true});
execa('unicorns', {shell: '/bin/sh'});
execa('unicorns', {timeout: 1000});
execa('unicorns', {maxBuffer: 1000});
execa('unicorns', {killSignal: 'SIGTERM'});
execa('unicorns', {killSignal: 9});
execa('unicorns', {windowsVerbatimArguments: true});
execa('unicorns', {windowsHide: false});
execa('unicorns').kill();
execa('unicorns').kill('SIGKILL');
execa('unicorns').kill(undefined);
execa('unicorns').kill('SIGKILL', {});
execa('unicorns').kill('SIGKILL', {forceKillAfterTimeout: false});
execa('unicorns').kill('SIGKILL', {forceKillAfterTimeout: 42});
execa('unicorns').kill('SIGKILL', {forceKillAfterTimeout: undefined});

expectType<ExecaChildProcess<string>>(execa('unicorns'));
expectType<ExecaReturnValue<string>>(await execa('unicorns'));
expectType<ExecaReturnValue<string>>(
	await execa('unicorns', {encoding: 'utf8'})
);
expectType<ExecaReturnValue<Buffer>>(await execa('unicorns', {encoding: null}));
expectType<ExecaReturnValue<string>>(
	await execa('unicorns', ['foo'], {encoding: 'utf8'})
);
expectType<ExecaReturnValue<Buffer>>(
	await execa('unicorns', ['foo'], {encoding: null})
);

expectType<ExecaSyncReturnValue<string>>(execa.sync('unicorns'));
expectType<ExecaSyncReturnValue<string>>(
	execa.sync('unicorns', {encoding: 'utf8'})
);
expectType<ExecaSyncReturnValue<Buffer>>(
	execa.sync('unicorns', {encoding: null})
);
expectType<ExecaSyncReturnValue<string>>(
	execa.sync('unicorns', ['foo'], {encoding: 'utf8'})
);
expectType<ExecaSyncReturnValue<Buffer>>(
	execa.sync('unicorns', ['foo'], {encoding: null})
);

expectType<ExecaChildProcess<string>>(execa.command('unicorns'));
expectType<ExecaReturnValue<string>>(await execa.command('unicorns'));
expectType<ExecaReturnValue<string>>(await execa.command('unicorns', {encoding: 'utf8'}));
expectType<ExecaReturnValue<Buffer>>(await execa.command('unicorns', {encoding: null}));
expectType<ExecaReturnValue<string>>(await execa.command('unicorns foo', {encoding: 'utf8'}));
expectType<ExecaReturnValue<Buffer>>(await execa.command('unicorns foo', {encoding: null}));

expectType<ExecaSyncReturnValue<string>>(execa.commandSync('unicorns'));
expectType<ExecaSyncReturnValue<string>>(execa.commandSync('unicorns', {encoding: 'utf8'}));
expectType<ExecaSyncReturnValue<Buffer>>(execa.commandSync('unicorns', {encoding: null}));
expectType<ExecaSyncReturnValue<string>>(execa.commandSync('unicorns foo', {encoding: 'utf8'}));
expectType<ExecaSyncReturnValue<Buffer>>(execa.commandSync('unicorns foo', {encoding: null}));

expectType<ExecaChildProcess<string>>(execa.node('unicorns'));
expectType<ExecaReturnValue<string>>(await execa.node('unicorns'));
expectType<ExecaReturnValue<string>>(
	await execa.node('unicorns', {encoding: 'utf8'})
);
expectType<ExecaReturnValue<Buffer>>(await execa.node('unicorns', {encoding: null}));
expectType<ExecaReturnValue<string>>(
	await execa.node('unicorns', ['foo'], {encoding: 'utf8'})
);
expectType<ExecaReturnValue<Buffer>>(
	await execa.node('unicorns', ['foo'], {encoding: null})
);
