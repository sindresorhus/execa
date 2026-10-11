import {Duplex} from 'node:stream';
import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const duplexWithInvalidObjectMode = {
	transform: new Duplex(),
	objectMode: 'true',
} as const;

expectError(await execa('unicorns', {stdin: duplexWithInvalidObjectMode}));
expectError(execaSync('unicorns', {stdin: duplexWithInvalidObjectMode}));
expectError(await execa('unicorns', {stdin: [duplexWithInvalidObjectMode]}));
expectError(execaSync('unicorns', {stdin: [duplexWithInvalidObjectMode]}));

expectError(await execa('unicorns', {stdout: duplexWithInvalidObjectMode}));
expectError(execaSync('unicorns', {stdout: duplexWithInvalidObjectMode}));
expectError(await execa('unicorns', {stdout: [duplexWithInvalidObjectMode]}));
expectError(execaSync('unicorns', {stdout: [duplexWithInvalidObjectMode]}));

expectError(await execa('unicorns', {stderr: duplexWithInvalidObjectMode}));
expectError(execaSync('unicorns', {stderr: duplexWithInvalidObjectMode}));
expectError(await execa('unicorns', {stderr: [duplexWithInvalidObjectMode]}));
expectError(execaSync('unicorns', {stderr: [duplexWithInvalidObjectMode]}));

expectError(await execa('unicorns', {stdio: duplexWithInvalidObjectMode}));
expectError(execaSync('unicorns', {stdio: duplexWithInvalidObjectMode}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', duplexWithInvalidObjectMode]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', duplexWithInvalidObjectMode]}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [duplexWithInvalidObjectMode]]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [duplexWithInvalidObjectMode]]}));

expectTypeOf(duplexWithInvalidObjectMode).not.toBeAssignableTo<StdinOption>();
expectTypeOf(duplexWithInvalidObjectMode).not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf([duplexWithInvalidObjectMode]).not.toBeAssignableTo<StdinOption>();
expectTypeOf([duplexWithInvalidObjectMode]).not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf(duplexWithInvalidObjectMode).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(duplexWithInvalidObjectMode).not.toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf([duplexWithInvalidObjectMode]).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf([duplexWithInvalidObjectMode]).not.toBeAssignableTo<StdoutStderrSyncOption>();
