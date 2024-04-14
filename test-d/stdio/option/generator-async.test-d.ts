import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
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

const asyncGenerator = async function * (line: unknown) {
	yield '';
};

await execa('unicorns', {stdin: asyncGenerator});
expectError(execaSync('unicorns', {stdin: asyncGenerator}));
await execa('unicorns', {stdin: [asyncGenerator]});
expectError(execaSync('unicorns', {stdin: [asyncGenerator]}));

await execa('unicorns', {stdout: asyncGenerator});
expectError(execaSync('unicorns', {stdout: asyncGenerator}));
await execa('unicorns', {stdout: [asyncGenerator]});
expectError(execaSync('unicorns', {stdout: [asyncGenerator]}));

await execa('unicorns', {stderr: asyncGenerator});
expectError(execaSync('unicorns', {stderr: asyncGenerator}));
await execa('unicorns', {stderr: [asyncGenerator]});
expectError(execaSync('unicorns', {stderr: [asyncGenerator]}));

expectError(await execa('unicorns', {stdio: asyncGenerator}));
expectError(execaSync('unicorns', {stdio: asyncGenerator}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', asyncGenerator]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', asyncGenerator]}));
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [asyncGenerator]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [asyncGenerator]]}));

expectAssignable<StdinOption>(asyncGenerator);
expectNotAssignable<StdinOptionSync>(asyncGenerator);
expectAssignable<StdinOption>([asyncGenerator]);
expectNotAssignable<StdinOptionSync>([asyncGenerator]);

expectAssignable<StdoutStderrOption>(asyncGenerator);
expectNotAssignable<StdoutStderrOptionSync>(asyncGenerator);
expectAssignable<StdoutStderrOption>([asyncGenerator]);
expectNotAssignable<StdoutStderrOptionSync>([asyncGenerator]);

expectAssignable<StdioOption>(asyncGenerator);
expectNotAssignable<StdioOptionSync>(asyncGenerator);
expectAssignable<StdioOption>([asyncGenerator]);
expectNotAssignable<StdioOptionSync>([asyncGenerator]);
