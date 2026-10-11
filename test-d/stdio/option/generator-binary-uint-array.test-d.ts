import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	type StdinOption,
	type StdinSyncOption,
	type StdoutStderrOption,
	type StdoutStderrSyncOption,
} from '../../../index.js';

// With `binary: true`, the `chunk` argument is an `Uint8Array`.
const uint8ArrayBinary = {
	* transform(chunk: Uint8Array) {
		yield chunk;
	},
	binary: true,
} as const;

await execa('unicorns', {stdin: uint8ArrayBinary});
execaSync('unicorns', {stdin: uint8ArrayBinary});
await execa('unicorns', {stdin: [uint8ArrayBinary]});
execaSync('unicorns', {stdin: [uint8ArrayBinary]});
await execa('unicorns', {stdout: uint8ArrayBinary});
execaSync('unicorns', {stdout: uint8ArrayBinary});
await execa('unicorns', {stderr: uint8ArrayBinary});
execaSync('unicorns', {stderr: uint8ArrayBinary});
await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', uint8ArrayBinary]});

expectTypeOf(uint8ArrayBinary).toBeAssignableTo<StdinOption>();
expectTypeOf(uint8ArrayBinary).toBeAssignableTo<StdinSyncOption>();
[uint8ArrayBinary] satisfies StdinOption;
[uint8ArrayBinary] satisfies StdinSyncOption;
expectTypeOf(uint8ArrayBinary).toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(uint8ArrayBinary).toBeAssignableTo<StdoutStderrSyncOption>();
[uint8ArrayBinary] satisfies StdoutStderrOption;
[uint8ArrayBinary] satisfies StdoutStderrSyncOption;

// `objectMode: true` takes precedence over `binary: true` for stdin, so the `chunk` argument is `unknown`.
const uint8ArrayBinaryObjectMode = {
	* transform(chunk: Uint8Array) {
		yield chunk;
	},
	binary: true,
	objectMode: true,
} as const;

const stdinObjectModeBinary = {
	* transform(chunk: unknown) {
		yield chunk;
	},
	binary: true,
	objectMode: true,
} as const;

expectError(await execa('unicorns', {stdin: uint8ArrayBinaryObjectMode}));
expectError(execaSync('unicorns', {stdin: uint8ArrayBinaryObjectMode}));
await execa('unicorns', {stdout: uint8ArrayBinaryObjectMode});
execaSync('unicorns', {stdout: uint8ArrayBinaryObjectMode});
await execa('unicorns', {stderr: uint8ArrayBinaryObjectMode});
execaSync('unicorns', {stderr: uint8ArrayBinaryObjectMode});

await execa('unicorns', {stdin: stdinObjectModeBinary});
execaSync('unicorns', {stdin: stdinObjectModeBinary});

expectTypeOf(uint8ArrayBinaryObjectMode).not.toBeAssignableTo<StdinOption>();
expectTypeOf(uint8ArrayBinaryObjectMode).not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf(uint8ArrayBinaryObjectMode).toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(uint8ArrayBinaryObjectMode).toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf(stdinObjectModeBinary).toBeAssignableTo<StdinOption>();
expectTypeOf(stdinObjectModeBinary).toBeAssignableTo<StdinSyncOption>();

const stdoutAnnotatedBinaryObjectMode: StdoutStderrOption = {
	* transform(chunk: Uint8Array) {
		yield chunk;
	},
	binary: true,
	objectMode: true,
};

expectTypeOf(stdoutAnnotatedBinaryObjectMode).toBeAssignableTo<StdoutStderrOption>();

// A `string` argument is invalid when `binary: true`.
const stringBinary = {
	* transform(line: string) {
		yield line;
	},
	binary: true,
} as const;

const stringBinaryObjectMode = {
	* transform(line: string) {
		yield line;
	},
	binary: true,
	objectMode: true,
} as const;

