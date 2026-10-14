import assert from 'node:assert/strict';
import {once} from 'node:events';
import {setTimeout} from 'node:timers/promises';
import {readFile, writeFile, rm} from 'node:fs/promises';
import test from 'node:test';
import tempfile from 'tempfile';
import {assertThrows, assertRejects, assertLike} from '../helpers/assert.js';
import {execa, execaSync} from '../../index.js';
import {foobarString} from '../helpers/input.js';
import {
	noopGenerator,
	infiniteGenerator,
	convertTransformToFinal,
	throwingGenerator,
} from '../helpers/generator.js';
import {generatorsMap} from '../helpers/map.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {getEarlyErrorSubprocess, expectedEarlyError} from '../helpers/early-error.js';
import {getStdio} from '../helpers/stdio.js';

setFixtureDirectory();

const assertProcessError = async (type, execaMethod, getSubprocess) => {
	const cause = new Error(foobarString);
	const transform = generatorsMap[type].throwing(cause)();
	const error = execaMethod === execa
		? await assertRejects(getSubprocess(transform))
		: assertThrows(() => {
			getSubprocess(transform);
		});
	assert.equal(error.cause, cause);
};

const testThrowingGenerator = async (type, final, execaMethod) => {
	await assertProcessError(type, execaMethod, transform => execaMethod('noop.js', {
		stdout: convertTransformToFinal(transform, final),
	}));
};

test('Generators "transform" errors make subprocess fail', () => testThrowingGenerator('generator', false, execa));
test('Generators "final" errors make subprocess fail', () => testThrowingGenerator('generator', true, execa));
test('Generators "transform" errors make subprocess fail, sync', () => testThrowingGenerator('generator', false, execaSync));
test('Generators "final" errors make subprocess fail, sync', () => testThrowingGenerator('generator', true, execaSync));
test('Duplexes "transform" errors make subprocess fail', () => testThrowingGenerator('duplex', false, execa));
test('WebTransform "transform" errors make subprocess fail', () => testThrowingGenerator('webTransform', false, execa));

test('Failed synchronous output transforms do not expose untransformed data', () => {
	const secret = 'private-token';
	const cause = new Error('Redaction failed');
	const error = assertThrows(() => {
		execaSync('environment.js', {
			env: {FOO: secret, BAR: 'fail'},
			* stdout(line) {
				if (line === 'fail') {
					throw cause;
				}

				yield '[REDACTED]';
			},
			all: true,
		});
	});
	assert.equal(error.cause, cause);
	assert.equal(error.stdout, '');
	assert.equal(error.stdio[1], '');
	assert.equal(error.all, '');
	assert.equal(error.message.includes(secret), false);
});

const secretOutputScript = 'const fs = require("node:fs"); const descriptor = Number(process.env.OUTPUT_FD); fs.writeSync(descriptor, process.env.SECRET + "\\nfail\\n"); fs.writeSync(descriptor === 1 ? 2 : 1, "safe\\n");';

const testSyncTransformDiscard = (fdNumber, options = {}) => {
	const {objectMode, ...subprocessOptions} = options;
	const secret = 'private-token';
	const cause = new Error('Redaction failed');
	const loggedLines = [];
	const result = execaSync('node', ['-e', secretOutputScript], {
		...getStdio(fdNumber, {
			objectMode,
			* transform() {
				yield objectMode ? {redacted: true} : '[REDACTED]';
				throw cause;
			},
		}),
		...subprocessOptions,
		env: {SECRET: secret, OUTPUT_FD: `${fdNumber}`},
		all: true,
		reject: false,
		verbose(line) {
			loggedLines.push(line);
		},
	});
	const expectedOutput = objectMode || options.lines ? [] : (options.encoding === 'buffer' ? new Uint8Array() : '');
	assert.equal(result.failed, true);
	assert.equal(result.cause, cause);
	assert.deepEqual(result.stdio[fdNumber], expectedOutput);
	const safeOutput = options.lines ? ['safe'] : (options.encoding === 'buffer' ? new TextEncoder().encode('safe') : 'safe');
	assert.deepEqual(result.stdio[fdNumber === 1 ? 2 : 1], safeOutput);
	assert.equal(result.message.includes(secret), false);
	assert.equal(loggedLines.some(line => line.includes(secret)), false);
};

