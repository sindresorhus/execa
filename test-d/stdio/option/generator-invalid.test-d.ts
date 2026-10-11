import {expectTypeOf, expectError} from 'nz';
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

expectTypeOf(invalidReturnGenerator).not.toBeAssignableTo<StdinOption>();
expectTypeOf(invalidReturnGenerator).not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf([invalidReturnGenerator]).not.toBeAssignableTo<StdinOption>();
expectTypeOf([invalidReturnGenerator]).not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf(invalidReturnGenerator).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(invalidReturnGenerator).not.toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf([invalidReturnGenerator]).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf([invalidReturnGenerator]).not.toBeAssignableTo<StdoutStderrSyncOption>();
