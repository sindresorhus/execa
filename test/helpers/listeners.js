import assert from 'node:assert/strict';
import process from 'node:process';

export const assertMaxListeners = () => {
	let warning;
	const captureWarning = warningArgument => {
		warning = warningArgument;
	};

	process.once('warning', captureWarning);
	return () => {
		assert.equal(warning, undefined);
		process.removeListener('warning', captureWarning);
	};
};
