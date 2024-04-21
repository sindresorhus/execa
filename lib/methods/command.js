// Main logic for `execaCommand()`
export const mapCommandAsync = ({file, commandArguments}) => parseCommand(file, commandArguments);

// Main logic for `execaCommandSync()`
export const mapCommandSync = ({file, commandArguments}) => ({...parseCommand(file, commandArguments), isSync: true});

// Convert `execaCommand(command)` into `execa(file, ...commandArguments)`
const parseCommand = (command, unusedArguments) => {
	if (unusedArguments.length > 0) {
		throw new TypeError(`The command and its arguments must be passed as a single string: ${command} ${unusedArguments}.`);
	}

	const tokens = [];
	for (const token of command.trim().split(SPACES_REGEXP)) {
		// Allow spaces to be escaped by a backslash if not meant as a delimiter
		const previousToken = tokens.at(-1);
		if (previousToken && previousToken.endsWith('\\')) {
			// Merge previous token with current one
			tokens[tokens.length - 1] = `${previousToken.slice(0, -1)} ${token}`;
		} else {
			tokens.push(token);
		}
	}

	const [file, ...commandArguments] = tokens;
	return {file, commandArguments};
};

const SPACES_REGEXP = / +/g;
