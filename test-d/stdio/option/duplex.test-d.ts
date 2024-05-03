import {Duplex} from 'node:stream';
import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const duplex = {transform: new Duplex()} as const;

await execa('unicorns', {stdin: duplex});
expectError(execaSync('unicorns', {stdin: duplex}));
await execa('unicorns', {stdin: [duplex]});
expectError(execaSync('unicorns', {stdin: [duplex]}));

await execa('unicorns', {stdout: duplex});
expectError(execaSync('unicorns', {stdout: duplex}));
await execa('unicorns', {stdout: [duplex]});
expectError(execaSync('unicorns', {stdout: [duplex]}));

await execa('unicorns', {stderr: duplex});
expectError(execaSync('unicorns', {stderr: duplex}));
await execa('unicorns', {stderr: [duplex]});
expectError(execaSync('unicorns', {stderr: [duplex]}));

expectError(await execa('unicorns', {stdio: duplex}));
expectError(execaSync('unicorns', {stdio: duplex}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', duplex]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', duplex]}));
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [duplex]]});
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [duplex]]}));

expectAssignable<StdinOption>(duplex);
expectNotAssignable<StdinSyncOption>(duplex);
expectAssignable<StdinOption>([duplex]);
expectNotAssignable<StdinSyncOption>([duplex]);

expectAssignable<StdoutStderrOption>(duplex);
expectNotAssignable<StdoutStderrSyncOption>(duplex);
expectAssignable<StdoutStderrOption>([duplex]);
expectNotAssignable<StdoutStderrSyncOption>([duplex]);
