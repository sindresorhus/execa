import {expectError, expectAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinOptionSync,
	type StdoutStderrOption,
	type StdoutStderrOptionSync,
	type StdioOption,
	type StdioOptionSync,
} from '../../../index.js';

const objectGeneratorFull = {
	* transform(line: unknown) {
		yield JSON.parse(line as string) as object;
	},
	objectMode: true,
} as const;

await execa('unicorns', {stdin: objectGeneratorFull});
execaSync('unicorns', {stdin: objectGeneratorFull});
await execa('unicorns', {stdin: [objectGeneratorFull]});
execaSync('unicorns', {stdin: [objectGeneratorFull]});

await execa('unicorns', {stdout: objectGeneratorFull});
execaSync('unicorns', {stdout: objectGeneratorFull});
await execa('unicorns', {stdout: [objectGeneratorFull]});
execaSync('unicorns', {stdout: [objectGeneratorFull]});

await execa('unicorns', {stderr: objectGeneratorFull});
execaSync('unicorns', {stderr: objectGeneratorFull});
await execa('unicorns', {stderr: [objectGeneratorFull]});
execaSync('unicorns', {stderr: [objectGeneratorFull]});

expectError(await execa('unicorns', {stdio: objectGeneratorFull}));
expectError(execaSync('unicorns', {stdio: objectGeneratorFull}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', objectGeneratorFull]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', objectGeneratorFull]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [objectGeneratorFull]]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [objectGeneratorFull]]});

expectAssignable<StdinOption>(objectGeneratorFull);
expectAssignable<StdinOptionSync>(objectGeneratorFull);
expectAssignable<StdinOption>([objectGeneratorFull]);
expectAssignable<StdinOptionSync>([objectGeneratorFull]);

expectAssignable<StdoutStderrOption>(objectGeneratorFull);
expectAssignable<StdoutStderrOptionSync>(objectGeneratorFull);
expectAssignable<StdoutStderrOption>([objectGeneratorFull]);
expectAssignable<StdoutStderrOptionSync>([objectGeneratorFull]);

expectAssignable<StdioOption>(objectGeneratorFull);
expectAssignable<StdioOptionSync>(objectGeneratorFull);
expectAssignable<StdioOption>([objectGeneratorFull]);
expectAssignable<StdioOptionSync>([objectGeneratorFull]);
