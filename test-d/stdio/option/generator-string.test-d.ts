import {expectError, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const stringGenerator = function * (line: string) {
	yield line;
};

expectError(await execa('unicorns', {stdin: stringGenerator}));
expectError(execaSync('unicorns', {stdin: stringGenerator}));
expectError(await execa('unicorns', {stdin: [stringGenerator]}));
expectError(execaSync('unicorns', {stdin: [stringGenerator]}));

expectError(await execa('unicorns', {stdout: stringGenerator}));
expectError(execaSync('unicorns', {stdout: stringGenerator}));
expectError(await execa('unicorns', {stdout: [stringGenerator]}));
expectError(execaSync('unicorns', {stdout: [stringGenerator]}));

expectError(await execa('unicorns', {stderr: stringGenerator}));
expectError(execaSync('unicorns', {stderr: stringGenerator}));
expectError(await execa('unicorns', {stderr: [stringGenerator]}));
expectError(execaSync('unicorns', {stderr: [stringGenerator]}));

expectError(await execa('unicorns', {stdio: stringGenerator}));
expectError(execaSync('unicorns', {stdio: stringGenerator}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', stringGenerator]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', stringGenerator]}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [stringGenerator]]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [stringGenerator]]}));

expectNotAssignable<StdinOption>(stringGenerator);
expectNotAssignable<StdinSyncOption>(stringGenerator);
expectNotAssignable<StdinOption>([stringGenerator]);
expectNotAssignable<StdinSyncOption>([stringGenerator]);

expectNotAssignable<StdoutStderrOption>(stringGenerator);
expectNotAssignable<StdoutStderrSyncOption>(stringGenerator);
expectNotAssignable<StdoutStderrOption>([stringGenerator]);
expectNotAssignable<StdoutStderrSyncOption>([stringGenerator]);
