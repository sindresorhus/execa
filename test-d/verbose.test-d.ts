import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type VerboseObject,
	type SyncVerboseObject,
	type Options,
	type SyncOptions,
	type Result,
	type SyncResult,
} from '../index.js';

await execa('unicorns', {verbose: 'none'});
execaSync('unicorns', {verbose: 'none'});
await execa('unicorns', {verbose: 'short'});
execaSync('unicorns', {verbose: 'short'});
await execa('unicorns', {verbose: 'full'});
execaSync('unicorns', {verbose: 'full'});
expectError(await execa('unicorns', {verbose: 'full' as string}));
expectError(execaSync('unicorns', {verbose: 'full' as string}));
expectError(await execa('unicorns', {verbose: 'other'}));
expectError(execaSync('unicorns', {verbose: 'other'}));

const voidVerbose = () => {
	console.log('');
};

await execa('unicorns', {verbose: voidVerbose});
execaSync('unicorns', {verbose: voidVerbose});
await execa('unicorns', {verbose: () => ''});
execaSync('unicorns', {verbose: () => ''});
await execa('unicorns', {verbose: voidVerbose as () => never});
execaSync('unicorns', {verbose: voidVerbose as () => never});
expectError(await execa('unicorns', {verbose: () => true}));
expectError(execaSync('unicorns', {verbose: () => true}));
expectError(await execa('unicorns', {verbose: () => '' as unknown}));
expectError(execaSync('unicorns', {verbose: () => '' as unknown}));

await execa('unicorns', {verbose: (verboseLine: string) => ''});
execaSync('unicorns', {verbose: (verboseLine: string) => ''});
await execa('unicorns', {verbose: (verboseLine: unknown) => ''});
execaSync('unicorns', {verbose: (verboseLine: unknown) => ''});
// eslint-disable-next-line unicorn/consistent-boolean-name -- `verboseLine` matches the real callback parameter name, mistyped on purpose to test the type error.
expectError(await execa('unicorns', {verbose: (verboseLine: boolean) => ''}));
// eslint-disable-next-line unicorn/consistent-boolean-name -- `verboseLine` matches the real callback parameter name, mistyped on purpose to test the type error.
expectError(execaSync('unicorns', {verbose: (verboseLine: boolean) => ''}));
expectError(await execa('unicorns', {verbose: (verboseLine: never) => ''}));
expectError(execaSync('unicorns', {verbose: (verboseLine: never) => ''}));

await execa('unicorns', {verbose: (verboseLine: string, verboseObject: object) => ''});
execaSync('unicorns', {verbose: (verboseLine: string, verboseObject: object) => ''});
await execa('unicorns', {verbose: (verboseLine: string, verboseObject: VerboseObject) => ''});
execaSync('unicorns', {verbose: (verboseLine: string, verboseObject: VerboseObject) => ''});
await execa('unicorns', {verbose: (verboseLine: string, verboseObject: unknown) => ''});
execaSync('unicorns', {verbose: (verboseLine: string, verboseObject: unknown) => ''});
expectError(await execa('unicorns', {verbose: (verboseLine: string, verboseObject: string) => ''}));
expectError(execaSync('unicorns', {verbose: (verboseLine: string, verboseObject: string) => ''}));
expectError(await execa('unicorns', {verbose: (verboseLine: string, verboseObject: never) => ''}));
expectError(execaSync('unicorns', {verbose: (verboseLine: string, verboseObject: never) => ''}));

expectError(await execa('unicorns', {verbose: (verboseLine: string, verboseObject: object, other: string) => ''}));
expectError(execaSync('unicorns', {verbose: (verboseLine: string, verboseObject: object, other: string) => ''}));

await execa('unicorns', {
	verbose(verboseLine: string, verboseObject: VerboseObject) {
		expectTypeOf(verboseObject.type).not.toBe<string>();
		expectTypeOf(verboseObject.type).toBeAssignableTo<string>();
		expectTypeOf(verboseObject.type).not.toBeAssignableTo<boolean>();
		expectTypeOf(verboseObject.message).toBe<string>();
		expectTypeOf(verboseObject.escapedCommand).toBe<string>();
		expectTypeOf(verboseObject.commandId).toBe<string>();
		expectTypeOf(verboseObject.timestamp).toBe<Date>();
		expectTypeOf(verboseObject.result).toBe<Result | undefined>();
		expectTypeOf(verboseObject.piped).toBe<boolean>();
		expectTypeOf(verboseObject.options).toBe<Options>();
		expectError(verboseObject.other);
	},
});
execaSync('unicorns', {
	verbose(verboseLine: string, verboseObject: SyncVerboseObject) {
		expectTypeOf(verboseObject.type).not.toBe<string>();
		expectTypeOf(verboseObject.type).toBeAssignableTo<string>();
		expectTypeOf(verboseObject.type).not.toBeAssignableTo<boolean>();
		expectTypeOf(verboseObject.message).toBe<string>();
		expectTypeOf(verboseObject.escapedCommand).toBe<string>();
		expectTypeOf(verboseObject.commandId).toBe<string>();
		expectTypeOf(verboseObject.timestamp).toBe<Date>();
		expectTypeOf(verboseObject.result).toBe<SyncResult | undefined>();
		expectTypeOf(verboseObject.piped).toBe<boolean>();
		expectTypeOf(verboseObject.options).toBe<SyncOptions>();
		expectError(verboseObject.other);
	},
});
