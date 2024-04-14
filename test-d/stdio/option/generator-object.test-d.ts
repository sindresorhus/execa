import {expectError, expectAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinOptionSync,
	type StdoutStderrOption,
	type StdoutStderrOptionSync,
	type StdioOption,
	type StdioOptionSync,
} from '../../../index.js';

const objectGenerator = function * (line: unknown) {
	yield JSON.parse(line as string) as object;
};

await execa('unicorns', {stdin: objectGenerator});
execaSync('unicorns', {stdin: objectGenerator});
await execa('unicorns', {stdin: [objectGenerator]});
execaSync('unicorns', {stdin: [objectGenerator]});

await execa('unicorns', {stdout: objectGenerator});
execaSync('unicorns', {stdout: objectGenerator});
await execa('unicorns', {stdout: [objectGenerator]});
execaSync('unicorns', {stdout: [objectGenerator]});

await execa('unicorns', {stderr: objectGenerator});
execaSync('unicorns', {stderr: objectGenerator});
await execa('unicorns', {stderr: [objectGenerator]});
execaSync('unicorns', {stderr: [objectGenerator]});

expectError(await execa('unicorns', {stdio: objectGenerator}));
expectError(execaSync('unicorns', {stdio: objectGenerator}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', objectGenerator]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', objectGenerator]});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [objectGenerator]]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [objectGenerator]]});

expectAssignable<StdinOption>(objectGenerator);
expectAssignable<StdinOptionSync>(objectGenerator);
expectAssignable<StdinOption>([objectGenerator]);
expectAssignable<StdinOptionSync>([objectGenerator]);

expectAssignable<StdoutStderrOption>(objectGenerator);
expectAssignable<StdoutStderrOptionSync>(objectGenerator);
expectAssignable<StdoutStderrOption>([objectGenerator]);
expectAssignable<StdoutStderrOptionSync>([objectGenerator]);

expectAssignable<StdioOption>(objectGenerator);
expectAssignable<StdioOptionSync>(objectGenerator);
expectAssignable<StdioOption>([objectGenerator]);
expectAssignable<StdioOptionSync>([objectGenerator]);
