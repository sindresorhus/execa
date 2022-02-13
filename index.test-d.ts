import {Buffer} from 'node:buffer';
// For some reason a default import of `process` causes
// `process.stdin`, `process.stderr`, and `process.stdout`
// to get treated as `any` by `@typescript-eslint/no-unsafe-assignment`.
import * as process from 'node:process';
import {Readable as ReadableStream} from 'node:stream';
import {expectType, expectError} from 'tsd';
import {
	execa,
	execaSync,
	execaCommand,
	execaCommandSync,
	execaNode,
	ExecaReturnValue,
	ExecaChildProcess,
	ExecaError,
	ExecaSyncReturnValue,
	ExecaSyncError,
} from './index.js';

try {
	const execaPromise = execa('unicorns');
	execaPromise.cancel();
	expectType<ReadableStream | undefined>(execaPromise.all);

	const unicornsResult = await execaPromise;
	expectType<string>(unicornsResult.command);
	expectType<string>(unicornsResult.escapedCommand);
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
} catch (error: unknown) {
	const execaError = error as ExecaError;

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
	const unicornsResult = execaSync('unicorns');
	expectType<string>(unicornsResult.command);
	expectType<string>(unicornsResult.escapedCommand);
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
} catch (error: unknown) {
	const execaError = error as ExecaSyncError;

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

/* eslint-disable @typescript-eslint/no-floating-promises */
execa('unicorns', {cleanup: false});
execa('unicorns', {preferLocal: false});
execa('unicorns', {localDir: '.'});
execa('unicorns', {localDir: new URL('file:///test')});
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
execa('unicorns', {cwd: new URL('file:///test')});
// eslint-disable-next-line @typescript-eslint/naming-convention
execa('unicorns', {env: {PATH: ''}});
execa('unicorns', {argv0: ''});
execa('unicorns', {stdio: 'pipe'});
execa('unicorns', {stdio: 'ignore'});
execa('unicorns', {stdio: 'inherit'});
execa('unicorns', {
	stdio: ['pipe', 'ipc', 'ignore', 'inherit', process.stdin, 1, undefined],
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
execa('unicorns', {signal: new AbortController().signal});
execa('unicorns', {windowsVerbatimArguments: true});
execa('unicorns', {windowsHide: false});
/* eslint-enable @typescript-eslint/no-floating-promises */
execa('unicorns').kill();
execa('unicorns').kill('SIGKILL');
execa('unicorns').kill(undefined);
execa('unicorns').kill('SIGKILL', {});
execa('unicorns').kill('SIGKILL', {forceKillAfterTimeout: false});
execa('unicorns').kill('SIGKILL', {forceKillAfterTimeout: 42});
execa('unicorns').kill('SIGKILL', {forceKillAfterTimeout: undefined});

expectType<ExecaChildProcess>(execa('unicorns'));
expectType<ExecaReturnValue>(await execa('unicorns'));
expectType<ExecaReturnValue>(
	await execa('unicorns', {encoding: 'utf8'}),
);
expectType<ExecaReturnValue<Buffer>>(await execa('unicorns', {encoding: null}));
expectType<ExecaReturnValue>(
	await execa('unicorns', ['foo'], {encoding: 'utf8'}),
);
expectType<ExecaReturnValue<Buffer>>(
	await execa('unicorns', ['foo'], {encoding: null}),
);

expectType<ExecaSyncReturnValue>(execaSync('unicorns'));
expectType<ExecaSyncReturnValue>(
	execaSync('unicorns', {encoding: 'utf8'}),
);
expectType<ExecaSyncReturnValue<Buffer>>(
	execaSync('unicorns', {encoding: null}),
);
expectType<ExecaSyncReturnValue>(
	execaSync('unicorns', ['foo'], {encoding: 'utf8'}),
);
expectType<ExecaSyncReturnValue<Buffer>>(
	execaSync('unicorns', ['foo'], {encoding: null}),
);

expectType<ExecaChildProcess>(execaCommand('unicorns'));
expectType<ExecaReturnValue>(await execaCommand('unicorns'));
expectType<ExecaReturnValue>(await execaCommand('unicorns', {encoding: 'utf8'}));
expectType<ExecaReturnValue<Buffer>>(await execaCommand('unicorns', {encoding: null}));
expectType<ExecaReturnValue>(await execaCommand('unicorns foo', {encoding: 'utf8'}));
expectType<ExecaReturnValue<Buffer>>(await execaCommand('unicorns foo', {encoding: null}));

expectType<ExecaSyncReturnValue>(execaCommandSync('unicorns'));
expectType<ExecaSyncReturnValue>(execaCommandSync('unicorns', {encoding: 'utf8'}));
expectType<ExecaSyncReturnValue<Buffer>>(execaCommandSync('unicorns', {encoding: null}));
expectType<ExecaSyncReturnValue>(execaCommandSync('unicorns foo', {encoding: 'utf8'}));
expectType<ExecaSyncReturnValue<Buffer>>(execaCommandSync('unicorns foo', {encoding: null}));

expectType<ExecaChildProcess>(execaNode('unicorns'));
expectType<ExecaReturnValue>(await execaNode('unicorns'));
expectType<ExecaReturnValue>(
	await execaNode('unicorns', {encoding: 'utf8'}),
);
expectType<ExecaReturnValue<Buffer>>(await execaNode('unicorns', {encoding: null}));
expectType<ExecaReturnValue>(
	await execaNode('unicorns', ['foo'], {encoding: 'utf8'}),
);
expectType<ExecaReturnValue<Buffer>>(
	await execaNode('unicorns', ['foo'], {encoding: null}),
);
