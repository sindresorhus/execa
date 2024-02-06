const normalizeArgs = (file, args = []) => {
	if (!Array.isArray(args)) {
		return [file];
	}

	return [file, ...args];
};

const NO_ESCAPE_REGEXP = /^[\w.-]+$/;

const escapeArg = arg => {
	if (typeof arg !== 'string' || NO_ESCAPE_REGEXP.test(arg)) {
		return arg;
	}

	return `"${arg.replaceAll('"', '\\"')}"`;
};

export const joinCommand = (file, rawArgs) => normalizeArgs(file, rawArgs).join(' ');

export const getEscapedCommand = (file, rawArgs) => normalizeArgs(file, rawArgs).map(arg => escapeArg(arg)).join(' ');
