import * as process from 'node:process';
import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinOptionSync,
	type StdoutStderrOption,
	type StdoutStderrOptionSync,
} from '../../../index.js';

expectError(await execa('unicorns', {stdin: process.stderr}));
expectError(execaSync('unicorns', {stdin: process.stderr}));
expectError(await execa('unicorns', {stdin: [process.stderr]}));
expectError(execaSync('unicorns', {stdin: [process.stderr]}));

await execa('unicorns', {stdout: process.stderr});
execaSync('unicorns', {stdout: process.stderr});
await execa('unicorns', {stdout: [process.stderr]});
expectError(execaSync('unicorns', {stdout: [process.stderr]}));

await execa('unicorns', {stderr: process.stderr});
execaSync('unicorns', {stderr: process.stderr});
await execa('unicorns', {stderr: [process.stderr]});
expectError(execaSync('unicorns', {stderr: [process.stderr]}));

expectError(await execa('unicorns', {stdio: process.stderr}));
expectError(execaSync('unicorns', {stdio: process.stderr}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', process.stderr]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', process.stderr]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [process.stderr]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [process.stderr]]}));

expectNotAssignable<StdinOption>(process.stderr);
expectNotAssignable<StdinOptionSync>(process.stderr);
expectNotAssignable<StdinOption>([process.stderr]);
expectNotAssignable<StdinOptionSync>([process.stderr]);

expectAssignable<StdoutStderrOption>(process.stderr);
expectAssignable<StdoutStderrOptionSync>(process.stderr);
expectAssignable<StdoutStderrOption>([process.stderr]);
expectNotAssignable<StdoutStderrOptionSync>([process.stderr]);
