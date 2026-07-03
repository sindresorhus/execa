import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const objectGeneratorFull = {
	* transform(line: unknown) {
		yield JSON.parse(line as string) as object;
	},
	objectMode: true,
} as const;

const stringInputObjectGeneratorFull = {
	* transform(line: string) {
		yield JSON.parse(line) as object;
	},
	objectMode: true,
} as const;

await execa('unicorns', {stdin: objectGeneratorFull});
execaSync('unicorns', {stdin: objectGeneratorFull});
await execa('unicorns', {stdin: [objectGeneratorFull]});
execaSync('unicorns', {stdin: [objectGeneratorFull]});

expectError(await execa('unicorns', {stdin: stringInputObjectGeneratorFull}));
expectError(execaSync('unicorns', {stdin: stringInputObjectGeneratorFull}));
expectError(await execa('unicorns', {stdin: [stringInputObjectGeneratorFull]}));
expectError(execaSync('unicorns', {stdin: [stringInputObjectGeneratorFull]}));

await execa('unicorns', {stdout: objectGeneratorFull});
execaSync('unicorns', {stdout: objectGeneratorFull});
await execa('unicorns', {stdout: [objectGeneratorFull]});
execaSync('unicorns', {stdout: [objectGeneratorFull]});

await execa('unicorns', {stderr: objectGeneratorFull});
execaSync('unicorns', {stderr: objectGeneratorFull});
await execa('unicorns', {stderr: [objectGeneratorFull]});
execaSync('unicorns', {stderr: [objectGeneratorFull]});

await execa('unicorns', {stdout: stringInputObjectGeneratorFull});
execaSync('unicorns', {stdout: stringInputObjectGeneratorFull});
await execa('unicorns', {stdout: [stringInputObjectGeneratorFull]});
execaSync('unicorns', {stdout: [stringInputObjectGeneratorFull]});

// The array index does not determine the pipeline position, so a `string`-input transform is valid at any position.
await execa('unicorns', {stdout: [stringInputObjectGeneratorFull, objectGeneratorFull]});
execaSync('unicorns', {stdout: [stringInputObjectGeneratorFull, objectGeneratorFull]});
await execa('unicorns', {stdout: [objectGeneratorFull, stringInputObjectGeneratorFull]});
execaSync('unicorns', {stdout: [objectGeneratorFull, stringInputObjectGeneratorFull]});

// A transform preceded by a non-transform target still receives subprocess `string` lines.
await execa('unicorns', {stdout: ['pipe', stringInputObjectGeneratorFull]});
execaSync('unicorns', {stdout: ['pipe', stringInputObjectGeneratorFull]});

// A non-tuple array variable stays assignable.
const stdoutArray = [stringInputObjectGeneratorFull];
await execa('unicorns', {stdout: stdoutArray});
execaSync('unicorns', {stdout: stdoutArray});

await execa('unicorns', {stderr: stringInputObjectGeneratorFull});
execaSync('unicorns', {stderr: stringInputObjectGeneratorFull});
await execa('unicorns', {stderr: [stringInputObjectGeneratorFull]});
execaSync('unicorns', {stderr: [stringInputObjectGeneratorFull]});
await execa('unicorns', {stderr: [stringInputObjectGeneratorFull, objectGeneratorFull]});
execaSync('unicorns', {stderr: [stringInputObjectGeneratorFull, objectGeneratorFull]});
await execa('unicorns', {stderr: [objectGeneratorFull, stringInputObjectGeneratorFull]});
execaSync('unicorns', {stderr: [objectGeneratorFull, stringInputObjectGeneratorFull]});

expectError(await execa('unicorns', {stdio: objectGeneratorFull}));
expectError(execaSync('unicorns', {stdio: objectGeneratorFull}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', objectGeneratorFull]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', objectGeneratorFull]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [objectGeneratorFull]]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [objectGeneratorFull]]});

expectAssignable<StdinOption>(objectGeneratorFull);
expectAssignable<StdinSyncOption>(objectGeneratorFull);
expectAssignable<StdinOption>([objectGeneratorFull]);
expectAssignable<StdinSyncOption>([objectGeneratorFull]);
expectNotAssignable<StdinOption>(stringInputObjectGeneratorFull);
expectNotAssignable<StdinSyncOption>(stringInputObjectGeneratorFull);
expectNotAssignable<StdinOption>([stringInputObjectGeneratorFull]);
expectNotAssignable<StdinSyncOption>([stringInputObjectGeneratorFull]);

expectAssignable<StdoutStderrOption>(objectGeneratorFull);
expectAssignable<StdoutStderrSyncOption>(objectGeneratorFull);
expectAssignable<StdoutStderrOption>([objectGeneratorFull]);
expectAssignable<StdoutStderrSyncOption>([objectGeneratorFull]);
expectAssignable<StdoutStderrOption>(stringInputObjectGeneratorFull);
expectAssignable<StdoutStderrSyncOption>(stringInputObjectGeneratorFull);
expectAssignable<StdoutStderrOption>([stringInputObjectGeneratorFull]);
expectAssignable<StdoutStderrSyncOption>([stringInputObjectGeneratorFull]);
