import {Buffer} from 'node:buffer';
// For some reason a default import of `process` causes
// `process.stdin`, `process.stderr`, and `process.stdout`
// to get treated as `any` by `@typescript-eslint/no-unsafe-assignment`.
import * as process from 'node:process';
import {type Readable} from 'node:stream';
import {createWriteStream} from 'node:fs';
import {expectType, expectError, expectAssignable} from 'tsd';
import {
	$,
	execa,
	execaSync,
	execaCommand,
	execaCommandSync,
	execaNode,
	type ExecaReturnValue,
	type ExecaChildProcess,
	type ExecaError,
	type ExecaSyncReturnValue,
	type ExecaSyncError,
} from './index.js';

try {
	const execaPromise = execa('unicorns');
	execaPromise.cancel();
	expectType<Readable | undefined>(execaPromise.all);

	const execaBufferPromise = execa('unicorns', {encoding: 'buffer'});
	const writeStream = createWriteStream('output.txt');

	expectAssignable<Function | undefined>(execaPromise.pipeStdout);
	expectType<ExecaChildProcess>(execaPromise.pipeStdout!('file.txt'));
	expectType<ExecaChildProcess<Buffer>>(execaBufferPromise.pipeStdout!('file.txt'));
	expectType<ExecaChildProcess>(execaPromise.pipeStdout!(writeStream));
	expectType<ExecaChildProcess<Buffer>>(execaBufferPromise.pipeStdout!(writeStream));
	expectType<ExecaChildProcess>(execaPromise.pipeStdout!(execaPromise));
	expectType<ExecaChildProcess<Buffer>>(execaPromise.pipeStdout!(execaBufferPromise));
	expectType<ExecaChildProcess>(execaBufferPromise.pipeStdout!(execaPromise));
	expectType<ExecaChildProcess<Buffer>>(execaBufferPromise.pipeStdout!(execaBufferPromise));

	expectAssignable<Function | undefined>(execaPromise.pipeStderr);
	expectType<ExecaChildProcess>(execaPromise.pipeStderr!('file.txt'));
	expectType<ExecaChildProcess<Buffer>>(execaBufferPromise.pipeStderr!('file.txt'));
	expectType<ExecaChildProcess>(execaPromise.pipeStderr!(writeStream));
	expectType<ExecaChildProcess<Buffer>>(execaBufferPromise.pipeStderr!(writeStream));
	expectType<ExecaChildProcess>(execaPromise.pipeStderr!(execaPromise));
	expectType<ExecaChildProcess<Buffer>>(execaPromise.pipeStderr!(execaBufferPromise));
	expectType<ExecaChildProcess>(execaBufferPromise.pipeStderr!(execaPromise));
	expectType<ExecaChildProcess<Buffer>>(execaBufferPromise.pipeStderr!(execaBufferPromise));

	expectAssignable<Function | undefined>(execaPromise.pipeAll);
	expectType<ExecaChildProcess>(execaPromise.pipeAll!('file.txt'));
	expectType<ExecaChildProcess<Buffer>>(execaBufferPromise.pipeAll!('file.txt'));
	expectType<ExecaChildProcess>(execaPromise.pipeAll!(writeStream));
	expectType<ExecaChildProcess<Buffer>>(execaBufferPromise.pipeAll!(writeStream));
	expectType<ExecaChildProcess>(execaPromise.pipeAll!(execaPromise));
	expectType<ExecaChildProcess<Buffer>>(execaPromise.pipeAll!(execaBufferPromise));
	expectType<ExecaChildProcess>(execaBufferPromise.pipeAll!(execaPromise));
	expectType<ExecaChildProcess<Buffer>>(execaBufferPromise.pipeAll!(execaBufferPromise));

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
	expectType<boolean>(unicornsResult.isTerminated);
	expectType<string | undefined>(unicornsResult.signal);
	expectType<string | undefined>(unicornsResult.signalDescription);
	expectType<string>(unicornsResult.cwd);
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
	expectType<boolean>(execaError.isTerminated);
	expectType<string | undefined>(execaError.signal);
	expectType<string | undefined>(execaError.signalDescription);
	expectType<string>(execaError.cwd);
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
	expectError(unicornsResult.pipeStdout);
	expectError(unicornsResult.pipeStderr);
	expectError(unicornsResult.pipeAll);
	expectType<boolean>(unicornsResult.failed);
	expectType<boolean>(unicornsResult.timedOut);
	expectError(unicornsResult.isCanceled);
	expectType<boolean>(unicornsResult.isTerminated);
	expectType<string | undefined>(unicornsResult.signal);
	expectType<string | undefined>(unicornsResult.signalDescription);
	expectType<string>(unicornsResult.cwd);
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
	expectType<boolean>(execaError.isTerminated);
	expectType<string | undefined>(execaError.signal);
	expectType<string | undefined>(execaError.signalDescription);
	expectType<string>(execaError.cwd);
	expectType<string>(execaError.shortMessage);
	expectType<string | undefined>(execaError.originalMessage);
}

