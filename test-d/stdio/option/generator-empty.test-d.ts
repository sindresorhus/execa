import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

expectError(await execa('unicorns', {stdin: {}}));
expectError(execaSync('unicorns', {stdin: {}}));
expectError(await execa('unicorns', {stdin: [{}]}));
expectError(execaSync('unicorns', {stdin: [{}]}));

expectError(await execa('unicorns', {stdout: {}}));
expectError(execaSync('unicorns', {stdout: {}}));
expectError(await execa('unicorns', {stdout: [{}]}));
expectError(execaSync('unicorns', {stdout: [{}]}));

expectError(await execa('unicorns', {stderr: {}}));
expectError(execaSync('unicorns', {stderr: {}}));
expectError(await execa('unicorns', {stderr: [{}]}));
expectError(execaSync('unicorns', {stderr: [{}]}));

expectError(await execa('unicorns', {stdio: {}}));
expectError(execaSync('unicorns', {stdio: {}}));

expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', {}]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', {}]}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [{}]]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', [{}]]}));

expectTypeOf<{}>().not.toBeAssignableTo<StdinOption>();
expectTypeOf<{}>().not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf<[{}]>().not.toBeAssignableTo<StdinOption>();
expectTypeOf<[{}]>().not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf<{}>().not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf<{}>().not.toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf<[{}]>().not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf<[{}]>().not.toBeAssignableTo<StdoutStderrSyncOption>();
