import {expectTypeOf} from 'nz';
import {
	execa,
	execaSync,
	execaNode,
	$,
	type Options,
	type SyncOptions,
	type ResultPromise,
	type SyncResult,
} from '../../index.js';

const subprocessResult1 = await execa({lines: true})('unicorns', {lines: false});
expectTypeOf(subprocessResult1.stdout).toBe<string>();
expectTypeOf(execaSync({lines: true})({lines: false})`unicorns`.stdout).toBe<string>();

const subprocessResult2 = await execa({lines: true})('unicorns', [], {lines: false});
expectTypeOf(subprocessResult2.stdout).toBe<string>();
const subprocessResult3 = await execa({lines: true})({lines: false})`unicorns`;
expectTypeOf(subprocessResult3.stdout).toBe<string>();
const subprocessResult4 = await execaNode({lines: true})('unicorns', {lines: false});
expectTypeOf(subprocessResult4.stdout).toBe<string>();
const subprocessResult5 = await execaNode({lines: true})('unicorns', [], {lines: false});
expectTypeOf(subprocessResult5.stdout).toBe<string>();
const subprocessResult6 = await execaNode({lines: true})({lines: false})`unicorns`;
expectTypeOf(subprocessResult6.stdout).toBe<string>();
const subprocessResult7 = await $({lines: true})('unicorns', {lines: false});
expectTypeOf(subprocessResult7.stdout).toBe<string>();
const subprocessResult8 = await $({lines: true})('unicorns', [], {lines: false});
expectTypeOf(subprocessResult8.stdout).toBe<string>();
const subprocessResult9 = await $({lines: true})({lines: false})`unicorns`;
expectTypeOf(subprocessResult9.stdout).toBe<string>();
expectTypeOf(execaSync({lines: true})('unicorns', {lines: false}).stdout).toBe<string>();
expectTypeOf(execaSync({lines: true})('unicorns', [], {lines: false}).stdout).toBe<string>();
expectTypeOf($.sync({lines: true})('unicorns', {lines: false}).stdout).toBe<string>();
expectTypeOf($.sync({lines: true})('unicorns', [], {lines: false}).stdout).toBe<string>();
expectTypeOf($.sync({lines: true})({lines: false})`unicorns`.stdout).toBe<string>();
expectTypeOf($({lines: true}).sync({lines: false})`unicorns`.stdout).toBe<string>();

const subprocessResult10 = await execa({lines: false})('unicorns', {lines: true});
expectTypeOf(subprocessResult10.stdout).toBe<string[]>();
const subprocessResult11 = await execa({encoding: 'buffer'})('unicorns', {encoding: 'utf8'});
expectTypeOf(subprocessResult11.stdout).toBe<string>();
const subprocessResult12 = await execa({encoding: 'utf8'})({encoding: 'buffer'})`unicorns`;
expectTypeOf(subprocessResult12.stdout).toBe<Uint8Array>();
const subprocessResult13 = await execa({buffer: false})('unicorns', {buffer: true});
expectTypeOf(subprocessResult13.stdout).toBe<string>();
const subprocessResult14 = await execa({all: true})('unicorns', {all: false});
expectTypeOf(subprocessResult14.all).toBe<undefined>();
const subprocessResult15 = await execa({stdout: 'ignore'})('unicorns', {stdout: 'pipe'});
expectTypeOf(subprocessResult15.stdout).toBe<string>();

const deepLinesResult = await execa({lines: {stdout: true, stderr: true}})('unicorns', {lines: {stdout: false}});
expectTypeOf(deepLinesResult.stdout).toBe<string>();
expectTypeOf(deepLinesResult.stderr).toBe<string[]>();
const scalarLinesResult = await execa({lines: {stdout: true, stderr: true}})('unicorns', {lines: false});
expectTypeOf(scalarLinesResult.stdout).toBe<string>();
expectTypeOf(scalarLinesResult.stderr).toBe<string>();
const objectLinesResult = await execa({lines: true})('unicorns', {lines: {stdout: false}});
expectTypeOf(objectLinesResult.stdout).toBe<string>();
expectTypeOf(objectLinesResult.stderr).toBe<string>();
const deepBufferResult = await execa({buffer: {stdout: false, stderr: false}})('unicorns', {buffer: {stdout: true}});
expectTypeOf(deepBufferResult.stdout).toBe<string>();
expectTypeOf(deepBufferResult.stderr).toBe<undefined>();
const subprocessResult16 = await execa({lines: true})('unicorns', {lines: undefined});
expectTypeOf(subprocessResult16.stdout).toBe<string>();
const subprocessResult17 = await execa({encoding: 'buffer'})({encoding: undefined})`unicorns`;
expectTypeOf(subprocessResult17.stdout).toBe<string>();
const resetFdResult = await execa({lines: {stdout: true, stderr: true}})('unicorns', {lines: {stdout: undefined}});
expectTypeOf(resetFdResult.stdout).toBe<string>();
expectTypeOf(resetFdResult.stderr).toBe<string[]>();

