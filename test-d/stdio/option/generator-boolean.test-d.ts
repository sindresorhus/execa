import {expectError, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinOptionSync,
	type StdoutStderrOption,
	type StdoutStderrOptionSync,
} from '../../../index.js';

const booleanGenerator = function * (line: boolean) {
	yield line;
};

expectError(await execa('unicorns', {stdin: booleanGenerator}));
expectError(execaSync('unicorns', {stdin: booleanGenerator}));
expectError(await execa('unicorns', {stdin: [booleanGenerator]}));
expectError(execaSync('unicorns', {stdin: [booleanGenerator]}));

expectError(await execa('unicorns', {stdout: booleanGenerator}));
expectError(execaSync('unicorns', {stdout: booleanGenerator}));
expectError(await execa('unicorns', {stdout: [booleanGenerator]}));
expectError(execaSync('unicorns', {stdout: [booleanGenerator]}));

expectError(await execa('unicorns', {stderr: booleanGenerator}));
expectError(execaSync('unicorns', {stderr: booleanGenerator}));
expectError(await execa('unicorns', {stderr: [booleanGenerator]}));
expectError(execaSync('unicorns', {stderr: [booleanGenerator]}));

expectError(await execa('unicorns', {stdio: booleanGenerator}));
expectError(execaSync('unicorns', {stdio: booleanGenerator}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', booleanGenerator]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', booleanGenerator]}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [booleanGenerator]]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [booleanGenerator]]}));

expectNotAssignable<StdinOption>(booleanGenerator);
expectNotAssignable<StdinOptionSync>(booleanGenerator);
expectNotAssignable<StdinOption>([booleanGenerator]);
expectNotAssignable<StdinOptionSync>([booleanGenerator]);

expectNotAssignable<StdoutStderrOption>(booleanGenerator);
expectNotAssignable<StdoutStderrOptionSync>(booleanGenerator);
expectNotAssignable<StdoutStderrOption>([booleanGenerator]);
expectNotAssignable<StdoutStderrOptionSync>([booleanGenerator]);
