import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const finalOnly = {
	* final() {
		yield {} as unknown;
	},
} as const;

expectError(await execa('unicorns', {stdin: finalOnly}));
expectError(execaSync('unicorns', {stdin: finalOnly}));
expectError(await execa('unicorns', {stdin: [finalOnly]}));
expectError(execaSync('unicorns', {stdin: [finalOnly]}));

expectError(await execa('unicorns', {stdout: finalOnly}));
expectError(execaSync('unicorns', {stdout: finalOnly}));
expectError(await execa('unicorns', {stdout: [finalOnly]}));
expectError(execaSync('unicorns', {stdout: [finalOnly]}));

expectError(await execa('unicorns', {stderr: finalOnly}));
expectError(execaSync('unicorns', {stderr: finalOnly}));
expectError(await execa('unicorns', {stderr: [finalOnly]}));
expectError(execaSync('unicorns', {stderr: [finalOnly]}));

expectError(await execa('unicorns', {stdio: finalOnly}));
expectError(execaSync('unicorns', {stdio: finalOnly}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', finalOnly]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', finalOnly]}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [finalOnly]]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [finalOnly]]}));

expectTypeOf(finalOnly).not.toBeAssignableTo<StdinOption>();
expectTypeOf(finalOnly).not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf([finalOnly]).not.toBeAssignableTo<StdinOption>();
expectTypeOf([finalOnly]).not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf(finalOnly).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(finalOnly).not.toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf([finalOnly]).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf([finalOnly]).not.toBeAssignableTo<StdoutStderrSyncOption>();