const source = execa('unicorns');
const subprocessResult18 = await source.pipe(execa({lines: true})('unicorns', {lines: false}));
expectTypeOf(subprocessResult18.stdout).toBe<string>();
const subprocessResult19 = await source.pipe(execaNode({lines: true})('unicorns', {lines: false}));
expectTypeOf(subprocessResult19.stdout).toBe<string>();
const subprocessResult20 = await source.pipe($({lines: true})({lines: false})`unicorns`);
expectTypeOf(subprocessResult20.stdout).toBe<string>();

// Defaults, non-conflicting options and disjoint descriptor settings are preserved.
const subprocessResult21 = await execa({lines: true})({})`unicorns`;
expectTypeOf(subprocessResult21.stdout).toBe<string[]>();
const subprocessResult22 = await execa({lines: true})('unicorns', {all: true});
expectTypeOf(subprocessResult22.stdout).toBe<string[]>();
const disjointLinesResult = await execa({lines: {stdout: true}})('unicorns', {lines: {stderr: true}});
expectTypeOf(disjointLinesResult.stdout).toBe<string[]>();
expectTypeOf(disjointLinesResult.stderr).toBe<string[]>();
const subprocessResult23 = await execa({lines: true})('unicorns', {lines: true});
expectTypeOf(subprocessResult23.stdout).toBe<string[]>();
const subprocessResult24 = await execa({buffer: true})('unicorns', {buffer: false});
expectTypeOf(subprocessResult24.stdout).toBe<undefined>();
const subprocessResult25 = await execa({all: false})('unicorns', {all: true});
expectTypeOf(subprocessResult25.all).toBe<string>();
const subprocessResult26 = await source.pipe('unicorns', {lines: false});
expectTypeOf(subprocessResult26.stdout).toBe<string>();
const subprocessResult27 = await source.pipe({lines: false})`unicorns`;
expectTypeOf(subprocessResult27.stdout).toBe<string>();

const wideOptions: Options = {};
const wideSyncOptions: SyncOptions = {};
expectTypeOf(execa({lines: true})(wideOptions)('unicorns')).toBeAssignableTo<ResultPromise>();
expectTypeOf(execaNode({lines: true})('unicorns', wideOptions)).toBeAssignableTo<ResultPromise>();
expectTypeOf($({lines: true})('unicorns', wideOptions)).toBeAssignableTo<ResultPromise>();
expectTypeOf(execaSync({lines: true})('unicorns', wideSyncOptions)).toBeAssignableTo<SyncResult>();
expectTypeOf($.sync({lines: true})(wideSyncOptions)`unicorns`).toBeAssignableTo<SyncResult>();

const optionalLines: {lines?: false} = {};
const subprocessResult28 = await execa({lines: true})('unicorns', optionalLines);
expectTypeOf(subprocessResult28.stdout).toBe<string | string[]>();

const optionalEncoding: {encoding?: 'utf8'} = {};
const optionalEncodingResult = await execa({encoding: 'buffer'})('unicorns', optionalEncoding);
expectTypeOf(optionalEncodingResult.stdout).toBe<Uint8Array | string>();
expectTypeOf(execa({encoding: 'buffer'})('unicorns', optionalEncoding)).toBeAssignableTo<ResultPromise>();
expectTypeOf(execaSync({encoding: 'buffer'})('unicorns', optionalEncoding).stdout).toBe<Uint8Array | string>();
expectTypeOf(execaSync({encoding: 'buffer'})('unicorns', optionalEncoding)).toBeAssignableTo<SyncResult>();
const optionalFdLines: {lines: {stdout?: false}} = {lines: {}};
const subprocessResult29 = await execa({lines: {stdout: true}})('unicorns', optionalFdLines);
expectTypeOf(subprocessResult29.stdout).toBe<string | string[]>();
expectTypeOf($.s({lines: true})({lines: false})`unicorns`.stdout).toBe<string>();

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface InterfaceLines {
	stdout: false;
	[key: `fd${number}`]: boolean | undefined;
}
const interfaceLines: InterfaceLines = {stdout: false};
const interfaceResult = await execa({lines: {stdout: true, stderr: true}})('unicorns', {lines: interfaceLines});
expectTypeOf(interfaceResult.stdout).toBe<string>();
expectTypeOf(interfaceResult.stderr).toBe<string[]>();

declare const unionOptions: {lines: false} | {all: true};
const unionResult = await execa({lines: true})('unicorns', unionOptions);
expectTypeOf(unionResult.stdout).toBe<string | string[]>();
expectTypeOf(execaSync({lines: true})(unionOptions)('unicorns').stdout).toBe<string | string[]>();
