import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const transformWithInvalidObjectMode = {
	* transform(line: unknown) {
		yield line;
	},
	objectMode: 'true',
} as const;

expectError(await execa('unicorns', {stdin: transformWithInvalidObjectMode}));
expectError(execaSync('unicorns', {stdin: transformWithInvalidObjectMode}));
expectError(await execa('unicorns', {stdin: [transformWithInvalidObjectMode]}));
expectError(execaSync('unicorns', {stdin: [transformWithInvalidObjectMode]}));

expectError(await execa('unicorns', {stdout: transformWithInvalidObjectMode}));
expectError(execaSync('unicorns', {stdout: transformWithInvalidObjectMode}));
expectError(await execa('unicorns', {stdout: [transformWithInvalidObjectMode]}));
expectError(execaSync('unicorns', {stdout: [transformWithInvalidObjectMode]}));

expectError(await execa('unicorns', {stderr: transformWithInvalidObjectMode}));
expectError(execaSync('unicorns', {stderr: transformWithInvalidObjectMode}));
expectError(await execa('unicorns', {stderr: [transformWithInvalidObjectMode]}));
expectError(execaSync('unicorns', {stderr: [transformWithInvalidObjectMode]}));

expectError(await execa('unicorns', {stdio: transformWithInvalidObjectMode}));
expectError(execaSync('unicorns', {stdio: transformWithInvalidObjectMode}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', transformWithInvalidObjectMode]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', transformWithInvalidObjectMode]}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [transformWithInvalidObjectMode]]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [transformWithInvalidObjectMode]]}));

expectTypeOf(transformWithInvalidObjectMode).not.toBeAssignableTo<StdinOption>();
expectTypeOf(transformWithInvalidObjectMode).not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf([transformWithInvalidObjectMode]).not.toBeAssignableTo<StdinOption>();
expectTypeOf([transformWithInvalidObjectMode]).not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf(transformWithInvalidObjectMode).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(transformWithInvalidObjectMode).not.toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf([transformWithInvalidObjectMode]).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf([transformWithInvalidObjectMode]).not.toBeAssignableTo<StdoutStderrSyncOption>();
