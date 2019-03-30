import {expectType, expectError} from 'tsd';
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

	const unicornsResult = await execaPromise;
	expectType<string>(unicornsResult.command);
	expectType<string | number>(unicornsResult.code);
	expectType<boolean>(unicornsResult.failed);
	expectType<boolean>(unicornsResult.killed);
	expectType<string | undefined>(unicornsResult.signal);
	expectType<string>(unicornsResult.stderr);
	expectType<string>(unicornsResult.stdout);
	expectType<string>(unicornsResult.all);
	expectType<boolean>(unicornsResult.timedOut);
	expectType<boolean>(unicornsResult.isCanceled);
} catch (error) {
	const execaError: ExecaError = error;

	expectType<string>(execaError.message);
	expectType<number | string>(execaError.code);
	expectType<string>(execaError.all);
	expectType<boolean>(execaError.isCanceled);
}

try {
	const unicornsResult = execa.sync('unicorns');
	expectType<string>(unicornsResult.command);
	expectType<string | number>(unicornsResult.code);
	expectType<boolean>(unicornsResult.failed);
	expectType<boolean>(unicornsResult.killed);
	expectType<string | undefined>(unicornsResult.signal);
	expectType<string>(unicornsResult.stderr);
	expectType<string>(unicornsResult.stdout);
	expectType<boolean>(unicornsResult.timedOut);
	expectError(unicornsResult.all);
	expectError(unicornsResult.isCanceled);
} catch (error) {
	const execaError: ExecaSyncError = error;

	expectType<string>(execaError.message);
	expectType<number | string>(execaError.code);
	expectError(execaError.all);
	expectError(execaError.isCanceled);
}

execa('unicorns', {cwd: '.'});
execa('unicorns', {env: {PATH: ''}});
execa('unicorns', {extendEnv: false});
execa('unicorns', {argv0: ''});
execa('unicorns', {stdio: 'pipe'});
execa('unicorns', {stdio: 'ignore'});
execa('unicorns', {stdio: 'inherit'});
execa('unicorns', {
	stdio: ['pipe', 'ipc', 'ignore', 'inherit', process.stdin, 1, null, undefined]
});
execa('unicorns', {detached: true});
execa('unicorns', {uid: 0});
execa('unicorns', {gid: 0});
execa('unicorns', {shell: true});
execa('unicorns', {shell: '/bin/sh'});
execa('unicorns', {stripFinalNewline: false});
execa('unicorns', {preferLocal: false});
execa('unicorns', {localDir: '.'});
execa('unicorns', {reject: false});
execa('unicorns', {cleanup: false});
execa('unicorns', {timeout: 1000});
execa('unicorns', {buffer: false});
execa('unicorns', {maxBuffer: 1000});
execa('unicorns', {killSignal: 'SIGTERM'});
execa('unicorns', {killSignal: 9});
execa('unicorns', {stdin: 'pipe'});
execa('unicorns', {stdin: 'ipc'});
execa('unicorns', {stdin: 'ignore'});
execa('unicorns', {stdin: 'inherit'});
execa('unicorns', {stdin: process.stdin});
execa('unicorns', {stdin: 1});
execa('unicorns', {stdin: null});
execa('unicorns', {stdin: undefined});
execa('unicorns', {stderr: 'pipe'});
execa('unicorns', {stderr: 'ipc'});
execa('unicorns', {stderr: 'ignore'});
execa('unicorns', {stderr: 'inherit'});
execa('unicorns', {stderr: process.stderr});
execa('unicorns', {stderr: 1});
execa('unicorns', {stderr: null});
execa('unicorns', {stderr: undefined});
execa('unicorns', {stdout: 'pipe'});
execa('unicorns', {stdout: 'ipc'});
execa('unicorns', {stdout: 'ignore'});
execa('unicorns', {stdout: 'inherit'});
execa('unicorns', {stdout: process.stdout});
execa('unicorns', {stdout: 1});
execa('unicorns', {stdout: null});
execa('unicorns', {stdout: undefined});
execa('unicorns', {windowsVerbatimArguments: true});

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

expectType<Promise<string>>(execa.stdout('unicorns'));
expectType<string>(await execa.stdout('unicorns'));
expectType<string>(await execa.stdout('unicorns', {encoding: 'utf8'}));
expectType<Buffer>(await execa.stdout('unicorns', {encoding: null}));
expectType<string>(await execa.stdout('unicorns', ['foo'], {encoding: 'utf8'}));
expectType<Buffer>(await execa.stdout('unicorns', ['foo'], {encoding: null}));

expectType<Promise<string>>(execa.stderr('unicorns'));
expectType<string>(await execa.stderr('unicorns'));
expectType<string>(await execa.stderr('unicorns', {encoding: 'utf8'}));
expectType<Buffer>(await execa.stderr('unicorns', {encoding: null}));
expectType<string>(await execa.stderr('unicorns', ['foo'], {encoding: 'utf8'}));
expectType<Buffer>(await execa.stderr('unicorns', ['foo'], {encoding: null}));

expectType<ExecaChildProcess<string>>(execa.shell('unicorns'));
expectType<ExecaReturnValue<string>>(await execa.shell('unicorns'));
expectType<ExecaReturnValue<string>>(
	await execa.shell('unicorns', {encoding: 'utf8'})
);
expectType<ExecaReturnValue<Buffer>>(
	await execa.shell('unicorns', {encoding: null})
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

expectType<ExecaSyncReturnValue<string>>(execa.shellSync('unicorns'));
expectType<ExecaSyncReturnValue<string>>(
	execa.shellSync('unicorns', {encoding: 'utf8'})
);
expectType<ExecaSyncReturnValue<Buffer>>(
	execa.shellSync('unicorns', {encoding: null})
);
