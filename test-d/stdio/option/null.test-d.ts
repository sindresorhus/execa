import {expectError, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinOptionSync,
	type StdoutStderrOption,
	type StdoutStderrOptionSync,
} from '../../../index.js';

expectError(await execa('unicorns', {stdin: null}));
expectError(execaSync('unicorns', {stdin: null}));
expectError(await execa('unicorns', {stdin: [null]}));
expectError(execaSync('unicorns', {stdin: [null]}));

expectError(await execa('unicorns', {stdout: null}));
expectError(execaSync('unicorns', {stdout: null}));
expectError(await execa('unicorns', {stdout: [null]}));
expectError(execaSync('unicorns', {stdout: [null]}));

expectError(await execa('unicorns', {stderr: null}));
expectError(execaSync('unicorns', {stderr: null}));
expectError(await execa('unicorns', {stderr: [null]}));
expectError(execaSync('unicorns', {stderr: [null]}));

expectError(await execa('unicorns', {stdio: null}));
expectError(execaSync('unicorns', {stdio: null}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', null]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', null]}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [null]]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [null]]}));

expectNotAssignable<StdinOption>(null);
expectNotAssignable<StdinOptionSync>(null);
expectNotAssignable<StdinOption>([null]);
expectNotAssignable<StdinOptionSync>([null]);

expectNotAssignable<StdoutStderrOption>(null);
expectNotAssignable<StdoutStderrOptionSync>(null);
expectNotAssignable<StdoutStderrOption>([null]);
expectNotAssignable<StdoutStderrOptionSync>([null]);