test('Failed synchronous stderr transforms discard raw text and preserve stdout', () => testSyncTransformDiscard(2));
test('Failed synchronous fd3 transforms discard raw text and preserve stdout', () => testSyncTransformDiscard(3));
test('Failed synchronous binary transforms keep empty Uint8Array output', () => testSyncTransformDiscard(1, {encoding: 'buffer'}));
test('Failed synchronous object-mode transforms keep empty arrays', () => testSyncTransformDiscard(2, {objectMode: true}));
test('Failed synchronous transforms with lines keep empty arrays', () => testSyncTransformDiscard(3, {lines: true}));

test('Failed synchronous final transforms do not expose raw output', () => {
	const secret = 'private-token';
	const cause = new Error('Final failed');
	const result = execaSync('environment.js', {
		env: {FOO: secret, BAR: 'last'},
		stdout: {
			* transform() {
				yield '[REDACTED]';
			},
			final: throwingGenerator(cause)().transform,
		},
		reject: false,
	});
	assert.equal(result.failed, true);
	assert.equal(result.cause, cause);
	assert.equal(result.stdout, '');
	assert.equal(result.message.includes(secret), false);
});

test('Failed synchronous chained transforms do not expose raw output', () => {
	const secret = 'private-token';
	const cause = new Error('Chained transform failed');
	const result = execaSync('environment.js', {
		env: {FOO: secret, BAR: 'last'},
		stdout: [{
			* transform() {
				yield '[REDACTED]';
			},
		}, throwingGenerator(cause)()],
		reject: false,
	});
	assert.equal(result.failed, true);
	assert.equal(result.cause, cause);
	assert.equal(result.stdout, '');
	assert.equal(result.message.includes(secret), false);
});

test('A failed synchronous transform leaves its output file unchanged', async () => {
	const filePath = tempfile();
	await writeFile(filePath, 'keep existing output');
	try {
		const cause = new Error('Transform failed');
		const error = assertThrows(() => {
			execaSync('environment.js', {
				env: {FOO: 'private-token', BAR: 'last'},
				stdout: [throwingGenerator(cause)(), {file: filePath}],
			});
		});
		assert.equal(error.cause, cause);
		assert.equal(await readFile(filePath, 'utf8'), 'keep existing output');
	} finally {
		await rm(filePath);
	}
});

const testSingleErrorOutput = async (type, execaMethod) => {
	await assertProcessError(type, execaMethod, transform => execaMethod('noop.js', {
		stdout: [
			generatorsMap[type].noop(false),
			transform,
			generatorsMap[type].noop(false),
		],
	}));
};

test('Generators errors make subprocess fail even when other output generators do not throw', () => testSingleErrorOutput('generator', execa));
test('Generators errors make subprocess fail even when other output generators do not throw, sync', () => testSingleErrorOutput('generator', execaSync));
test('Duplexes errors make subprocess fail even when other output generators do not throw', () => testSingleErrorOutput('duplex', execa));
test('WebTransform errors make subprocess fail even when other output generators do not throw', () => testSingleErrorOutput('webTransform', execa));

const testSingleErrorInput = async (type, execaMethod) => {
	await assertProcessError(type, execaMethod, transform => execaMethod('stdin.js', {
		stdin: [
			['foobar\n'],
			generatorsMap[type].noop(false),
			transform,
			generatorsMap[type].noop(false),
		],
	}));
};

test('Generators errors make subprocess fail even when other input generators do not throw', () => testSingleErrorInput('generator', execa));
test('Generators errors make subprocess fail even when other input generators do not throw, sync', () => testSingleErrorInput('generator', execaSync));
test('Duplexes errors make subprocess fail even when other input generators do not throw', () => testSingleErrorInput('duplex', execa));
test('WebTransform errors make subprocess fail even when other input generators do not throw', () => testSingleErrorInput('webTransform', execa));

