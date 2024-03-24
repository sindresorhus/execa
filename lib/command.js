export const mapCommandAsync = ({file, args}) => parseCommand(file, args);
export const mapCommandSync = ({file, args}) => ({...parseCommand(file, args), isSync: true});

const parseCommand = (command, unusedArgs) => {
	if (unusedArgs.length > 0) {
		throw new TypeError(`The command and its arguments must be passed as a single string: ${command} ${unusedArgs}.`);
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

	const [file, ...args] = tokens;
	return {file, args};
};

const SPACES_REGEXP = / +/g;
