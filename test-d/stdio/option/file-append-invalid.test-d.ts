import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const invalidFileAppend = {file: './test', append: 'true'} as const;

expectError(await execa('unicorns', {stdin: invalidFileAppend}));
expectError(execaSync('unicorns', {stdin: invalidFileAppend}));
expectError(await execa('unicorns', {stdin: [invalidFileAppend]}));
expectError(execaSync('unicorns', {stdin: [invalidFileAppend]}));

expectError(await execa('unicorns', {stdout: invalidFileAppend}));
expectError(execaSync('unicorns', {stdout: invalidFileAppend}));
expectError(await execa('unicorns', {stdout: [invalidFileAppend]}));
expectError(execaSync('unicorns', {stdout: [invalidFileAppend]}));

expectError(await execa('unicorns', {stderr: invalidFileAppend}));
expectError(execaSync('unicorns', {stderr: invalidFileAppend}));
expectError(await execa('unicorns', {stderr: [invalidFileAppend]}));
expectError(execaSync('unicorns', {stderr: [invalidFileAppend]}));

expectError(await execa('unicorns', {stdio: invalidFileAppend}));
expectError(execaSync('unicorns', {stdio: invalidFileAppend}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', invalidFileAppend]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', invalidFileAppend]}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [invalidFileAppend]]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [invalidFileAppend]]}));

expectTypeOf(invalidFileAppend).not.toBeAssignableTo<StdinOption>();
expectTypeOf(invalidFileAppend).not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf([invalidFileAppend]).not.toBeAssignableTo<StdinOption>();
expectTypeOf([invalidFileAppend]).not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf(invalidFileAppend).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(invalidFileAppend).not.toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf([invalidFileAppend]).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf([invalidFileAppend]).not.toBeAssignableTo<StdoutStderrSyncOption>();
