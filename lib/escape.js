export const joinCommand = (filePath, rawArgs) => {
	const fileAndArgs = [filePath, ...rawArgs];
	const command = fileAndArgs.join(' ');
	const escapedCommand = fileAndArgs.map(arg => escapeArg(arg)).join(' ');
	return {command, escapedCommand};
};

const escapeArg = arg => typeof arg === 'string' && !NO_ESCAPE_REGEXP.test(arg)
	? `"${arg.replaceAll('"', '\\"')}"`
	: arg;

const NO_ESCAPE_REGEXP = /^[\w.-]+$/;
