import process from 'node:process';

export const assertMaxListeners = t => {
	let warning;
	const captureWarning = warningArgument => {
		warning = warningArgument;
	};

	process.once('warning', captureWarning);
	return () => {
		t.is(warning, undefined);
		process.removeListener('warning', captureWarning);
	};
};
