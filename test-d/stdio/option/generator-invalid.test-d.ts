import {expectError, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const invalidReturnGenerator = function * (line: unknown) {
	yield line;
	return false;
};

expectError(await execa('unicorns', {stdin: invalidReturnGenerator}));
expectError(execaSync('unicorns', {stdin: invalidReturnGenerator}));
expectError(await execa('unicorns', {stdin: [invalidReturnGenerator]}));
expectError(execaSync('unicorns', {stdin: [invalidReturnGenerator]}));

expectError(await execa('unicorns', {stdout: invalidReturnGenerator}));
expectError(execaSync('unicorns', {stdout: invalidReturnGenerator}));
expectError(await execa('unicorns', {stdout: [invalidReturnGenerator]}));
expectError(execaSync('unicorns', {stdout: [invalidReturnGenerator]}));

expectError(await execa('unicorns', {stderr: invalidReturnGenerator}));
expectError(execaSync('unicorns', {stderr: invalidReturnGenerator}));
expectError(await execa('unicorns', {stderr: [invalidReturnGenerator]}));
expectError(execaSync('unicorns', {stderr: [invalidReturnGenerator]}));

expectError(await execa('unicorns', {stdio: invalidReturnGenerator}));
expectError(execaSync('unicorns', {stdio: invalidReturnGenerator}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', invalidReturnGenerator]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', invalidReturnGenerator]}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [invalidReturnGenerator]]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [invalidReturnGenerator]]}));

expectNotAssignable<StdinOption>(invalidReturnGenerator);
expectNotAssignable<StdinSyncOption>(invalidReturnGenerator);
expectNotAssignable<StdinOption>([invalidReturnGenerator]);
expectNotAssignable<StdinSyncOption>([invalidReturnGenerator]);

expectNotAssignable<StdoutStderrOption>(invalidReturnGenerator);
expectNotAssignable<StdoutStderrSyncOption>(invalidReturnGenerator);
expectNotAssignable<StdoutStderrOption>([invalidReturnGenerator]);
expectNotAssignable<StdoutStderrSyncOption>([invalidReturnGenerator]);
