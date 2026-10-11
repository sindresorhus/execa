import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const preserveNewlinesOnly = {preserveNewlines: true} as const;

expectError(await execa('unicorns', {stdin: preserveNewlinesOnly}));
expectError(execaSync('unicorns', {stdin: preserveNewlinesOnly}));
expectError(await execa('unicorns', {stdin: [preserveNewlinesOnly]}));
expectError(execaSync('unicorns', {stdin: [preserveNewlinesOnly]}));

expectError(await execa('unicorns', {stdout: preserveNewlinesOnly}));
expectError(execaSync('unicorns', {stdout: preserveNewlinesOnly}));
expectError(await execa('unicorns', {stdout: [preserveNewlinesOnly]}));
expectError(execaSync('unicorns', {stdout: [preserveNewlinesOnly]}));

expectError(await execa('unicorns', {stderr: preserveNewlinesOnly}));
expectError(execaSync('unicorns', {stderr: preserveNewlinesOnly}));
expectError(await execa('unicorns', {stderr: [preserveNewlinesOnly]}));
expectError(execaSync('unicorns', {stderr: [preserveNewlinesOnly]}));

expectError(await execa('unicorns', {stdio: preserveNewlinesOnly}));
expectError(execaSync('unicorns', {stdio: preserveNewlinesOnly}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', preserveNewlinesOnly]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', preserveNewlinesOnly]}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [preserveNewlinesOnly]]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [preserveNewlinesOnly]]}));

expectTypeOf(preserveNewlinesOnly).not.toBeAssignableTo<StdinOption>();
expectTypeOf(preserveNewlinesOnly).not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf([preserveNewlinesOnly]).not.toBeAssignableTo<StdinOption>();
expectTypeOf([preserveNewlinesOnly]).not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf(preserveNewlinesOnly).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(preserveNewlinesOnly).not.toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf([preserveNewlinesOnly]).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf([preserveNewlinesOnly]).not.toBeAssignableTo<StdoutStderrSyncOption>();
