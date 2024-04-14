import * as process from 'node:process';
import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
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

expectError(await execa('unicorns', {stdin: process.stdout}));
expectError(execaSync('unicorns', {stdin: process.stdout}));
expectError(await execa('unicorns', {stdin: [process.stdout]}));
expectError(execaSync('unicorns', {stdin: [process.stdout]}));

await execa('unicorns', {stdout: process.stdout});
execaSync('unicorns', {stdout: process.stdout});
await execa('unicorns', {stdout: [process.stdout]});
expectError(execaSync('unicorns', {stdout: [process.stdout]}));

await execa('unicorns', {stderr: process.stdout});
execaSync('unicorns', {stderr: process.stdout});
await execa('unicorns', {stderr: [process.stdout]});
expectError(execaSync('unicorns', {stderr: [process.stdout]}));

expectError(await execa('unicorns', {stdio: process.stdout}));
expectError(execaSync('unicorns', {stdio: process.stdout}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', process.stdout]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', process.stdout]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [process.stdout]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [process.stdout]]}));

expectNotAssignable<StdinOption>(process.stdout);
expectNotAssignable<StdinOptionSync>(process.stdout);
expectNotAssignable<StdinOption>([process.stdout]);
expectNotAssignable<StdinOptionSync>([process.stdout]);

expectAssignable<StdoutStderrOption>(process.stdout);
expectAssignable<StdoutStderrOptionSync>(process.stdout);
expectAssignable<StdoutStderrOption>([process.stdout]);
expectNotAssignable<StdoutStderrOptionSync>([process.stdout]);

expectAssignable<StdioOption>(process.stdout);
expectAssignable<StdioOptionSync>(process.stdout);
expectAssignable<StdioOption>([process.stdout]);
expectNotAssignable<StdioOptionSync>([process.stdout]);
