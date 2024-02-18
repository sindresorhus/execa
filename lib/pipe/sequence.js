// Like Bash, we await both processes. This is unlike some other shells which only await the destination process.
// Like Bash with the `pipefail` option, if either process fails, the whole pipe fails.
// Like Bash, if both process fails, we return the failure of the destination.
// This ensures both processes' error is present, using `error.pipedFrom`.
export const waitForBothProcesses = async (source, destination) => {
	const [
		{status: sourceStatus, reason: sourceReason, value: sourceResult = sourceReason},
		{status: destinationStatus, reason: destinationReason, value: destinationResult = destinationReason},
	] = await Promise.allSettled([source, destination]);

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
