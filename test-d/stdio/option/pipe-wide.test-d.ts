import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

const pipe = 'pipe' as string;
const pipes = ['pipe'] as string[];
const pipesOfPipes = [['pipe']] as string[][];

expectError(await execa('unicorns', {stdin: pipe}));
expectError(execaSync('unicorns', {stdin: pipe}));
expectError(await execa('unicorns', {stdin: pipes}));
expectError(execaSync('unicorns', {stdin: pipes}));

expectError(await execa('unicorns', {stdout: pipe}));
expectError(execaSync('unicorns', {stdout: pipe}));
expectError(await execa('unicorns', {stdout: pipes}));
expectError(execaSync('unicorns', {stdout: pipes}));

expectError(await execa('unicorns', {stderr: pipe}));
expectError(execaSync('unicorns', {stderr: pipe}));
expectError(await execa('unicorns', {stderr: pipes}));
expectError(execaSync('unicorns', {stderr: pipes}));

expectError(await execa('unicorns', {stdio: pipe}));
expectError(execaSync('unicorns', {stdio: pipe}));

expectError(await execa('unicorns', {stdio: pipes}));
expectError(execaSync('unicorns', {stdio: pipes}));
expectError(await execa('unicorns', {stdio: pipesOfPipes}));
expectError(execaSync('unicorns', {stdio: pipesOfPipes}));

expectTypeOf(pipe).not.toBeAssignableTo<StdinOption>();
expectTypeOf(pipe).not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf(pipes).not.toBeAssignableTo<StdinOption>();
expectTypeOf(pipes).not.toBeAssignableTo<StdinSyncOption>();

expectTypeOf(pipe).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(pipe).not.toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf(pipes).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(pipes).not.toBeAssignableTo<StdoutStderrSyncOption>();
