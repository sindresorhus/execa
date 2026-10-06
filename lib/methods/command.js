// Convert `command` string into an array of file or arguments to pass to $`${...fileOrCommandArguments}`
export const parseCommandString = command => {
	if (typeof command !== 'string') {
		throw new TypeError(`The command must be a string: ${String(command)}.`);
	}

	// Allow spaces to be escaped by a backslash if not meant as a delimiter
	return trimCommand(command).match(TOKEN_REGEXP)?.map(token => token.replaceAll('\\ ', ' ')) ?? [];
};

const TOKEN_REGEXP = /(?:\\ |[^ ])+/g;

// Like `string.trim()`, but keeps a trailing escaped space
const trimCommand = command => {
	const trimmedCommand = command.trim();
	const trimmedEnd = command.trimEnd();
	return trimmedEnd.endsWith('\\') && command[trimmedEnd.length] === ' ' ? `${trimmedCommand} ` : trimmedCommand;
};
