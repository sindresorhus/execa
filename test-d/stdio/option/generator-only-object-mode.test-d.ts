import {expectError, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinOptionSync,
	type StdoutStderrOption,
	type StdoutStderrOptionSync,
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

expectNotAssignable<StdinOption>(objectModeOnly);
expectNotAssignable<StdinOptionSync>(objectModeOnly);
expectNotAssignable<StdinOption>([objectModeOnly]);
expectNotAssignable<StdinOptionSync>([objectModeOnly]);

expectNotAssignable<StdoutStderrOption>(objectModeOnly);
expectNotAssignable<StdoutStderrOptionSync>(objectModeOnly);
expectNotAssignable<StdoutStderrOption>([objectModeOnly]);
expectNotAssignable<StdoutStderrOptionSync>([objectModeOnly]);
