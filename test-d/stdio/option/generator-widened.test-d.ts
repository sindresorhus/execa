import {expectAssignable, expectNotAssignable} from 'tsd';
import {
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

// Without `as const`, `binary`/`objectMode` widen to `boolean`. Since the transform mode is unknown at compile time, the `chunk` argument must be `unknown`.

const widenedBinary = {
	* transform(line: unknown) {
		yield line;
	},
	binary: true,
};

expectAssignable<StdinOption>(widenedBinary);
expectAssignable<StdinSyncOption>(widenedBinary);
expectAssignable<StdoutStderrOption>(widenedBinary);
expectAssignable<StdoutStderrSyncOption>(widenedBinary);

const widenedObjectMode = {
	* transform(line: unknown) {
		yield line;
	},
	objectMode: true,
};

expectAssignable<StdinOption>(widenedObjectMode);
expectAssignable<StdinSyncOption>(widenedObjectMode);
expectAssignable<StdoutStderrOption>(widenedObjectMode);
expectAssignable<StdoutStderrSyncOption>(widenedObjectMode);

const widenedBinaryString = {
	* transform(line: string) {
		yield line;
	},
	binary: true,
};

expectNotAssignable<StdinOption>(widenedBinaryString);
expectNotAssignable<StdinSyncOption>(widenedBinaryString);
expectNotAssignable<StdoutStderrOption>(widenedBinaryString);
expectNotAssignable<StdoutStderrSyncOption>(widenedBinaryString);
