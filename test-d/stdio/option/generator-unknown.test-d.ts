import {expectError, expectAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinOptionSync,
	type StdoutStderrOption,
	type StdoutStderrOptionSync,
} from '../../../index.js';

const unknownGenerator = function * (line: unknown) {
	yield line;
};

await execa('unicorns', {stdin: unknownGenerator});
execaSync('unicorns', {stdin: unknownGenerator});
await execa('unicorns', {stdin: [unknownGenerator]});
execaSync('unicorns', {stdin: [unknownGenerator]});

await execa('unicorns', {stdout: unknownGenerator});
execaSync('unicorns', {stdout: unknownGenerator});
await execa('unicorns', {stdout: [unknownGenerator]});
execaSync('unicorns', {stdout: [unknownGenerator]});

await execa('unicorns', {stderr: unknownGenerator});
execaSync('unicorns', {stderr: unknownGenerator});
await execa('unicorns', {stderr: [unknownGenerator]});
execaSync('unicorns', {stderr: [unknownGenerator]});

expectError(await execa('unicorns', {stdio: unknownGenerator}));
expectError(execaSync('unicorns', {stdio: unknownGenerator}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', unknownGenerator]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', unknownGenerator]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [unknownGenerator]]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [unknownGenerator]]});

expectAssignable<StdinOption>(unknownGenerator);
expectAssignable<StdinOptionSync>(unknownGenerator);
expectAssignable<StdinOption>([unknownGenerator]);
expectAssignable<StdinOptionSync>([unknownGenerator]);

expectAssignable<StdoutStderrOption>(unknownGenerator);
expectAssignable<StdoutStderrOptionSync>(unknownGenerator);
expectAssignable<StdoutStderrOption>([unknownGenerator]);
expectAssignable<StdoutStderrOptionSync>([unknownGenerator]);
