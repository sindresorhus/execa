export const assertPipeError = async (t, pipePromise, message) => {
	const error = await t.throwsAsync(pipePromise);

	t.is(error.command, 'source.pipe(destination)');
	t.is(error.escapedCommand, error.command);

	t.is(typeof error.cwd, 'string');
	t.true(error.failed);
	t.false(error.timedOut);
	t.false(error.isCanceled);
	t.false(error.isTerminated);
	t.is(error.exitCode, undefined);
	t.is(error.signal, undefined);
	t.is(error.signalDescription, undefined);
	t.is(error.stdout, undefined);
	t.is(error.stderr, undefined);
	t.is(error.all, undefined);
	t.deepEqual(error.stdio, Array.from({length: error.stdio.length}));
	t.deepEqual(error.pipedFrom, []);

	t.true(error.shortMessage.includes(`Command failed: ${error.command}`));
	t.true(error.shortMessage.includes(error.originalMessage));
	t.true(error.message.includes(error.shortMessage));

	t.true(error.originalMessage.includes(message));
};
