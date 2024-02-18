// Like Bash, we await both processes. This is unlike some other shells which only await the destination process.
// Like Bash with the `pipefail` option, if either process fails, the whole pipe fails.
// Like Bash, if both processes fail, we return the failure of the destination.
// This ensures both processes' errors are present, using `error.pipedFrom`.
export const waitForBothProcesses = async processPromises => {
	const [
		{status: sourceStatus, reason: sourceReason, value: sourceResult = sourceReason},
		{status: destinationStatus, reason: destinationReason, value: destinationResult = destinationReason},
	] = await processPromises;

	if (!destinationResult.pipedFrom.includes(sourceResult)) {
		destinationResult.pipedFrom.push(sourceResult);
	}

	if (destinationStatus === 'rejected') {
		throw destinationResult;
	}

	if (sourceStatus === 'rejected') {
		throw sourceResult;
	}

	return destinationResult;
};
