import {expectTypeOf} from 'nz';
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

expectTypeOf(widenedBinary).toBeAssignableTo<StdinOption>();
expectTypeOf(widenedBinary).toBeAssignableTo<StdinSyncOption>();
expectTypeOf(widenedBinary).toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(widenedBinary).toBeAssignableTo<StdoutStderrSyncOption>();

const widenedObjectMode = {
	* transform(line: unknown) {
		yield line;
	},
	objectMode: true,
};

expectTypeOf(widenedObjectMode).toBeAssignableTo<StdinOption>();
expectTypeOf(widenedObjectMode).toBeAssignableTo<StdinSyncOption>();
expectTypeOf(widenedObjectMode).toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(widenedObjectMode).toBeAssignableTo<StdoutStderrSyncOption>();

const widenedBinaryString = {
	* transform(line: string) {
		yield line;
	},
	binary: true,
};

expectTypeOf(widenedBinaryString).not.toBeAssignableTo<StdinOption>();
expectTypeOf(widenedBinaryString).not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf(widenedBinaryString).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(widenedBinaryString).not.toBeAssignableTo<StdoutStderrSyncOption>();
