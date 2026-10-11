import {expectTypeOf} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

await execa('unicorns', {stdin: 'pipe'});
execaSync('unicorns', {stdin: 'pipe'});
await execa('unicorns', {stdin: ['pipe']});
execaSync('unicorns', {stdin: ['pipe']});

await execa('unicorns', {stdout: 'pipe'});
execaSync('unicorns', {stdout: 'pipe'});
await execa('unicorns', {stdout: ['pipe']});
execaSync('unicorns', {stdout: ['pipe']});

await execa('unicorns', {stderr: 'pipe'});
execaSync('unicorns', {stderr: 'pipe'});
await execa('unicorns', {stderr: ['pipe']});
execaSync('unicorns', {stderr: ['pipe']});

await execa('unicorns', {stdio: 'pipe'});
execaSync('unicorns', {stdio: 'pipe'});

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'pipe']});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'pipe']});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', ['pipe']]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', ['pipe']]});

expectTypeOf<'pipe'>().toBeAssignableTo<StdinOption>();
expectTypeOf<'pipe'>().toBeAssignableTo<StdinSyncOption>();
['pipe'] satisfies StdinOption;
['pipe'] satisfies StdinSyncOption;

expectTypeOf<'pipe'>().toBeAssignableTo<StdoutStderrOption>();
expectTypeOf<'pipe'>().toBeAssignableTo<StdoutStderrSyncOption>();
['pipe'] satisfies StdoutStderrOption;
['pipe'] satisfies StdoutStderrSyncOption;
