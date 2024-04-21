import {expectError, expectNotAssignable} from 'tsd';
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

const invalidFileObject = {file: new URL('file:///test')} as const;

expectError(await execa('unicorns', {stdin: invalidFileObject}));
expectError(execaSync('unicorns', {stdin: invalidFileObject}));
expectError(await execa('unicorns', {stdin: [invalidFileObject]}));
expectError(execaSync('unicorns', {stdin: [invalidFileObject]}));

expectError(await execa('unicorns', {stdout: invalidFileObject}));
expectError(execaSync('unicorns', {stdout: invalidFileObject}));
expectError(await execa('unicorns', {stdout: [invalidFileObject]}));
expectError(execaSync('unicorns', {stdout: [invalidFileObject]}));

expectError(await execa('unicorns', {stderr: invalidFileObject}));
expectError(execaSync('unicorns', {stderr: invalidFileObject}));
expectError(await execa('unicorns', {stderr: [invalidFileObject]}));
expectError(execaSync('unicorns', {stderr: [invalidFileObject]}));

expectError(await execa('unicorns', {stdio: invalidFileObject}));
expectError(execaSync('unicorns', {stdio: invalidFileObject}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', invalidFileObject]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', invalidFileObject]}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [invalidFileObject]]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [invalidFileObject]]}));

expectNotAssignable<StdinOption>(invalidFileObject);
expectNotAssignable<StdinOptionSync>(invalidFileObject);
expectNotAssignable<StdinOption>([invalidFileObject]);
expectNotAssignable<StdinOptionSync>([invalidFileObject]);

expectNotAssignable<StdoutStderrOption>(invalidFileObject);
expectNotAssignable<StdoutStderrOptionSync>(invalidFileObject);
expectNotAssignable<StdoutStderrOption>([invalidFileObject]);
expectNotAssignable<StdoutStderrOptionSync>([invalidFileObject]);

expectNotAssignable<StdioOption>(invalidFileObject);
expectNotAssignable<StdioOptionSync>(invalidFileObject);
expectNotAssignable<StdioOption>([invalidFileObject]);
expectNotAssignable<StdioOptionSync>([invalidFileObject]);