expectError(await execa('unicorns', {stdin: stringBinary}));
expectError(execaSync('unicorns', {stdin: stringBinary}));
expectError(await execa('unicorns', {stdin: [stringBinary]}));
expectError(execaSync('unicorns', {stdin: [stringBinary]}));
expectError(await execa('unicorns', {stdout: stringBinary}));
expectError(execaSync('unicorns', {stdout: stringBinary}));
expectError(await execa('unicorns', {stderr: stringBinary}));
expectError(execaSync('unicorns', {stderr: stringBinary}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', stringBinary]}));
expectError(await execa('unicorns', {stdout: stringBinaryObjectMode}));
expectError(execaSync('unicorns', {stdout: stringBinaryObjectMode}));
expectError(await execa('unicorns', {stderr: stringBinaryObjectMode}));
expectError(execaSync('unicorns', {stderr: stringBinaryObjectMode}));

expectTypeOf(stringBinary).not.toBeAssignableTo<StdinOption>();
expectTypeOf(stringBinary).not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf([stringBinary]).not.toBeAssignableTo<StdinOption>();
expectTypeOf([stringBinary]).not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf(stringBinary).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(stringBinary).not.toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf([stringBinary]).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf([stringBinary]).not.toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf(stringBinaryObjectMode).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(stringBinaryObjectMode).not.toBeAssignableTo<StdoutStderrSyncOption>();

// An `Uint8Array` argument is invalid without `binary: true`, since the `chunk` is then a `string`.
const uint8ArrayLine = {
	* transform(chunk: Uint8Array) {
		yield chunk;
	},
} as const;

expectError(await execa('unicorns', {stdin: uint8ArrayLine}));
expectError(execaSync('unicorns', {stdin: uint8ArrayLine}));
expectError(await execa('unicorns', {stdin: [uint8ArrayLine]}));
expectError(execaSync('unicorns', {stdin: [uint8ArrayLine]}));
expectError(await execa('unicorns', {stdout: uint8ArrayLine}));
expectError(execaSync('unicorns', {stdout: uint8ArrayLine}));
expectError(await execa('unicorns', {stderr: uint8ArrayLine}));
expectError(execaSync('unicorns', {stderr: uint8ArrayLine}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', uint8ArrayLine]}));

expectTypeOf(uint8ArrayLine).not.toBeAssignableTo<StdinOption>();
expectTypeOf(uint8ArrayLine).not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf([uint8ArrayLine]).not.toBeAssignableTo<StdinOption>();
expectTypeOf([uint8ArrayLine]).not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf(uint8ArrayLine).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(uint8ArrayLine).not.toBeAssignableTo<StdoutStderrSyncOption>();
expectTypeOf([uint8ArrayLine]).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf([uint8ArrayLine]).not.toBeAssignableTo<StdoutStderrSyncOption>();

// Binary encodings also make output transforms receive binary chunks.
await execa('unicorns', {encoding: 'buffer', stdin: uint8ArrayLine});
execaSync('unicorns', {encoding: 'buffer', stdin: uint8ArrayLine});
await execa('unicorns', {encoding: 'buffer', stdout: uint8ArrayLine});
execaSync('unicorns', {encoding: 'buffer', stdout: uint8ArrayLine});
await execa('unicorns', {encoding: 'buffer', stderr: uint8ArrayLine});
execaSync('unicorns', {encoding: 'buffer', stderr: uint8ArrayLine});
await execa('unicorns', {encoding: 'buffer', stdio: [uint8ArrayLine, uint8ArrayLine, uint8ArrayLine, uint8ArrayLine]});
execaSync('unicorns', {encoding: 'buffer', stdio: [uint8ArrayLine, uint8ArrayLine, uint8ArrayLine, uint8ArrayLine]});

// A bare generator function always receives string lines unless `encoding` is binary.
const uint8ArrayGenerator = function * (chunk: Uint8Array) {
	yield chunk;
};

expectError(await execa('unicorns', {stdin: uint8ArrayGenerator}));
expectError(execaSync('unicorns', {stdin: uint8ArrayGenerator}));
expectError(await execa('unicorns', {stdout: uint8ArrayGenerator}));
expectError(execaSync('unicorns', {stdout: uint8ArrayGenerator}));
expectError(await execa('unicorns', {stderr: uint8ArrayGenerator}));
expectError(execaSync('unicorns', {stderr: uint8ArrayGenerator}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', uint8ArrayGenerator]}));

expectTypeOf(uint8ArrayGenerator).not.toBeAssignableTo<StdinOption>();
expectTypeOf(uint8ArrayGenerator).not.toBeAssignableTo<StdinSyncOption>();
expectTypeOf(uint8ArrayGenerator).not.toBeAssignableTo<StdoutStderrOption>();
expectTypeOf(uint8ArrayGenerator).not.toBeAssignableTo<StdoutStderrSyncOption>();

await execa('unicorns', {encoding: 'buffer', stdin: uint8ArrayGenerator});
execaSync('unicorns', {encoding: 'buffer', stdin: uint8ArrayGenerator});
await execa('unicorns', {encoding: 'buffer', stdout: uint8ArrayGenerator});
execaSync('unicorns', {encoding: 'buffer', stdout: uint8ArrayGenerator});
await execa('unicorns', {encoding: 'buffer', stderr: uint8ArrayGenerator});
execaSync('unicorns', {encoding: 'buffer', stderr: uint8ArrayGenerator});
await execa('unicorns', {encoding: 'buffer', stdio: [uint8ArrayGenerator, uint8ArrayGenerator, uint8ArrayGenerator, uint8ArrayGenerator]});
execaSync('unicorns', {encoding: 'buffer', stdio: [uint8ArrayGenerator, uint8ArrayGenerator, uint8ArrayGenerator, uint8ArrayGenerator]});

// Conversely, a binary `encoding` makes the `chunk` a `Uint8Array`, so a `string` transform is rejected.
const stringGenerator = function * (line: string) {
	yield line;
};

expectError(await execa('unicorns', {encoding: 'buffer', stdin: stringGenerator}));
expectError(execaSync('unicorns', {encoding: 'buffer', stdin: stringGenerator}));
expectError(await execa('unicorns', {encoding: 'buffer', stdout: stringGenerator}));
expectError(execaSync('unicorns', {encoding: 'buffer', stdout: stringGenerator}));

// This applies to every binary `encoding`, not just `'buffer'`.
await execa('unicorns', {encoding: 'hex', stdout: uint8ArrayGenerator});
execaSync('unicorns', {encoding: 'hex', stdout: uint8ArrayGenerator});
await execa('unicorns', {encoding: 'base64', stdout: uint8ArrayGenerator});
execaSync('unicorns', {encoding: 'base64', stdout: uint8ArrayGenerator});
expectError(await execa('unicorns', {encoding: 'hex', stdout: stringGenerator}));
expectError(execaSync('unicorns', {encoding: 'hex', stdout: stringGenerator}));
