import {isStream} from 'is-stream';

const aliases = ['stdin', 'stdout', 'stderr'];

const isIterableStdin = stdinOption => typeof stdinOption === 'object'
	&& stdinOption !== null
	&& !isStream(stdinOption)
	&& (typeof stdinOption[Symbol.asyncIterator] === 'function' || typeof stdinOption[Symbol.iterator] === 'function');

export const stdioHasIterableStdin = stdio => Array.isArray(stdio) && isIterableStdin(stdio[0]);

const transformStdioItem = (stdioItem, index) => {
	if (index === 0 && isIterableStdin(stdioItem)) {
		return 'pipe';
	}

	return stdioItem;
};

export const transformStdio = stdio => Array.isArray(stdio)
	? stdio.map((stdioItem, index) => transformStdioItem(stdioItem, index))
	: stdio;

const hasAlias = options => aliases.some(alias => options[alias] !== undefined);

export const normalizeStdio = options => {
	if (!options) {
		return;
	}

	const {stdio} = options;

	if (stdio === undefined) {
		return aliases.map(alias => options[alias]);
	}

	if (hasAlias(options)) {
		throw new Error(`It's not possible to provide \`stdio\` in combination with one of ${aliases.map(alias => `\`${alias}\``).join(', ')}`);
	}

	if (typeof stdio === 'string') {
		return stdio;
	}

	if (!Array.isArray(stdio)) {
		throw new TypeError(`Expected \`stdio\` to be of type \`string\` or \`Array\`, got \`${typeof stdio}\``);
	}

	const length = Math.max(stdio.length, aliases.length);
	return Array.from({length}, (value, index) => stdio[index]);
};

// `ipc` is pushed unless it is already present
export const normalizeStdioNode = options => {
	const stdio = normalizeStdio(options);

	if (stdio === 'ipc') {
		return 'ipc';
	}

	if (stdio === undefined || typeof stdio === 'string') {
		return [stdio, stdio, stdio, 'ipc'];
	}

	if (stdio.includes('ipc')) {
		return stdio;
	}

	return [...stdio, 'ipc'];
};
