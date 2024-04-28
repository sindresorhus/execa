import {expectError, expectAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
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
expectAssignable<StdinSyncOption>(unknownGenerator);
expectAssignable<StdinOption>([unknownGenerator]);
expectAssignable<StdinSyncOption>([unknownGenerator]);

expectAssignable<StdoutStderrOption>(unknownGenerator);
expectAssignable<StdoutStderrSyncOption>(unknownGenerator);
expectAssignable<StdoutStderrOption>([unknownGenerator]);
expectAssignable<StdoutStderrSyncOption>([unknownGenerator]);
