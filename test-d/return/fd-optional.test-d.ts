import {expectTypeOf} from 'nz';
import {
	execa,
	execaSync,
	type ExecaError,
	type ExecaSyncError,
} from '../../index.js';

const optionalStdoutLines: {stdout?: false; all: true} = {all: true};
const stdoutLines = await execa('unicorns', {lines: optionalStdoutLines});
expectTypeOf(stdoutLines.stdout).toBe<string | string[]>();
expectTypeOf(stdoutLines.stdio[1]).toBe<string | string[]>();
const optionalStderrLines: {stderr?: false; all: true} = {all: true};
const stderrLines = execaSync('unicorns', {lines: optionalStderrLines});
expectTypeOf(stderrLines.stderr).toBe<string | string[]>();
expectTypeOf(stderrLines.stdio[2]).toBe<string | string[]>();
const optionalFd1Lines: {fd1?: false; all: true} = {all: true};
const fd1Lines = await execa('unicorns', {lines: optionalFd1Lines});
expectTypeOf(fd1Lines.stdout).toBe<string | string[]>();
const optionalFd2Lines: {fd2?: false; all: true} = {all: true};
const fd2Lines = execaSync('unicorns', {lines: optionalFd2Lines});
expectTypeOf(fd2Lines.stderr).toBe<string | string[]>();

const optionalStdoutBuffer: {stdout?: true; all: false} = {all: false};
const stdoutBuffer = await execa('unicorns', {buffer: optionalStdoutBuffer});
expectTypeOf(stdoutBuffer.stdout).toBe<string | undefined>();
expectTypeOf(stdoutBuffer.stdio[1]).toBe<string | undefined>();
const optionalStderrBuffer: {stderr?: true; all: false} = {all: false};
const stderrBuffer = execaSync('unicorns', {buffer: optionalStderrBuffer});
expectTypeOf(stderrBuffer.stderr).toBe<string | undefined>();
expectTypeOf(stderrBuffer.stdio[2]).toBe<string | undefined>();
const optionalFd1Buffer: {fd1?: true; all: false} = {all: false};
const fd1Buffer = await execa('unicorns', {buffer: optionalFd1Buffer});
expectTypeOf(fd1Buffer.stdout).toBe<string | undefined>();
const optionalFd2Buffer: {fd2?: true; all: false} = {all: false};
const fd2Buffer = execaSync('unicorns', {buffer: optionalFd2Buffer});
expectTypeOf(fd2Buffer.stderr).toBe<string | undefined>();

const aliasLines: {stdout?: false; fd1: true; all: false} = {fd1: true, all: false};
const aliasLinesResult = await execa('unicorns', {lines: aliasLines});
expectTypeOf(aliasLinesResult.stdout).toBe<string | string[]>();
const chainedLines: {stdout?: false; fd1?: false; all: true} = {all: true};
const chainedLinesResult = execaSync('unicorns', {lines: chainedLines});
expectTypeOf(chainedLinesResult.stdout).toBe<string | string[]>();
const boundLines = await execa({lines: optionalStdoutLines})`unicorns`;
expectTypeOf(boundLines.stdout).toBe<string | string[]>();
const boundBuffer = execaSync({buffer: optionalStderrBuffer})('unicorns');
expectTypeOf(boundBuffer.stderr).toBe<string | undefined>();
declare const linesError: ExecaError<{lines: typeof optionalStdoutLines}>;
expectTypeOf(linesError.stdout).toBe<string | string[]>();
declare const bufferError: ExecaSyncError<{buffer: typeof optionalStderrBuffer}>;
expectTypeOf(bufferError.stderr).toBe<string | undefined>();

// Required descriptor keys override aliases and `all`, even when their value is explicitly undefined.
const requiredLines = await execa('unicorns', {lines: {stdout: false, fd1: true, all: true}});
expectTypeOf(requiredLines.stdout).toBe<string>();
const requiredAliasLines = execaSync('unicorns', {lines: {fd2: false, all: true}});
expectTypeOf(requiredAliasLines.stderr).toBe<string>();
const undefinedLines = await execa('unicorns', {lines: {stdout: undefined, all: true}});
expectTypeOf(undefinedLines.stdout).toBe<string>();
const undefinedAliasLines = execaSync('unicorns', {lines: {fd2: undefined, all: true}});
expectTypeOf(undefinedAliasLines.stderr).toBe<string>();
const allLines = await execa('unicorns', {lines: {all: true}});
expectTypeOf(allLines.stdout).toBe<string[]>();
expectTypeOf(allLines.stderr).toBe<string[]>();
const requiredBuffer = await execa('unicorns', {buffer: {stdout: true, fd1: false, all: false}});
expectTypeOf(requiredBuffer.stdout).toBe<string>();
const undefinedBuffer = execaSync('unicorns', {buffer: {stderr: undefined, all: false}});
expectTypeOf(undefinedBuffer.stderr).toBe<string>();
const undefinedAliasBuffer = await execa('unicorns', {buffer: {fd1: undefined, all: false}});
expectTypeOf(undefinedAliasBuffer.stdout).toBe<string>();
const allBuffer = execaSync('unicorns', {buffer: {all: false}});
expectTypeOf(allBuffer.stdout).toBe<undefined>();
expectTypeOf(allBuffer.stderr).toBe<undefined>();