const testGeneratorCancel = async error => {
	const subprocess = execa('noop.js', {stdout: infiniteGenerator()});
	await once(subprocess.stdout, 'data');
	subprocess.stdout.destroy(error);
	await (error === undefined ? assert.doesNotReject(subprocess) : assertRejects(subprocess));
};

test('Running generators are canceled on subprocess abort', () => testGeneratorCancel(undefined));
test('Running generators are canceled on subprocess error', () => testGeneratorCancel(new Error('test')));

const testGeneratorDestroy = async transform => {
	const subprocess = execa('forever.js', {stdout: transform});
	const cause = new Error('test');
	subprocess.stdout.destroy(cause);
	subprocess.kill();
	assertLike(await assertRejects(subprocess), {cause});
};

test('Generators are destroyed on subprocess error, sync', () => testGeneratorDestroy(noopGenerator(false)));
test('Generators are destroyed on subprocess error, async', () => testGeneratorDestroy(infiniteGenerator()));

test('Generators are destroyed on early subprocess exit', async () => {
	const error = await assertRejects(getEarlyErrorSubprocess({stdout: infiniteGenerator()}));
	assertLike(error, expectedEarlyError);
});

// A transform failing on one file descriptor must not prevent the other ones from being redirected to their target
const testTransformErrorOtherFd = async execaMethod => {
	const filePath = tempfile();
	const cause = new Error(foobarString);
	const runSubprocess = () => execaMethod('noop-both.js', [foobarString], {
		stdout: throwingGenerator(cause)(),
		stderr: {file: filePath},
	});

	await (execaMethod === execa
		? assertRejects(runSubprocess())
		: assertThrows(runSubprocess));
	assert.equal(await readFile(filePath, 'utf8'), `${foobarString}\n`);
	await rm(filePath);
};

test('Transform errors on stdout do not skip the stderr file', () => testTransformErrorOtherFd(execa));
test('Transform errors on stdout do not skip the stderr file, sync', () => testTransformErrorOtherFd(execaSync));

// Many signal-aware Node.js APIs reject with an `AbortError`, which must not be mistaken for the stream being aborted
const testAbortErrorTransform = async abortedLine => {
	const controller = new AbortController();
	const {failed, cause} = await execa('noop-fd.js', ['1', 'a\nb\nc'], {
		async * stdout(line) {
			if (line === abortedLine) {
				controller.abort();
			}

			await setTimeout(0, undefined, {signal: controller.signal});
			yield line;
		},
		reject: false,
	});
	assert.equal(failed, true);
	assert.equal(cause.code, 'ABORT_ERR');
};

test('Output generators throwing an AbortError make the subprocess fail', () => testAbortErrorTransform('a'));
test('Output generators throwing an AbortError after some output make the subprocess fail', () => testAbortErrorTransform('b'));

const abortErrorGenerator = async function * (line) {
	await setTimeout(0, undefined, {signal: AbortSignal.abort()});
	yield line;
};

const testAbortErrorConversion = async consumeOutput => {
	const subprocess = execa('noop-fd.js', ['1', foobarString], {stdout: abortErrorGenerator});
	const error = await assertRejects(consumeOutput(subprocess));
	assert.equal(error.cause.code, 'ABORT_ERR');
	await assertRejects(subprocess);
};

test('Output generators throwing an AbortError make the subprocess fail, with .readable()', () => testAbortErrorConversion(subprocess => subprocess.readable().toArray()));
test('Output generators throwing an AbortError make the subprocess fail, with .duplex()', () => testAbortErrorConversion(subprocess => subprocess.duplex().toArray()));
test('Output generators throwing an AbortError make the subprocess fail, with .iterable()', () => testAbortErrorConversion(subprocess => Array.fromAsync(subprocess.iterable())));
test('Output generators throwing an AbortError make the subprocess fail, with .readableStream()', () => testAbortErrorConversion(subprocess => Array.fromAsync(subprocess.readableStream())));

test('Input generators throwing an AbortError make the subprocess fail', async () => {
	const {failed, cause} = await execa('stdin.js', {stdin: abortErrorGenerator, input: foobarString, reject: false});
	assert.equal(failed, true);
	assert.equal(cause.code, 'ABORT_ERR');
});
