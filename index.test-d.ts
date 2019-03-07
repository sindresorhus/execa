import {expectType} from 'tsd-check';
import execa, {
	ExecaReturns,
	ExecaChildProcess,
	stdout,
	stderr,
	shell,
	sync,
	shellSync
} from '.';

const unicornsResult = await execa('unicorns');
expectType<string>(unicornsResult.cmd);
expectType<number>(unicornsResult.code);
expectType<boolean>(unicornsResult.failed);
expectType<boolean>(unicornsResult.killed);
expectType<string | null>(unicornsResult.signal);
expectType<string>(unicornsResult.stderr);
expectType<string>(unicornsResult.stdout);
expectType<boolean>(unicornsResult.timedOut);

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
expectType<ExecaReturns<string>>(await execa('unicorns'));
expectType<ExecaReturns<string>>(await execa('unicorns', {encoding: 'utf8'}));
expectType<ExecaReturns<Buffer>>(await execa('unicorns', {encoding: null}));
expectType<ExecaReturns<string>>(
	await execa('unicorns', ['foo'], {encoding: 'utf8'})
);
expectType<ExecaReturns<Buffer>>(
	await execa('unicorns', ['foo'], {encoding: null})
);

expectType<Promise<string>>(stdout('unicorns'));
expectType<string>(await stdout('unicorns'));
expectType<string>(await stdout('unicorns', {encoding: 'utf8'}));
expectType<Buffer>(await stdout('unicorns', {encoding: null}));
expectType<string>(await stdout('unicorns', ['foo'], {encoding: 'utf8'}));
expectType<Buffer>(await stdout('unicorns', ['foo'], {encoding: null}));

expectType<Promise<string>>(stderr('unicorns'));
expectType<string>(await stderr('unicorns'));
expectType<string>(await stderr('unicorns', {encoding: 'utf8'}));
expectType<Buffer>(await stderr('unicorns', {encoding: null}));
expectType<string>(await stderr('unicorns', ['foo'], {encoding: 'utf8'}));
expectType<Buffer>(await stderr('unicorns', ['foo'], {encoding: null}));

expectType<ExecaChildProcess<string>>(shell('unicorns'));
expectType<ExecaReturns<string>>(await shell('unicorns'));
expectType<ExecaReturns<string>>(await shell('unicorns', {encoding: 'utf8'}));
expectType<ExecaReturns<Buffer>>(await shell('unicorns', {encoding: null}));

expectType<ExecaReturns<string>>(sync('unicorns'));
expectType<ExecaReturns<string>>(sync('unicorns', {encoding: 'utf8'}));
expectType<ExecaReturns<Buffer>>(sync('unicorns', {encoding: null}));
expectType<ExecaReturns<string>>(sync('unicorns', ['foo'], {encoding: 'utf8'}));
expectType<ExecaReturns<Buffer>>(sync('unicorns', ['foo'], {encoding: null}));

expectType<ExecaReturns<string>>(shellSync('unicorns'));
expectType<ExecaReturns<string>>(shellSync('unicorns', {encoding: 'utf8'}));
expectType<ExecaReturns<Buffer>>(shellSync('unicorns', {encoding: null}));
