import {expectError, expectAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const stringGenerator = function * (line: string) {
	yield line;
};

await execa('unicorns', {stdin: stringGenerator});
execaSync('unicorns', {stdin: stringGenerator});
await execa('unicorns', {stdin: [stringGenerator]});
execaSync('unicorns', {stdin: [stringGenerator]});

await execa('unicorns', {stdout: stringGenerator});
execaSync('unicorns', {stdout: stringGenerator});
await execa('unicorns', {stdout: [stringGenerator]});
execaSync('unicorns', {stdout: [stringGenerator]});

await execa('unicorns', {stderr: stringGenerator});
execaSync('unicorns', {stderr: stringGenerator});
await execa('unicorns', {stderr: [stringGenerator]});
execaSync('unicorns', {stderr: [stringGenerator]});

expectError(await execa('unicorns', {stdio: stringGenerator}));
expectError(execaSync('unicorns', {stdio: stringGenerator}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', stringGenerator]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', stringGenerator]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [stringGenerator]]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [stringGenerator]]});

expectAssignable<StdinOption>(stringGenerator);
expectAssignable<StdinSyncOption>(stringGenerator);
expectAssignable<StdinOption>([stringGenerator]);
expectAssignable<StdinSyncOption>([stringGenerator]);

expectAssignable<StdoutStderrOption>(stringGenerator);
expectAssignable<StdoutStderrSyncOption>(stringGenerator);
expectAssignable<StdoutStderrOption>([stringGenerator]);
expectAssignable<StdoutStderrSyncOption>([stringGenerator]);

// The `chunk` argument is typed, but the return type stays `unknown`: a transform can yield both `string` and `Uint8Array`.
const mixedYieldGenerator = function * (line: string) {
	yield line;
	yield new TextEncoder().encode(line);
};

expectAssignable<StdinOption>(mixedYieldGenerator);
expectAssignable<StdinSyncOption>(mixedYieldGenerator);
expectAssignable<StdoutStderrOption>(mixedYieldGenerator);
expectAssignable<StdoutStderrSyncOption>(mixedYieldGenerator);
