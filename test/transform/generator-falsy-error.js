import assert from 'node:assert/strict';
import test from 'node:test';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {throwingGenerator} from '../helpers/generator.js';
import {foobarString} from '../helpers/input.js';

setFixtureDirectory();

const testFalsyTransformError = async execaMethod => {
	const {failed} = await execaMethod('noop.js', {
		stdout: throwingGenerator(null)().transform,
		reject: false,
	});
	assert.equal(failed, true);
};

test('A synchronous generator throwing null makes the subprocess fail', () => testFalsyTransformError(execa));
test('A synchronous generator throwing null makes the subprocess fail, sync', () => testFalsyTransformError(execaSync));

const testWrappedGeneratorError = async (reason, execaMethod, {direction, phase, generator = throwingGenerator(reason)().transform}) => {
	const result = await execaMethod(direction === 'stdin' ? 'stdin.js' : 'noop.js', {
		[direction]: {[phase]: generator},
		...(direction === 'stdin' && {input: foobarString}),
		reject: false,
	});
	assert.equal(result.failed, true);
	assert.ok(result.cause instanceof Error);
	assert.equal(result.code, 'ERR_FALSY_VALUE_REJECTION');
	assert.equal(result.cause.reason, reason);
	assert.equal(Object.hasOwn(result.cause, 'reason'), true);
};

const falsyReasons = new Map([
	['null', null],
	['undefined', undefined],
	['false', false],
	['zero', 0],
	['negative zero', -0],
	['zero bigint', 0n],
	['empty string', ''],
	['NaN', NaN],
]);

for (const [name, reason] of falsyReasons) {
	for (const phase of ['transform', 'final']) {
		for (const direction of ['stdin', 'stdout']) {
			test(`A synchronous ${direction} ${phase} throwing ${name} reports the original reason`, () => testWrappedGeneratorError(reason, execa, {direction, phase}));
			test(`A synchronous ${direction} ${phase} throwing ${name} reports the original reason, sync`, () => testWrappedGeneratorError(reason, execaSync, {direction, phase}));
		}
	}
}

// eslint-disable-next-line require-yield
const throwingAsyncGenerator = reason => async function * () {
	throw reason;
};

for (const [name, reason] of falsyReasons) {
	for (const direction of ['stdin', 'stdout']) {
		for (const phase of ['transform', 'final']) {
			test(`An asynchronous ${direction} ${phase} throwing ${name} reports the original reason`, () => testWrappedGeneratorError(reason, execa, {direction, phase, generator: throwingAsyncGenerator(reason)}));
		}
	}
}

const testTruthyGeneratorError = async (reason, execaMethod, direction, phase) => {
	const {failed, cause} = await execaMethod(direction === 'stdin' ? 'stdin.js' : 'noop.js', {
		[direction]: {[phase]: throwingGenerator(reason)().transform},
		...(direction === 'stdin' && {input: foobarString}),
		reject: false,
	});
	assert.equal(failed, true);
	assert.equal(cause, reason);
};

for (const [name, reason] of new Map([['Error', new Error('Generator failed')], ['string', 'Generator failed'], ['object', {message: 'Generator failed'}]])) {
	for (const phase of ['transform', 'final']) {
		for (const direction of ['stdin', 'stdout']) {
			test(`A synchronous ${direction} ${phase} keeps a truthy ${name} cause`, () => testTruthyGeneratorError(reason, execa, direction, phase));
			test(`A synchronous ${direction} ${phase} keeps a truthy ${name} cause, sync`, () => testTruthyGeneratorError(reason, execaSync, direction, phase));
		}
	}
}
