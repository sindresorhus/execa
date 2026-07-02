// Convert `command` string into an array of file or arguments to pass to $`${...fileOrCommandArguments}`
export const parseCommandString = command => {
	if (typeof command !== 'string') {
		throw new TypeError(`The command must be a string: ${String(command)}.`);
	}

	const trimmedCommand = command.trim();
	if (trimmedCommand === '') {
		return [];
	}

	const tokens = [];
	for (const token of trimmedCommand.split(SPACES_REGEXP)) {
		// Allow spaces to be escaped by a backslash if not meant as a delimiter
		const previousToken = tokens.at(-1);
		if (previousToken && previousToken.endsWith('\\')) {
			// Merge previous token with current one
			tokens[tokens.length - 1] = `${previousToken.slice(0, -1)} ${token}`;
		} else {
			tokens.push(token);
		}
	}

	return tokens;
};

const SPACES_REGEXP = / +/g;
