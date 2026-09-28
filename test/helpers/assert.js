import assert from 'node:assert/strict';
import isPlainObject from 'is-plain-obj';

/*
`t.throws()` and `t.throwsAsync()` returned the thrown error, which most tests assert on.
`assert.throws()` and `assert.rejects()` do not, so the error is captured with their validation function instead.
*/

const checkExpectation = (error, expectation) => {
	if (expectation === undefined) {
		return;
	}

	// A constructor or a RegExp has no own properties to compare, so it would always pass
	if (!isPlainObject(expectation)) {
		throw new TypeError('The expectation must be a plain object like `{message}` or `{instanceOf}`.');
	}

	// `assert.throws()` compares every own property of the expectation against the error, but it does not
	// know about `instanceOf`, which AVA validated. It is therefore checked separately.
	const {instanceOf, ...properties} = expectation;
	if (instanceOf !== undefined) {
		assert.ok(error instanceof instanceOf, `The error is not an instance of ${instanceOf.name}`);
	}

	if (Object.keys(properties).length > 0) {
		// Rethrowing checks the expectation with the same `message`, `code` and constructor logic.
		assert.throws(() => {
			throw error;
		}, properties);
	}
};

export const assertThrows = (synchronousFunction, expectation) => {
	let error;
	assert.throws(synchronousFunction, thrownError => {
		error = thrownError;
		return true;
	});

	checkExpectation(error, expectation);
	return error;
};

export const assertRejects = async (promise, expectation) => {
	let error;
	await assert.rejects(promise, thrownError => {
		error = thrownError;
		return true;
	});

	checkExpectation(error, expectation);
	return error;
};

/*
Like `t.like()`, this compares a subset of the properties of an object, whatever its prototype. Nested plain objects are compared the same way, unless they are empty. Any other value must be deeply equal, including arrays, which is stricter than `t.like()`.
`assert.partialDeepStrictEqual()` is not used: it requires the prototype to be the same, which never holds when the value is an error, and an empty array matches any array.
The properties are read directly, so non-enumerable ones like `error.cause` are included.
*/
export const assertLike = (value, expectedSubset, path = 'value') => {
	for (const [key, expectedValue] of Object.entries(expectedSubset)) {
		const keyPath = `${path}.${key}`;
		if (isPlainObject(expectedValue) && Object.keys(expectedValue).length > 0) {
			assertLike(value[key], expectedValue, keyPath);
		} else {
			assert.deepEqual(value[key], expectedValue, `${keyPath} is not like the expected value`);
		}
	}
};
