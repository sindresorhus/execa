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

await execa('unicorns', {stdin: process.stdin});
execaSync('unicorns', {stdin: process.stdin});
await execa('unicorns', {stdin: [process.stdin]});
expectError(execaSync('unicorns', {stdin: [process.stdin]}));

expectError(await execa('unicorns', {stdout: process.stdin}));
expectError(execaSync('unicorns', {stdout: process.stdin}));
expectError(await execa('unicorns', {stdout: [process.stdin]}));
expectError(execaSync('unicorns', {stdout: [process.stdin]}));

expectError(await execa('unicorns', {stderr: process.stdin}));
expectError(execaSync('unicorns', {stderr: process.stdin}));
expectError(await execa('unicorns', {stderr: [process.stdin]}));
expectError(execaSync('unicorns', {stderr: [process.stdin]}));

expectError(await execa('unicorns', {stdio: process.stdin}));
expectError(execaSync('unicorns', {stdio: process.stdin}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', process.stdin]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', process.stdin]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [process.stdin]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [process.stdin]]}));

expectAssignable<StdinOption>(process.stdin);
expectAssignable<StdinOptionSync>(process.stdin);
expectAssignable<StdinOption>([process.stdin]);
expectNotAssignable<StdinOptionSync>([process.stdin]);

expectNotAssignable<StdoutStderrOption>(process.stdin);
expectNotAssignable<StdoutStderrOptionSync>(process.stdin);
expectNotAssignable<StdoutStderrOption>([process.stdin]);
expectNotAssignable<StdoutStderrOptionSync>([process.stdin]);

expectAssignable<StdioOption>(process.stdin);
expectAssignable<StdioOptionSync>(process.stdin);
expectAssignable<StdioOption>([process.stdin]);
expectNotAssignable<StdioOptionSync>([process.stdin]);
