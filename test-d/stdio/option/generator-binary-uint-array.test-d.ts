import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
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

expectAssignable<StdinOption>(uint8ArrayBinary);
expectAssignable<StdinSyncOption>(uint8ArrayBinary);
expectAssignable<StdinOption>([uint8ArrayBinary]);
expectAssignable<StdinSyncOption>([uint8ArrayBinary]);
expectAssignable<StdoutStderrOption>(uint8ArrayBinary);
expectAssignable<StdoutStderrSyncOption>(uint8ArrayBinary);
expectAssignable<StdoutStderrOption>([uint8ArrayBinary]);
expectAssignable<StdoutStderrSyncOption>([uint8ArrayBinary]);

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

expectNotAssignable<StdinOption>(uint8ArrayBinaryObjectMode);
expectNotAssignable<StdinSyncOption>(uint8ArrayBinaryObjectMode);
expectAssignable<StdoutStderrOption>(uint8ArrayBinaryObjectMode);
expectAssignable<StdoutStderrSyncOption>(uint8ArrayBinaryObjectMode);
expectAssignable<StdinOption>(stdinObjectModeBinary);
expectAssignable<StdinSyncOption>(stdinObjectModeBinary);

const stdoutAnnotatedBinaryObjectMode: StdoutStderrOption = {
	* transform(chunk: Uint8Array) {
		yield chunk;
	},
	binary: true,
	objectMode: true,
};

expectAssignable<StdoutStderrOption>(stdoutAnnotatedBinaryObjectMode);

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

expectNotAssignable<StdinOption>(stringBinary);
expectNotAssignable<StdinSyncOption>(stringBinary);
expectNotAssignable<StdinOption>([stringBinary]);
expectNotAssignable<StdinSyncOption>([stringBinary]);
expectNotAssignable<StdoutStderrOption>(stringBinary);
expectNotAssignable<StdoutStderrSyncOption>(stringBinary);
expectNotAssignable<StdoutStderrOption>([stringBinary]);
expectNotAssignable<StdoutStderrSyncOption>([stringBinary]);
expectNotAssignable<StdoutStderrOption>(stringBinaryObjectMode);
expectNotAssignable<StdoutStderrSyncOption>(stringBinaryObjectMode);

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

expectNotAssignable<StdinOption>(uint8ArrayLine);
expectNotAssignable<StdinSyncOption>(uint8ArrayLine);
expectNotAssignable<StdinOption>([uint8ArrayLine]);
expectNotAssignable<StdinSyncOption>([uint8ArrayLine]);
expectNotAssignable<StdoutStderrOption>(uint8ArrayLine);
expectNotAssignable<StdoutStderrSyncOption>(uint8ArrayLine);
expectNotAssignable<StdoutStderrOption>([uint8ArrayLine]);
expectNotAssignable<StdoutStderrSyncOption>([uint8ArrayLine]);

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

expectNotAssignable<StdinOption>(uint8ArrayGenerator);
expectNotAssignable<StdinSyncOption>(uint8ArrayGenerator);
expectNotAssignable<StdoutStderrOption>(uint8ArrayGenerator);
expectNotAssignable<StdoutStderrSyncOption>(uint8ArrayGenerator);

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
