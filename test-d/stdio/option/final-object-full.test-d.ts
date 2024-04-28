import {expectError, expectAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinOptionSync,
	type StdoutStderrOption,
	type StdoutStderrOptionSync,
} from '../../../index.js';

const objectFinalFull = {
	* transform(line: unknown) {
		yield JSON.parse(line as string) as object;
	},
	* final() {
		yield {};
	},
	objectMode: true,
} as const;

await execa('unicorns', {stdin: objectFinalFull});
execaSync('unicorns', {stdin: objectFinalFull});
await execa('unicorns', {stdin: [objectFinalFull]});
execaSync('unicorns', {stdin: [objectFinalFull]});

await execa('unicorns', {stdout: objectFinalFull});
execaSync('unicorns', {stdout: objectFinalFull});
await execa('unicorns', {stdout: [objectFinalFull]});
execaSync('unicorns', {stdout: [objectFinalFull]});

await execa('unicorns', {stderr: objectFinalFull});
execaSync('unicorns', {stderr: objectFinalFull});
await execa('unicorns', {stderr: [objectFinalFull]});
execaSync('unicorns', {stderr: [objectFinalFull]});

expectError(await execa('unicorns', {stdio: objectFinalFull}));
expectError(execaSync('unicorns', {stdio: objectFinalFull}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', objectFinalFull]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', objectFinalFull]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [objectFinalFull]]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [objectFinalFull]]});

expectAssignable<StdinOption>(objectFinalFull);
expectAssignable<StdinOptionSync>(objectFinalFull);
expectAssignable<StdinOption>([objectFinalFull]);
expectAssignable<StdinOptionSync>([objectFinalFull]);

expectAssignable<StdoutStderrOption>(objectFinalFull);
expectAssignable<StdoutStderrOptionSync>(objectFinalFull);
expectAssignable<StdoutStderrOption>([objectFinalFull]);
expectAssignable<StdoutStderrOptionSync>([objectFinalFull]);
