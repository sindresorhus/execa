'use strict';

const descriptors = ['then', 'catch', 'finally'].map(property =>
	[
		property,
		Reflect.getOwnPropertyDescriptor(Promise.prototype, property)
	]
);

// The return value is a mixin of `childProcess` and `Promise`
const mergePromise = (spawned, promise) => {
	// Starting the main `promise` is deferred to avoid consuming streams
	promise = typeof promise === 'function' ? promise() : promise;

	const properties = descriptors.map(([property, descriptor]) =>
		[
			property,
			{
				...descriptor,
				value: descriptor.value.bind(promise)
			}
		]
	);
	return Object.defineProperties(spawned, Object.fromEntries(properties));
};

// Use promises instead of `child_process` events
const getSpawnedPromise = spawned => {
	return new Promise((resolve, reject) => {
		spawned.on('exit', (exitCode, signal) => {
			resolve({exitCode, signal});
		});

		spawned.on('error', error => {
			reject(error);
		});

		if (spawned.stdin) {
			spawned.stdin.on('error', error => {
				reject(error);
			});
		}
	});
};

module.exports = {
	mergePromise,
	getSpawnedPromise
};

