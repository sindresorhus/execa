import {expectTypeOf} from 'nz';
import {
	execa,
	execaSync,
	execaNode,
	$,
	type Result,
	type SyncResult,
	type ExecaError,
	type ExecaSyncError,
} from '../../index.js';

declare const options: {lines: true} | {encoding: 'buffer'};
const result = await execa('unicorns', options);
expectTypeOf(result.stdout).toBe<string[] | Uint8Array>();
expectTypeOf(execaSync('unicorns', options).stdout).toBe<string[] | Uint8Array>();
expectTypeOf<Result<typeof options>['stdout']>().toBe<string[] | Uint8Array>();
expectTypeOf(result.stderr).toBe<string[] | Uint8Array>();
expectTypeOf(result.stdio[1]).toBe<string[] | Uint8Array>();
expectTypeOf(result.stdio[2]).toBe<string[] | Uint8Array>();
expectTypeOf<SyncResult<typeof options>['stderr']>().toBe<string[] | Uint8Array>();
expectTypeOf<ExecaError<typeof options>['stdout']>().toBe<string[] | Uint8Array>();
expectTypeOf<ExecaSyncError<typeof options>['stderr']>().toBe<string[] | Uint8Array>();

const templateResult = await execa(options)`unicorns`;
expectTypeOf(templateResult.stdout).toBe<string[] | Uint8Array>();
expectTypeOf(execaSync(options)`unicorns`.stdout).toBe<string[] | Uint8Array>();
const nodeResult = await execaNode('unicorns', [], options);
expectTypeOf(nodeResult.stderr).toBe<string[] | Uint8Array>();
const scriptResult = await $(options)`unicorns`;
expectTypeOf(scriptResult.stdout).toBe<string[] | Uint8Array>();
expectTypeOf($.sync(options)`unicorns`.stdout).toBe<string[] | Uint8Array>();

declare const allOptions: {all: true; lines: true} | {all: true; encoding: 'buffer'};
const allResult = await execa('unicorns', allOptions);
expectTypeOf(allResult.all).toBe<string[] | Uint8Array>();
expectTypeOf(execaSync('unicorns', allOptions).all).toBe<string[] | Uint8Array>();
expectTypeOf<ExecaError<typeof allOptions>['all']>().toBe<string[] | Uint8Array>();

declare const optionalAllOptions: {all: true; lines: true} | {encoding: 'buffer'};
expectTypeOf<Result<typeof optionalAllOptions>['all']>().toBe<string[] | undefined>();

declare const bufferOptions: {all: true; buffer: false; lines: true} | {all: true; encoding: 'buffer'};
expectTypeOf<Result<typeof bufferOptions>['stdout']>().toBe<Uint8Array | undefined>();
expectTypeOf<Result<typeof bufferOptions>['all']>().toBe<Uint8Array | undefined>();

declare const descriptorOptions: {lines: {stdout: true}} | {encoding: 'buffer'; stderr: 'ignore'};
const descriptorResult = await execa('unicorns', descriptorOptions);
expectTypeOf(descriptorResult.stdout).toBe<string[] | Uint8Array>();
expectTypeOf(descriptorResult.stderr).toBe<string | undefined>();
expectTypeOf(descriptorResult.stdio[2]).toBe<string | undefined>();

declare const objectOptions: {all: true; stdout: {objectMode: true; transform: (chunk: string) => Generator<object>}} | {all: true; buffer: false};
expectTypeOf<Result<typeof objectOptions>['stdout']>().toBe<unknown[] | undefined>();
expectTypeOf<Result<typeof objectOptions>['all']>().toBe<unknown[] | undefined>();

declare const extraFdOptions: {stdio: ['pipe', 'pipe', 'pipe', 'pipe']; lines: {fd3: true}} | {stdio: ['pipe', 'pipe', 'pipe', 'pipe']; encoding: 'buffer'};
expectTypeOf<Result<typeof extraFdOptions>['stdio'][3]>().toBe<string[] | Uint8Array>();

// Unions with shared option keys and ordinary defaults already preserve their result modes.
declare const linesOptions: {lines: true} | {lines: false};
expectTypeOf<Result<typeof linesOptions>['stdout']>().toBe<string | string[]>();
declare const encodingOptions: {encoding: 'utf8'} | {encoding: 'buffer'};
expectTypeOf<SyncResult<typeof encodingOptions>['stdout']>().toBe<string | Uint8Array>();
declare const ignoredOptions: {stdout: 'ignore'} | {stdout: 'pipe'};
expectTypeOf<Result<typeof ignoredOptions>['stdout']>().toBe<string | undefined>();
declare const plainOptions: {input: string} | {timeout: number};
expectTypeOf<Result<typeof plainOptions>['stdout']>().toBe<string>();