const stringGenerator = function * () {
	yield '';
};

const binaryGenerator = function * () {
	yield new Uint8Array(0);
};

const numberGenerator = function * () {
	yield 0;
};

/* eslint-disable @typescript-eslint/no-floating-promises */
execa('unicorns', {cleanup: false});
execa('unicorns', {preferLocal: false});
execa('unicorns', {localDir: '.'});
execa('unicorns', {localDir: new URL('file:///test')});
expectError(execa('unicorns', {encoding: 'unknownEncoding'}));
execa('unicorns', {execPath: '/path'});
execa('unicorns', {buffer: false});
execa('unicorns', {input: ''});
execa('unicorns', {input: Buffer.from('')});
execa('unicorns', {input: process.stdin});
execa('unicorns', {inputFile: ''});
execa('unicorns', {inputFile: new URL('file:///test')});
execa('unicorns', {stdin: 'pipe'});
execa('unicorns', {stdin: 'overlapped'});
execa('unicorns', {stdin: 'ipc'});
execa('unicorns', {stdin: 'ignore'});
execa('unicorns', {stdin: 'inherit'});
execa('unicorns', {stdin: process.stdin});
execa('unicorns', {stdin: new ReadableStream()});
execa('unicorns', {stdin: ['']});
execa('unicorns', {stdin: [new Uint8Array(0)]});
execa('unicorns', {stdin: stringGenerator()});
execa('unicorns', {stdin: binaryGenerator()});
expectError(execa('unicorns', {stdin: [0]}));
expectError(execa('unicorns', {stdin: numberGenerator()}));
execa('unicorns', {stdin: new URL('file:///test')});
execa('unicorns', {stdin: './test'});
execa('unicorns', {stdin: 1});
execa('unicorns', {stdin: undefined});
execa('unicorns', {stdout: 'pipe'});
execa('unicorns', {stdout: 'overlapped'});
execa('unicorns', {stdout: 'ipc'});
execa('unicorns', {stdout: 'ignore'});
execa('unicorns', {stdout: 'inherit'});
execa('unicorns', {stdout: process.stdout});
execa('unicorns', {stdout: new WritableStream()});
execa('unicorns', {stdout: new URL('file:///test')});
execa('unicorns', {stdout: './test'});
execa('unicorns', {stdout: 1});
execa('unicorns', {stdout: undefined});
execa('unicorns', {stderr: 'pipe'});
execa('unicorns', {stderr: 'overlapped'});
execa('unicorns', {stderr: 'ipc'});
execa('unicorns', {stderr: 'ignore'});
execa('unicorns', {stderr: 'inherit'});
execa('unicorns', {stderr: process.stderr});
execa('unicorns', {stderr: new WritableStream()});
execa('unicorns', {stderr: new URL('file:///test')});
execa('unicorns', {stderr: './test'});
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
execa('unicorns', {stdio: 'overlapped'});
execa('unicorns', {stdio: 'ignore'});
execa('unicorns', {stdio: 'inherit'});
execa('unicorns', {
	stdio: ['pipe', 'overlapped', 'ipc', 'ignore', 'inherit', process.stdin, 1, undefined],
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
execa('unicorns', {verbose: false});
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
expectType<ExecaReturnValue<Buffer>>(await execa('unicorns', {encoding: 'buffer'}));
expectType<ExecaReturnValue<Buffer>>(await execa('unicorns', {encoding: null}));
expectType<ExecaReturnValue>(
	await execa('unicorns', ['foo'], {encoding: 'utf8'}),
);
expectType<ExecaReturnValue<Buffer>>(
	await execa('unicorns', ['foo'], {encoding: 'buffer'}),
);
expectType<ExecaReturnValue<Buffer>>(
	await execa('unicorns', ['foo'], {encoding: null}),
);

expectType<ExecaSyncReturnValue>(execaSync('unicorns'));
expectType<ExecaSyncReturnValue>(
	execaSync('unicorns', {encoding: 'utf8'}),
);
expectType<ExecaSyncReturnValue<Buffer>>(
	execaSync('unicorns', {encoding: 'buffer'}),
);
expectType<ExecaSyncReturnValue<Buffer>>(
	execaSync('unicorns', {encoding: null}),
);
expectType<ExecaSyncReturnValue>(
	execaSync('unicorns', ['foo'], {encoding: 'utf8'}),
);
expectType<ExecaSyncReturnValue<Buffer>>(
	execaSync('unicorns', ['foo'], {encoding: 'buffer'}),
);
expectType<ExecaSyncReturnValue<Buffer>>(
	execaSync('unicorns', ['foo'], {encoding: null}),
);

expectType<ExecaChildProcess>(execaCommand('unicorns'));
expectType<ExecaReturnValue>(await execaCommand('unicorns'));
expectType<ExecaReturnValue>(await execaCommand('unicorns', {encoding: 'utf8'}));
expectType<ExecaReturnValue<Buffer>>(await execaCommand('unicorns', {encoding: 'buffer'}));
expectType<ExecaReturnValue<Buffer>>(await execaCommand('unicorns', {encoding: null}));
expectType<ExecaReturnValue>(await execaCommand('unicorns foo', {encoding: 'utf8'}));
expectType<ExecaReturnValue<Buffer>>(await execaCommand('unicorns foo', {encoding: 'buffer'}));
expectType<ExecaReturnValue<Buffer>>(await execaCommand('unicorns foo', {encoding: null}));

expectType<ExecaSyncReturnValue>(execaCommandSync('unicorns'));
expectType<ExecaSyncReturnValue>(execaCommandSync('unicorns', {encoding: 'utf8'}));
expectType<ExecaSyncReturnValue<Buffer>>(execaCommandSync('unicorns', {encoding: 'buffer'}));
expectType<ExecaSyncReturnValue<Buffer>>(execaCommandSync('unicorns', {encoding: null}));
expectType<ExecaSyncReturnValue>(execaCommandSync('unicorns foo', {encoding: 'utf8'}));
expectType<ExecaSyncReturnValue<Buffer>>(execaCommandSync('unicorns foo', {encoding: 'buffer'}));
expectType<ExecaSyncReturnValue<Buffer>>(execaCommandSync('unicorns foo', {encoding: null}));

expectType<ExecaChildProcess>(execaNode('unicorns'));
expectType<ExecaReturnValue>(await execaNode('unicorns'));
expectType<ExecaReturnValue>(
	await execaNode('unicorns', {encoding: 'utf8'}),
);
expectType<ExecaReturnValue<Buffer>>(await execaNode('unicorns', {encoding: 'buffer'}));
expectType<ExecaReturnValue<Buffer>>(await execaNode('unicorns', {encoding: null}));
expectType<ExecaReturnValue>(
	await execaNode('unicorns', ['foo'], {encoding: 'utf8'}),
);
expectType<ExecaReturnValue<Buffer>>(
	await execaNode('unicorns', ['foo'], {encoding: 'buffer'}),
);
expectType<ExecaReturnValue<Buffer>>(
	await execaNode('unicorns', ['foo'], {encoding: null}),
);

expectType<ExecaChildProcess>(execaNode('unicorns', {nodeOptions: ['--async-stack-traces']}));
expectType<ExecaChildProcess>(execaNode('unicorns', ['foo'], {nodeOptions: ['--async-stack-traces']}));
expectType<ExecaChildProcess<Buffer>>(
	execaNode('unicorns', {nodeOptions: ['--async-stack-traces'], encoding: 'buffer'}),
);
expectType<ExecaChildProcess<Buffer>>(
	execaNode('unicorns', {nodeOptions: ['--async-stack-traces'], encoding: null}),
);
expectType<ExecaChildProcess<Buffer>>(
	execaNode('unicorns', ['foo'], {nodeOptions: ['--async-stack-traces'], encoding: 'buffer'}),
);
expectType<ExecaChildProcess<Buffer>>(
	execaNode('unicorns', ['foo'], {nodeOptions: ['--async-stack-traces'], encoding: null}),
);

expectType<ExecaChildProcess>($`unicorns`);
expectType<ExecaReturnValue>(await $`unicorns`);
expectType<ExecaSyncReturnValue>($.sync`unicorns`);
expectType<ExecaSyncReturnValue>($.s`unicorns`);

expectType<ExecaChildProcess>($({encoding: 'utf8'})`unicorns`);
expectType<ExecaReturnValue>(await $({encoding: 'utf8'})`unicorns`);
expectType<ExecaSyncReturnValue>($({encoding: 'utf8'}).sync`unicorns`);

expectType<ExecaChildProcess>($({encoding: 'utf8'})`unicorns foo`);
expectType<ExecaReturnValue>(await $({encoding: 'utf8'})`unicorns foo`);
expectType<ExecaSyncReturnValue>($({encoding: 'utf8'}).sync`unicorns foo`);

expectType<ExecaChildProcess<Buffer>>($({encoding: null})`unicorns`);
expectType<ExecaChildProcess<Buffer>>($({encoding: 'buffer'})`unicorns`);
expectType<ExecaReturnValue<Buffer>>(await $({encoding: 'buffer'})`unicorns`);
expectType<ExecaSyncReturnValue<Buffer>>($({encoding: 'buffer'}).sync`unicorns`);

expectType<ExecaChildProcess<Buffer>>($({encoding: 'buffer'})`unicorns foo`);
expectType<ExecaReturnValue<Buffer>>(await $({encoding: 'buffer'})`unicorns foo`);
expectType<ExecaSyncReturnValue<Buffer>>($({encoding: 'buffer'}).sync`unicorns foo`);

expectType<ExecaChildProcess>($({encoding: 'buffer'})({encoding: 'utf8'})`unicorns`);
expectType<ExecaReturnValue>(await $({encoding: 'buffer'})({encoding: 'utf8'})`unicorns`);
expectType<ExecaSyncReturnValue>($({encoding: 'buffer'})({encoding: 'utf8'}).sync`unicorns`);

expectType<ExecaChildProcess>($({encoding: 'buffer'})({encoding: 'utf8'})`unicorns foo`);
expectType<ExecaReturnValue>(await $({encoding: 'buffer'})({encoding: 'utf8'})`unicorns foo`);
expectType<ExecaSyncReturnValue>($({encoding: 'buffer'})({encoding: 'utf8'}).sync`unicorns foo`);

expectType<ExecaChildProcess<Buffer>>($({encoding: 'buffer'})({})`unicorns`);
expectType<ExecaReturnValue<Buffer>>(await $({encoding: 'buffer'})({})`unicorns`);
expectType<ExecaSyncReturnValue<Buffer>>($({encoding: 'buffer'})({}).sync`unicorns`);

expectType<ExecaChildProcess<Buffer>>($({encoding: 'buffer'})({})`unicorns foo`);
expectType<ExecaReturnValue<Buffer>>(await $({encoding: 'buffer'})({})`unicorns foo`);
expectType<ExecaSyncReturnValue<Buffer>>($({encoding: 'buffer'})({}).sync`unicorns foo`);

expectType<ExecaReturnValue>(await $`unicorns ${'foo'}`);
expectType<ExecaSyncReturnValue>($.sync`unicorns ${'foo'}`);
expectType<ExecaReturnValue>(await $`unicorns ${1}`);
expectType<ExecaSyncReturnValue>($.sync`unicorns ${1}`);
expectType<ExecaReturnValue>(await $`unicorns ${['foo', 'bar']}`);
expectType<ExecaSyncReturnValue>($.sync`unicorns ${['foo', 'bar']}`);
expectType<ExecaReturnValue>(await $`unicorns ${[1, 2]}`);
expectType<ExecaSyncReturnValue>($.sync`unicorns ${[1, 2]}`);
expectType<ExecaReturnValue>(await $`unicorns ${await $`echo foo`}`);
expectError<ExecaReturnValue>(await $`unicorns ${$`echo foo`}`);
expectType<ExecaSyncReturnValue>($.sync`unicorns ${$.sync`echo foo`}`);
expectType<ExecaReturnValue>(await $`unicorns ${[await $`echo foo`, 'bar']}`);
expectError<ExecaReturnValue>(await $`unicorns ${[$`echo foo`, 'bar']}`);
expectType<ExecaSyncReturnValue>($.sync`unicorns ${[$.sync`echo foo`, 'bar']}`);
expectType<ExecaReturnValue>(await $`unicorns ${true.toString()}`);
expectType<ExecaSyncReturnValue>($.sync`unicorns ${false.toString()}`);
expectError<ExecaReturnValue>(await $`unicorns ${true}`);
expectError<ExecaSyncReturnValue>($.sync`unicorns ${false}`);
