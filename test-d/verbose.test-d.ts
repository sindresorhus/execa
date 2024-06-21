import {
	expectType,
	expectNotType,
	expectAssignable,
	expectNotAssignable,
	expectError,
} from 'tsd';
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
expectError(await execa('unicorns', {verbose: (verboseLine: boolean) => ''}));
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
		expectNotType<string>(verboseObject.type);
		expectAssignable<string>(verboseObject.type);
		expectNotAssignable<boolean>(verboseObject.type);
		expectType<string>(verboseObject.message);
		expectType<string>(verboseObject.escapedCommand);
		expectType<string>(verboseObject.commandId);
		expectType<Date>(verboseObject.timestamp);
		expectType<Result | undefined>(verboseObject.result);
		expectType<boolean>(verboseObject.piped);
		expectType<Options>(verboseObject.options);
		expectError(verboseObject.other);
	},
});
execaSync('unicorns', {
	verbose(verboseLine: string, verboseObject: SyncVerboseObject) {
		expectNotType<string>(verboseObject.type);
		expectAssignable<string>(verboseObject.type);
		expectNotAssignable<boolean>(verboseObject.type);
		expectType<string>(verboseObject.message);
		expectType<string>(verboseObject.escapedCommand);
		expectType<string>(verboseObject.commandId);
		expectType<Date>(verboseObject.timestamp);
		expectType<SyncResult | undefined>(verboseObject.result);
		expectType<boolean>(verboseObject.piped);
		expectType<SyncOptions>(verboseObject.options);
		expectError(verboseObject.other);
	},
});
