import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const objectModeOnly = {objectMode: true} as const;

expectError(await execa('unicorns', {stdin: objectModeOnly}));
expectError(execaSync('unicorns', {stdin: objectModeOnly}));
expectError(await execa('unicorns', {stdin: [objectModeOnly]}));
expectError(execaSync('unicorns', {stdin: [objectModeOnly]}));

expectError(await execa('unicorns', {stdout: objectModeOnly}));
expectError(execaSync('unicorns', {stdout: objectModeOnly}));
expectError(await execa('unicorns', {stdout: [objectModeOnly]}));
expectError(execaSync('unicorns', {stdout: [objectModeOnly]}));

expectError(await execa('unicorns', {stderr: objectModeOnly}));
expectError(execaSync('unicorns', {stderr: objectModeOnly}));
expectError(await execa('unicorns', {stderr: [objectModeOnly]}));
expectError(execaSync('unicorns', {stderr: [objectModeOnly]}));

expectError(await execa('unicorns', {stdio: objectModeOnly}));
expectError(execaSync('unicorns', {stdio: objectModeOnly}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', objectModeOnly]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', objectModeOnly]}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [objectModeOnly]]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [objectModeOnly]]}));

expectTypeOf(objectModeOnly).not.toBeAssignableTo<StdinOption>();
expectTypeOf(objectModeOnly).not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf([objectModeOnly]).not.toBeAssignableTo<StdinOption>();
expectTypeOf([objectModeOnly]).not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf(objectModeOnly).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(objectModeOnly).not.toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf([objectModeOnly]).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf([objectModeOnly]).not.toBeAssignableTo<StdoutStderrSyncOption>();
