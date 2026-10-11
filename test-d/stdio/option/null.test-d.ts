import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

expectError(await execa('unicorns', {stdin: null}));
expectError(execaSync('unicorns', {stdin: null}));
expectError(await execa('unicorns', {stdin: [null]}));
expectError(execaSync('unicorns', {stdin: [null]}));

expectError(await execa('unicorns', {stdout: null}));
expectError(execaSync('unicorns', {stdout: null}));
expectError(await execa('unicorns', {stdout: [null]}));
expectError(execaSync('unicorns', {stdout: [null]}));

expectError(await execa('unicorns', {stderr: null}));
expectError(execaSync('unicorns', {stderr: null}));
expectError(await execa('unicorns', {stderr: [null]}));
expectError(execaSync('unicorns', {stderr: [null]}));

expectError(await execa('unicorns', {stdio: null}));
expectError(execaSync('unicorns', {stdio: null}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', null]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', null]}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [null]]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [null]]}));

expectTypeOf<null>().not.toBeAssignableTo<StdinOption>();
expectTypeOf<null>().not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf<[null]>().not.toBeAssignableTo<StdinOption>();
expectTypeOf<[null]>().not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf<null>().not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf<null>().not.toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf<[null]>().not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf<[null]>().not.toBeAssignableTo<StdoutStderrSyncOption>();
