// For some reason a default import of `process` causes
// `process.stdin`, `process.stderr`, and `process.stdout`
// to get treated as `any` by `@typescript-eslint/no-unsafe-assignment`.
import * as process from 'node:process';
import {Readable, Writable} from 'node:stream';
import {createWriteStream} from 'node:fs';
import {expectType, expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {
	$,
	execa,
	execaSync,
	execaCommand,
	execaCommandSync,
	execaNode,
	type Options,
	type ExecaReturnValue,
	type ExecaChildProcess,
	type ExecaError,
	type SyncOptions,
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
	expectType<ExecaChildProcess<Uint8Array>>(execaBufferPromise.pipeStdout!('file.txt'));
	expectType<ExecaChildProcess>(execaPromise.pipeStdout!(writeStream));
	expectType<ExecaChildProcess<Uint8Array>>(execaBufferPromise.pipeStdout!(writeStream));
	expectType<ExecaChildProcess>(execaPromise.pipeStdout!(execaPromise));
	expectType<ExecaChildProcess<Uint8Array>>(execaPromise.pipeStdout!(execaBufferPromise));
	expectType<ExecaChildProcess>(execaBufferPromise.pipeStdout!(execaPromise));
	expectType<ExecaChildProcess<Uint8Array>>(execaBufferPromise.pipeStdout!(execaBufferPromise));

	expectAssignable<Function | undefined>(execaPromise.pipeStderr);
	expectType<ExecaChildProcess>(execaPromise.pipeStderr!('file.txt'));
	expectType<ExecaChildProcess<Uint8Array>>(execaBufferPromise.pipeStderr!('file.txt'));
	expectType<ExecaChildProcess>(execaPromise.pipeStderr!(writeStream));
	expectType<ExecaChildProcess<Uint8Array>>(execaBufferPromise.pipeStderr!(writeStream));
	expectType<ExecaChildProcess>(execaPromise.pipeStderr!(execaPromise));
	expectType<ExecaChildProcess<Uint8Array>>(execaPromise.pipeStderr!(execaBufferPromise));
	expectType<ExecaChildProcess>(execaBufferPromise.pipeStderr!(execaPromise));
	expectType<ExecaChildProcess<Uint8Array>>(execaBufferPromise.pipeStderr!(execaBufferPromise));

	expectAssignable<Function | undefined>(execaPromise.pipeAll);
	expectType<ExecaChildProcess>(execaPromise.pipeAll!('file.txt'));
	expectType<ExecaChildProcess<Uint8Array>>(execaBufferPromise.pipeAll!('file.txt'));
	expectType<ExecaChildProcess>(execaPromise.pipeAll!(writeStream));
	expectType<ExecaChildProcess<Uint8Array>>(execaBufferPromise.pipeAll!(writeStream));
	expectType<ExecaChildProcess>(execaPromise.pipeAll!(execaPromise));
	expectType<ExecaChildProcess<Uint8Array>>(execaPromise.pipeAll!(execaBufferPromise));
	expectType<ExecaChildProcess>(execaBufferPromise.pipeAll!(execaPromise));
	expectType<ExecaChildProcess<Uint8Array>>(execaBufferPromise.pipeAll!(execaBufferPromise));

	const unicornsResult = await execaPromise;
	expectType<string>(unicornsResult.command);
	expectType<string>(unicornsResult.escapedCommand);
	expectType<number | undefined>(unicornsResult.exitCode);
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
	const execaError = error as ExecaError<false>;

	expectType<string>(execaError.message);
	expectType<number | undefined>(execaError.exitCode);
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
	expectType<ExecaSyncReturnValue>(unicornsResult);
	expectType<string>(unicornsResult.command);
	expectType<string>(unicornsResult.escapedCommand);
	expectType<number | undefined>(unicornsResult.exitCode);
	expectType<string>(unicornsResult.stdout);
	expectType<string>(unicornsResult.stderr);
	expectError(unicornsResult.all);
	expectError(unicornsResult.pipeStdout);
	expectError(unicornsResult.pipeStderr);
	expectError(unicornsResult.pipeAll);
	expectType<boolean>(unicornsResult.failed);
	expectType<boolean>(unicornsResult.timedOut);
	expectType<boolean>(unicornsResult.isCanceled);
	expectType<boolean>(unicornsResult.isTerminated);
	expectType<string | undefined>(unicornsResult.signal);
	expectType<string | undefined>(unicornsResult.signalDescription);
	expectType<string>(unicornsResult.cwd);
} catch (error: unknown) {
	const execaError = error as ExecaError<true>;

	expectType<ExecaSyncError>(execaError);
	expectType<string>(execaError.message);
	expectType<number | undefined>(execaError.exitCode);
	expectType<string>(execaError.stdout);
	expectType<string>(execaError.stderr);
	expectError(execaError.all);
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

const stringGenerator = function * () {
	yield '';
};

const binaryGenerator = function * () {
	yield new Uint8Array(0);
};

const numberGenerator = function * () {
	yield 0;
};

const asyncStringGenerator = async function * () {
	yield '';
};

const fileUrl = new URL('file:///test');

expectAssignable<Options>({cleanup: false});
expectNotAssignable<SyncOptions>({cleanup: false});
expectAssignable<SyncOptions>({preferLocal: false});

/* eslint-disable @typescript-eslint/no-floating-promises */
execa('unicorns', {cleanup: false});
expectError(execaSync('unicorns', {cleanup: false}));
execa('unicorns', {preferLocal: false});
execaSync('unicorns', {preferLocal: false});
execa('unicorns', {localDir: '.'});
execaSync('unicorns', {localDir: '.'});
execa('unicorns', {localDir: fileUrl});
execaSync('unicorns', {localDir: fileUrl});
expectError(execa('unicorns', {encoding: 'unknownEncoding'}));
expectError(execaSync('unicorns', {encoding: 'unknownEncoding'}));
execa('unicorns', {execPath: '/path'});
execaSync('unicorns', {execPath: '/path'});
execa('unicorns', {execPath: fileUrl});
execaSync('unicorns', {execPath: fileUrl});
execa('unicorns', {buffer: false});
expectError(execaSync('unicorns', {buffer: false}));
execa('unicorns', {input: ''});
execaSync('unicorns', {input: ''});
execa('unicorns', {input: new Uint8Array()});
execaSync('unicorns', {input: new Uint8Array()});
execa('unicorns', {input: process.stdin});
expectError(execaSync('unicorns', {input: process.stdin}));
execa('unicorns', {inputFile: ''});
execaSync('unicorns', {inputFile: ''});
execa('unicorns', {inputFile: fileUrl});
execaSync('unicorns', {inputFile: fileUrl});
execa('unicorns', {stdin: 'pipe'});
execaSync('unicorns', {stdin: 'pipe'});
execa('unicorns', {stdin: ['pipe']});
execaSync('unicorns', {stdin: ['pipe']});
execa('unicorns', {stdin: 'overlapped'});
execaSync('unicorns', {stdin: 'overlapped'});
execa('unicorns', {stdin: ['overlapped']});
execaSync('unicorns', {stdin: ['overlapped']});
execa('unicorns', {stdin: 'ipc'});
execaSync('unicorns', {stdin: 'ipc'});
execa('unicorns', {stdin: ['ipc']});
execaSync('unicorns', {stdin: ['ipc']});
execa('unicorns', {stdin: 'ignore'});
execaSync('unicorns', {stdin: 'ignore'});
execa('unicorns', {stdin: ['ignore']});
execaSync('unicorns', {stdin: ['ignore']});
execa('unicorns', {stdin: 'inherit'});
execaSync('unicorns', {stdin: 'inherit'});
execa('unicorns', {stdin: ['inherit']});
execaSync('unicorns', {stdin: ['inherit']});
execa('unicorns', {stdin: process.stdin});
expectError(execaSync('unicorns', {stdin: process.stdin}));
execa('unicorns', {stdin: [process.stdin]});
expectError(execaSync('unicorns', {stdin: [process.stdin]}));
execa('unicorns', {stdin: new Readable()});
expectError(execaSync('unicorns', {stdin: new Readable()}));
execa('unicorns', {stdin: [new Readable()]});
expectError(execaSync('unicorns', {stdin: [new Readable()]}));
expectError(execa('unicorns', {stdin: new Writable()}));
expectError(execaSync('unicorns', {stdin: new Writable()}));
expectError(execa('unicorns', {stdin: [new Writable()]}));
expectError(execaSync('unicorns', {stdin: [new Writable()]}));
execa('unicorns', {stdin: new ReadableStream()});
expectError(execaSync('unicorns', {stdin: new ReadableStream()}));
execa('unicorns', {stdin: [new ReadableStream()]});
expectError(execaSync('unicorns', {stdin: [new ReadableStream()]}));
expectError(execa('unicorns', {stdin: new WritableStream()}));
expectError(execaSync('unicorns', {stdin: new WritableStream()}));
expectError(execa('unicorns', {stdin: [new WritableStream()]}));
expectError(execaSync('unicorns', {stdin: [new WritableStream()]}));
execa('unicorns', {stdin: new Uint8Array()});
execaSync('unicorns', {stdin: new Uint8Array()});
execa('unicorns', {stdin: stringGenerator()});
expectError(execaSync('unicorns', {stdin: stringGenerator()}));
execa('unicorns', {stdin: [stringGenerator()]});
expectError(execaSync('unicorns', {stdin: [stringGenerator()]}));
execa('unicorns', {stdin: binaryGenerator()});
expectError(execaSync('unicorns', {stdin: binaryGenerator()}));
execa('unicorns', {stdin: [binaryGenerator()]});
expectError(execaSync('unicorns', {stdin: [binaryGenerator()]}));
execa('unicorns', {stdin: asyncStringGenerator()});
expectError(execaSync('unicorns', {stdin: asyncStringGenerator()}));
execa('unicorns', {stdin: [asyncStringGenerator()]});
expectError(execaSync('unicorns', {stdin: [asyncStringGenerator()]}));
expectError(execa('unicorns', {stdin: numberGenerator()}));
expectError(execaSync('unicorns', {stdin: numberGenerator()}));
expectError(execa('unicorns', {stdin: [numberGenerator()]}));
expectError(execaSync('unicorns', {stdin: [numberGenerator()]}));
execa('unicorns', {stdin: fileUrl});
execaSync('unicorns', {stdin: fileUrl});
execa('unicorns', {stdin: [fileUrl]});
execaSync('unicorns', {stdin: [fileUrl]});
execa('unicorns', {stdin: {file: './test'}});
execaSync('unicorns', {stdin: {file: './test'}});
execa('unicorns', {stdin: [{file: './test'}]});
execaSync('unicorns', {stdin: [{file: './test'}]});
execa('unicorns', {stdin: 1});
execaSync('unicorns', {stdin: 1});
execa('unicorns', {stdin: [1]});
execaSync('unicorns', {stdin: [1]});
execa('unicorns', {stdin: undefined});
execaSync('unicorns', {stdin: undefined});
execa('unicorns', {stdin: [undefined]});
execaSync('unicorns', {stdin: [undefined]});
execa('unicorns', {stdin: ['pipe', 'inherit']});
execaSync('unicorns', {stdin: ['pipe', 'inherit']});
execa('unicorns', {stdout: 'pipe'});
execaSync('unicorns', {stdout: 'pipe'});
execa('unicorns', {stdout: ['pipe']});
execaSync('unicorns', {stdout: ['pipe']});
execa('unicorns', {stdout: 'overlapped'});
execaSync('unicorns', {stdout: 'overlapped'});
execa('unicorns', {stdout: ['overlapped']});
execaSync('unicorns', {stdout: ['overlapped']});
execa('unicorns', {stdout: 'ipc'});
execaSync('unicorns', {stdout: 'ipc'});
execa('unicorns', {stdout: ['ipc']});
execaSync('unicorns', {stdout: ['ipc']});
execa('unicorns', {stdout: 'ignore'});
execaSync('unicorns', {stdout: 'ignore'});
execa('unicorns', {stdout: ['ignore']});
execaSync('unicorns', {stdout: ['ignore']});
execa('unicorns', {stdout: 'inherit'});
execaSync('unicorns', {stdout: 'inherit'});
execa('unicorns', {stdout: ['inherit']});
execaSync('unicorns', {stdout: ['inherit']});
execa('unicorns', {stdout: process.stdout});
expectError(execaSync('unicorns', {stdout: process.stdout}));
execa('unicorns', {stdout: [process.stdout]});
expectError(execaSync('unicorns', {stdout: [process.stdout]}));
execa('unicorns', {stdout: new Writable()});
expectError(execaSync('unicorns', {stdout: new Writable()}));
execa('unicorns', {stdout: [new Writable()]});
expectError(execaSync('unicorns', {stdout: [new Writable()]}));
expectError(execa('unicorns', {stdout: new Readable()}));
expectError(execaSync('unicorns', {stdout: new Readable()}));
expectError(execa('unicorn', {stdout: [new Readable()]}));
expectError(execaSync('unicorn', {stdout: [new Readable()]}));
execa('unicorns', {stdout: new WritableStream()});
expectError(execaSync('unicorns', {stdout: new WritableStream()}));
execa('unicorns', {stdout: [new WritableStream()]});
expectError(execaSync('unicorns', {stdout: [new WritableStream()]}));
expectError(execa('unicorns', {stdout: new ReadableStream()}));
expectError(execaSync('unicorns', {stdout: new ReadableStream()}));
expectError(execa('unicorn', {stdout: [new ReadableStream()]}));
expectError(execaSync('unicorn', {stdout: [new ReadableStream()]}));
execa('unicorns', {stdout: fileUrl});
execaSync('unicorns', {stdout: fileUrl});
execa('unicorns', {stdout: [fileUrl]});
execaSync('unicorns', {stdout: [fileUrl]});
execa('unicorns', {stdout: {file: './test'}});
execaSync('unicorns', {stdout: {file: './test'}});
execa('unicorns', {stdout: [{file: './test'}]});
execaSync('unicorns', {stdout: [{file: './test'}]});
execa('unicorns', {stdout: 1});
execaSync('unicorns', {stdout: 1});
execa('unicorns', {stdout: [1]});
execaSync('unicorns', {stdout: [1]});
execa('unicorns', {stdout: undefined});
execaSync('unicorns', {stdout: undefined});
execa('unicorns', {stdout: [undefined]});
execaSync('unicorns', {stdout: [undefined]});
execa('unicorns', {stdout: ['pipe', 'inherit']});
execaSync('unicorns', {stdout: ['pipe', 'inherit']});
execa('unicorns', {stderr: 'pipe'});
execaSync('unicorns', {stderr: 'pipe'});
execa('unicorns', {stderr: ['pipe']});
execaSync('unicorns', {stderr: ['pipe']});
execa('unicorns', {stderr: 'overlapped'});
execaSync('unicorns', {stderr: 'overlapped'});
execa('unicorns', {stderr: ['overlapped']});
execaSync('unicorns', {stderr: ['overlapped']});
execa('unicorns', {stderr: 'ipc'});
execaSync('unicorns', {stderr: 'ipc'});
execa('unicorns', {stderr: ['ipc']});
execaSync('unicorns', {stderr: ['ipc']});
execa('unicorns', {stderr: 'ignore'});
execaSync('unicorns', {stderr: 'ignore'});
execa('unicorns', {stderr: ['ignore']});
execaSync('unicorns', {stderr: ['ignore']});
execa('unicorns', {stderr: 'inherit'});
execaSync('unicorns', {stderr: 'inherit'});
execa('unicorns', {stderr: ['inherit']});
execaSync('unicorns', {stderr: ['inherit']});
execa('unicorns', {stderr: process.stderr});
expectError(execaSync('unicorns', {stderr: process.stderr}));
execa('unicorns', {stderr: [process.stderr]});
expectError(execaSync('unicorns', {stderr: [process.stderr]}));
execa('unicorns', {stderr: new Writable()});
expectError(execaSync('unicorns', {stderr: new Writable()}));
execa('unicorns', {stderr: [new Writable()]});
expectError(execaSync('unicorns', {stderr: [new Writable()]}));
expectError(execa('unicorns', {stderr: new Readable()}));
expectError(execaSync('unicorns', {stderr: new Readable()}));
expectError(execa('unicorns', {stderr: [new Readable()]}));
expectError(execaSync('unicorns', {stderr: [new Readable()]}));
execa('unicorns', {stderr: new WritableStream()});
expectError(execaSync('unicorns', {stderr: new WritableStream()}));
execa('unicorns', {stderr: [new WritableStream()]});
expectError(execaSync('unicorns', {stderr: [new WritableStream()]}));
expectError(execa('unicorns', {stderr: new ReadableStream()}));
expectError(execaSync('unicorns', {stderr: new ReadableStream()}));
expectError(execa('unicorns', {stderr: [new ReadableStream()]}));
expectError(execaSync('unicorns', {stderr: [new ReadableStream()]}));
execa('unicorns', {stderr: fileUrl});
execaSync('unicorns', {stderr: fileUrl});
execa('unicorns', {stderr: [fileUrl]});
execaSync('unicorns', {stderr: [fileUrl]});
execa('unicorns', {stderr: {file: './test'}});
execaSync('unicorns', {stderr: {file: './test'}});
execa('unicorns', {stderr: [{file: './test'}]});
execaSync('unicorns', {stderr: [{file: './test'}]});
execa('unicorns', {stderr: 1});
execaSync('unicorns', {stderr: 1});
execa('unicorns', {stderr: [1]});
execaSync('unicorns', {stderr: [1]});
execa('unicorns', {stderr: undefined});
execaSync('unicorns', {stderr: undefined});
execa('unicorns', {stderr: [undefined]});
execaSync('unicorns', {stderr: [undefined]});
execa('unicorns', {stderr: ['pipe', 'inherit']});
execaSync('unicorns', {stderr: ['pipe', 'inherit']});
execa('unicorns', {all: true});
expectError(execaSync('unicorns', {all: true}));
execa('unicorns', {reject: false});
execaSync('unicorns', {reject: false});
execa('unicorns', {stripFinalNewline: false});
execaSync('unicorns', {stripFinalNewline: false});
execa('unicorns', {extendEnv: false});
execaSync('unicorns', {extendEnv: false});
execa('unicorns', {cwd: '.'});
execaSync('unicorns', {cwd: '.'});
execa('unicorns', {cwd: fileUrl});
execaSync('unicorns', {cwd: fileUrl});
// eslint-disable-next-line @typescript-eslint/naming-convention
execa('unicorns', {env: {PATH: ''}});
// eslint-disable-next-line @typescript-eslint/naming-convention
execaSync('unicorns', {env: {PATH: ''}});
execa('unicorns', {argv0: ''});
execaSync('unicorns', {argv0: ''});
execa('unicorns', {stdio: 'pipe'});
execaSync('unicorns', {stdio: 'pipe'});
execa('unicorns', {stdio: 'overlapped'});
execaSync('unicorns', {stdio: 'overlapped'});
execa('unicorns', {stdio: 'ignore'});
execaSync('unicorns', {stdio: 'ignore'});
execa('unicorns', {stdio: 'inherit'});
execaSync('unicorns', {stdio: 'inherit'});
expectError(execa('unicorns', {stdio: 'ipc'}));
expectError(execaSync('unicorns', {stdio: 'ipc'}));
expectError(execa('unicorns', {stdio: 1}));
expectError(execaSync('unicorns', {stdio: 1}));
expectError(execa('unicorns', {stdio: fileUrl}));
expectError(execaSync('unicorns', {stdio: fileUrl}));
expectError(execa('unicorns', {stdio: {file: './test'}}));
expectError(execaSync('unicorns', {stdio: {file: './test'}}));
expectError(execa('unicorns', {stdio: new Writable()}));
expectError(execaSync('unicorns', {stdio: new Writable()}));
expectError(execa('unicorns', {stdio: new Readable()}));
expectError(execaSync('unicorns', {stdio: new Readable()}));
expectError(execa('unicorns', {stdio: new WritableStream()}));
expectError(execaSync('unicorns', {stdio: new WritableStream()}));
expectError(execa('unicorns', {stdio: new ReadableStream()}));
expectError(execaSync('unicorns', {stdio: new ReadableStream()}));
expectError(execa('unicorns', {stdio: stringGenerator()}));
expectError(execaSync('unicorns', {stdio: stringGenerator()}));
expectError(execa('unicorns', {stdio: asyncStringGenerator()}));
expectError(execaSync('unicorns', {stdio: asyncStringGenerator()}));
expectError(execa('unicorns', {stdio: ['pipe', 'pipe']}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe']}));
execa('unicorns', {stdio: [new Readable(), 'pipe', 'pipe']});
expectError(execaSync('unicorns', {stdio: [new Readable(), 'pipe', 'pipe']}));
execa('unicorns', {stdio: [[new Readable()], ['pipe'], ['pipe']]});
expectError(execaSync('unicorns', {stdio: [[new Readable()], ['pipe'], ['pipe']]}));
execa('unicorns', {stdio: ['pipe', new Writable(), 'pipe']});
expectError(execaSync('unicorns', {stdio: ['pipe', new Writable(), 'pipe']}));
execa('unicorns', {stdio: [['pipe'], [new Writable()], ['pipe']]});
expectError(execaSync('unicorns', {stdio: [['pipe'], [new Writable()], ['pipe']]}));
execa('unicorns', {stdio: ['pipe', 'pipe', new Writable()]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', new Writable()]}));
execa('unicorns', {stdio: [['pipe'], ['pipe'], [new Writable()]]});
expectError(execaSync('unicorns', {stdio: [['pipe'], ['pipe'], [new Writable()]]}));
expectError(execa('unicorns', {stdio: [new Writable(), 'pipe', 'pipe']}));
expectError(execaSync('unicorns', {stdio: [new Writable(), 'pipe', 'pipe']}));
expectError(execa('unicorns', {stdio: [[new Writable()], ['pipe'], ['pipe']]}));
expectError(execaSync('unicorns', {stdio: [[new Writable()], ['pipe'], ['pipe']]}));
expectError(execa('unicorns', {stdio: ['pipe', new Readable(), 'pipe']}));
expectError(execaSync('unicorns', {stdio: ['pipe', new Readable(), 'pipe']}));
expectError(execa('unicorns', {stdio: [['pipe'], [new Readable()], ['pipe']]}));
expectError(execaSync('unicorns', {stdio: [['pipe'], [new Readable()], ['pipe']]}));
expectError(execa('unicorns', {stdio: ['pipe', 'pipe', new Readable()]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', new Readable()]}));
expectError(execa('unicorns', {stdio: [['pipe'], ['pipe'], [new Readable()]]}));
expectError(execaSync('unicorns', {stdio: [['pipe'], ['pipe'], [new Readable()]]}));
execa('unicorns', {
	stdio: [
		'pipe',
		'overlapped',
		'ipc',
		'ignore',
		'inherit',
		process.stdin,
		1,
		undefined,
		fileUrl,
		{file: './test'},
		new Writable(),
		new Readable(),
		new WritableStream(),
		new ReadableStream(),
		new Uint8Array(),
		stringGenerator(),
		asyncStringGenerator(),
	],
});
execaSync('unicorns', {
	stdio: [
		'pipe',
		'overlapped',
		'ipc',
		'ignore',
		'inherit',
		process.stdin,
		1,
		undefined,
		fileUrl,
		{file: './test'},
		new Uint8Array(),
	],
});
expectError(execaSync('unicorns', {stdio: [new Writable()]}));
expectError(execaSync('unicorns', {stdio: [new Readable()]}));
expectError(execaSync('unicorns', {stdio: [new WritableStream()]}));
expectError(execaSync('unicorns', {stdio: [new ReadableStream()]}));
expectError(execaSync('unicorns', {stdio: [stringGenerator()]}));
expectError(execaSync('unicorns', {stdio: [asyncStringGenerator()]}));
execa('unicorns', {
	stdio: [
		['pipe'],
		['pipe', 'inherit'],
		['overlapped'],
		['ipc'],
		['ignore'],
		['inherit'],
		[process.stdin],
		[1],
		[undefined],
		[fileUrl],
		[{file: './test'}],
		[new Writable()],
		[new Readable()],
		[new WritableStream()],
		[new ReadableStream()],
		[new Uint8Array()],
		[stringGenerator()],
		[asyncStringGenerator()],
	],
});
execaSync('unicorns', {
	stdio: [
		['pipe'],
		['pipe', 'inherit'],
		['overlapped'],
		['ipc'],
		['ignore'],
		['inherit'],
		[process.stdin],
		[1],
		[undefined],
		[fileUrl],
		[{file: './test'}],
		[new Uint8Array()],
	],
});
expectError(execaSync('unicorns', {stdio: [[new Writable()]]}));
expectError(execaSync('unicorns', {stdio: [[new Readable()]]}));
expectError(execaSync('unicorns', {stdio: [[new WritableStream()]]}));
expectError(execaSync('unicorns', {stdio: [[new ReadableStream()]]}));
expectError(execaSync('unicorns', {stdio: [[stringGenerator()]]}));
expectError(execaSync('unicorns', {stdio: [[asyncStringGenerator()]]}));
execa('unicorns', {serialization: 'advanced'});
expectError(execaSync('unicorns', {serialization: 'advanced'}));
execa('unicorns', {detached: true});
expectError(execaSync('unicorns', {detached: true}));
execa('unicorns', {uid: 0});
execaSync('unicorns', {uid: 0});
execa('unicorns', {gid: 0});
execaSync('unicorns', {gid: 0});
execa('unicorns', {shell: true});
execaSync('unicorns', {shell: true});
execa('unicorns', {shell: '/bin/sh'});
execaSync('unicorns', {shell: '/bin/sh'});
execa('unicorns', {shell: fileUrl});
execaSync('unicorns', {shell: fileUrl});
execa('unicorns', {timeout: 1000});
execaSync('unicorns', {timeout: 1000});
execa('unicorns', {maxBuffer: 1000});
execaSync('unicorns', {maxBuffer: 1000});
execa('unicorns', {killSignal: 'SIGTERM'});
execaSync('unicorns', {killSignal: 'SIGTERM'});
execa('unicorns', {killSignal: 9});
execaSync('unicorns', {killSignal: 9});
execa('unicorns', {signal: new AbortController().signal});
expectError(execaSync('unicorns', {signal: new AbortController().signal}));
execa('unicorns', {windowsVerbatimArguments: true});
execaSync('unicorns', {windowsVerbatimArguments: true});
execa('unicorns', {windowsHide: false});
execaSync('unicorns', {windowsHide: false});
execa('unicorns', {verbose: false});
execaSync('unicorns', {verbose: false});
/* eslint-enable @typescript-eslint/no-floating-promises */
execa('unicorns').kill();
execa('unicorns').kill('SIGKILL');
execa('unicorns').kill(undefined);
execa('unicorns').kill('SIGKILL', {});
execa('unicorns').kill('SIGKILL', {forceKillAfterTimeout: false});
execa('unicorns').kill('SIGKILL', {forceKillAfterTimeout: 42});
execa('unicorns').kill('SIGKILL', {forceKillAfterTimeout: undefined});

expectError(execa(['unicorns', 'arg']));
expectType<ExecaChildProcess>(execa('unicorns'));
expectType<ExecaChildProcess>(execa(fileUrl));
expectType<ExecaReturnValue<false>>(await execa('unicorns'));
expectType<ExecaReturnValue<false>>(
	await execa('unicorns', {encoding: 'utf8'}),
);
expectType<ExecaReturnValue<false, Uint8Array>>(await execa('unicorns', {encoding: 'buffer'}));
expectType<ExecaReturnValue<false>>(
	await execa('unicorns', ['foo'], {encoding: 'utf8'}),
);
expectType<ExecaReturnValue<false, Uint8Array>>(
	await execa('unicorns', ['foo'], {encoding: 'buffer'}),
);

expectError(execaSync(['unicorns', 'arg']));
expectType<ExecaReturnValue<true>>(execaSync('unicorns'));
expectType<ExecaReturnValue<true>>(execaSync(fileUrl));
expectType<ExecaReturnValue<true>>(
	execaSync('unicorns', {encoding: 'utf8'}),
);
expectType<ExecaReturnValue<true, Uint8Array>>(
	execaSync('unicorns', {encoding: 'buffer'}),
);
expectType<ExecaReturnValue<true>>(
	execaSync('unicorns', ['foo'], {encoding: 'utf8'}),
);
expectType<ExecaReturnValue<true, Uint8Array>>(
	execaSync('unicorns', ['foo'], {encoding: 'buffer'}),
);

expectType<ExecaChildProcess>(execaCommand('unicorns'));
expectType<ExecaReturnValue<false>>(await execaCommand('unicorns'));
expectType<ExecaReturnValue<false>>(await execaCommand('unicorns', {encoding: 'utf8'}));
expectType<ExecaReturnValue<false, Uint8Array>>(await execaCommand('unicorns', {encoding: 'buffer'}));
expectType<ExecaReturnValue<false>>(await execaCommand('unicorns foo', {encoding: 'utf8'}));
expectType<ExecaReturnValue<false, Uint8Array>>(await execaCommand('unicorns foo', {encoding: 'buffer'}));

expectType<ExecaReturnValue<true>>(execaCommandSync('unicorns'));
expectType<ExecaReturnValue<true>>(execaCommandSync('unicorns', {encoding: 'utf8'}));
expectType<ExecaReturnValue<true, Uint8Array>>(execaCommandSync('unicorns', {encoding: 'buffer'}));
expectType<ExecaReturnValue<true>>(execaCommandSync('unicorns foo', {encoding: 'utf8'}));
expectType<ExecaReturnValue<true, Uint8Array>>(execaCommandSync('unicorns foo', {encoding: 'buffer'}));

expectError(execaNode(['unicorns', 'arg']));
expectType<ExecaChildProcess>(execaNode('unicorns'));
expectType<ExecaReturnValue<false>>(await execaNode('unicorns'));
expectType<ExecaReturnValue<false>>(await execaNode(fileUrl));
expectType<ExecaReturnValue<false>>(
	await execaNode('unicorns', {encoding: 'utf8'}),
);
expectType<ExecaReturnValue<false, Uint8Array>>(await execaNode('unicorns', {encoding: 'buffer'}));
expectType<ExecaReturnValue<false>>(
	await execaNode('unicorns', ['foo'], {encoding: 'utf8'}),
);
expectType<ExecaReturnValue<false, Uint8Array>>(
	await execaNode('unicorns', ['foo'], {encoding: 'buffer'}),
);

expectType<ExecaChildProcess>(execaNode('unicorns', {nodePath: './node'}));
expectType<ExecaChildProcess>(execaNode('unicorns', {nodePath: fileUrl}));

expectType<ExecaChildProcess>(execaNode('unicorns', {nodeOptions: ['--async-stack-traces']}));
expectType<ExecaChildProcess>(execaNode('unicorns', ['foo'], {nodeOptions: ['--async-stack-traces']}));
expectType<ExecaChildProcess<Uint8Array>>(
	execaNode('unicorns', {nodeOptions: ['--async-stack-traces'], encoding: 'buffer'}),
);
expectType<ExecaChildProcess<Uint8Array>>(
	execaNode('unicorns', ['foo'], {nodeOptions: ['--async-stack-traces'], encoding: 'buffer'}),
);

expectType<ExecaChildProcess>($`unicorns`);
expectType<ExecaReturnValue<false>>(await $`unicorns`);
expectType<ExecaReturnValue<true>>($.sync`unicorns`);
expectType<ExecaReturnValue<true>>($.s`unicorns`);

expectType<ExecaChildProcess>($({encoding: 'utf8'})`unicorns`);
expectType<ExecaReturnValue<false>>(await $({encoding: 'utf8'})`unicorns`);
expectType<ExecaReturnValue<true>>($({encoding: 'utf8'}).sync`unicorns`);

expectType<ExecaChildProcess>($({encoding: 'utf8'})`unicorns foo`);
expectType<ExecaReturnValue<false>>(await $({encoding: 'utf8'})`unicorns foo`);
expectType<ExecaReturnValue<true>>($({encoding: 'utf8'}).sync`unicorns foo`);

expectType<ExecaChildProcess<Uint8Array>>($({encoding: 'buffer'})`unicorns`);
expectType<ExecaReturnValue<false, Uint8Array>>(await $({encoding: 'buffer'})`unicorns`);
expectType<ExecaReturnValue<true, Uint8Array>>($({encoding: 'buffer'}).sync`unicorns`);

expectType<ExecaChildProcess<Uint8Array>>($({encoding: 'buffer'})`unicorns foo`);
expectType<ExecaReturnValue<false, Uint8Array>>(await $({encoding: 'buffer'})`unicorns foo`);
expectType<ExecaReturnValue<true, Uint8Array>>($({encoding: 'buffer'}).sync`unicorns foo`);

expectType<ExecaChildProcess>($({encoding: 'buffer'})({encoding: 'utf8'})`unicorns`);
expectType<ExecaReturnValue<false>>(await $({encoding: 'buffer'})({encoding: 'utf8'})`unicorns`);
expectType<ExecaReturnValue<true>>($({encoding: 'buffer'})({encoding: 'utf8'}).sync`unicorns`);

expectType<ExecaChildProcess>($({encoding: 'buffer'})({encoding: 'utf8'})`unicorns foo`);
expectType<ExecaReturnValue<false>>(await $({encoding: 'buffer'})({encoding: 'utf8'})`unicorns foo`);
expectType<ExecaReturnValue<true>>($({encoding: 'buffer'})({encoding: 'utf8'}).sync`unicorns foo`);

expectType<ExecaChildProcess<Uint8Array>>($({encoding: 'buffer'})({})`unicorns`);
expectType<ExecaReturnValue<false, Uint8Array>>(await $({encoding: 'buffer'})({})`unicorns`);
expectType<ExecaReturnValue<true, Uint8Array>>($({encoding: 'buffer'})({}).sync`unicorns`);

expectType<ExecaChildProcess<Uint8Array>>($({encoding: 'buffer'})({})`unicorns foo`);
expectType<ExecaReturnValue<false, Uint8Array>>(await $({encoding: 'buffer'})({})`unicorns foo`);
expectType<ExecaReturnValue<true, Uint8Array>>($({encoding: 'buffer'})({}).sync`unicorns foo`);

expectType<ExecaReturnValue<false>>(await $`unicorns ${'foo'}`);
expectType<ExecaReturnValue<true>>($.sync`unicorns ${'foo'}`);
expectType<ExecaReturnValue<false>>(await $`unicorns ${1}`);
expectType<ExecaReturnValue<true>>($.sync`unicorns ${1}`);
expectType<ExecaReturnValue<false>>(await $`unicorns ${['foo', 'bar']}`);
expectType<ExecaReturnValue<true>>($.sync`unicorns ${['foo', 'bar']}`);
expectType<ExecaReturnValue<false>>(await $`unicorns ${[1, 2]}`);
expectType<ExecaReturnValue<true>>($.sync`unicorns ${[1, 2]}`);
expectType<ExecaReturnValue<false>>(await $`unicorns ${await $`echo foo`}`);
expectError<ExecaReturnValue<false>>(await $`unicorns ${$`echo foo`}`);
expectType<ExecaReturnValue<true>>($.sync`unicorns ${$.sync`echo foo`}`);
expectType<ExecaReturnValue<false>>(await $`unicorns ${[await $`echo foo`, 'bar']}`);
expectError<ExecaReturnValue<false>>(await $`unicorns ${[$`echo foo`, 'bar']}`);
expectType<ExecaReturnValue<true>>($.sync`unicorns ${[$.sync`echo foo`, 'bar']}`);
expectType<ExecaReturnValue<false>>(await $`unicorns ${true.toString()}`);
expectType<ExecaReturnValue<true>>($.sync`unicorns ${false.toString()}`);
expectError<ExecaReturnValue<false>>(await $`unicorns ${true}`);
expectError<ExecaReturnValue<true>>($.sync`unicorns ${false}`);
