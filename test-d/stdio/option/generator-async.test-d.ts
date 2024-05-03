import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
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
expectNotAssignable<StdinSyncOption>(asyncGenerator);
expectAssignable<StdinOption>([asyncGenerator]);
expectNotAssignable<StdinSyncOption>([asyncGenerator]);

expectAssignable<StdoutStderrOption>(asyncGenerator);
expectNotAssignable<StdoutStderrSyncOption>(asyncGenerator);
expectAssignable<StdoutStderrOption>([asyncGenerator]);
expectNotAssignable<StdoutStderrSyncOption>([asyncGenerator]);
