const normalizeArgs = (file, args = []) => {
	if (!Array.isArray(args)) {
		return [file];
	}

	return [file, ...args];
};

const NO_ESCAPE_REGEXP = /^[\w.-]+$/;
const DOUBLE_QUOTES_REGEXP = /"/g;

const escapeArg = arg => {
	if (typeof arg !== 'string' || NO_ESCAPE_REGEXP.test(arg)) {
		return arg;
	}

	return `"${arg.replace(DOUBLE_QUOTES_REGEXP, '\\"')}"`;
};

export const joinCommand = (file, args) => normalizeArgs(file, args).join(' ');

export const getEscapedCommand = (file, args) => normalizeArgs(file, args).map(arg => escapeArg(arg)).join(' ');

const SPACES_REGEXP = / +/g;

// Handle `execaCommand()`
export const parseCommand = command => {
	const tokens = [];
	for (const token of command.trim().split(SPACES_REGEXP)) {
		// Allow spaces to be escaped by a backslash if not meant as a delimiter
		const previousToken = tokens[tokens.length - 1];
		if (previousToken && previousToken.endsWith('\\')) {
			// Merge previous token with current one
			tokens[tokens.length - 1] = `${previousToken.slice(0, -1)} ${token}`;
		} else {
			tokens.push(token);
		}
	}

	return tokens;
};

export const parseTemplate = (template, index, templates, expressions) => {
	const templateString = template ?? templates.raw[index];
	const templateTokens = templateString.split(SPACES_REGEXP).filter(Boolean);

	if (index === expressions.length) {
		return templateTokens;
	}

	const expression = expressions[index];

	return Array.isArray(expression)
		? [...templateTokens, ...expression.map(String)]
		: [...templateTokens, String(expression)];
};

export const parseTemplates = (templates, expressions) => templates.flatMap(
	(template, index) => parseTemplate(template, index, templates, expressions),
);
