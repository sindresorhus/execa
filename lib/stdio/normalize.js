// Add support for `stdin`/`stdout`/`stderr` as an alias for `stdio`
export const normalizeStdio = options => {
	if (!options) {
		return [undefined, undefined, undefined];
	}

	const {stdio} = options;

	if (stdio === undefined) {
		return aliases.map(alias => options[alias]);
	}

	if (hasAlias(options)) {
		throw new Error(`It's not possible to provide \`stdio\` in combination with one of ${aliases.map(alias => `\`${alias}\``).join(', ')}`);
	}

	if (typeof stdio === 'string') {
		return [stdio, stdio, stdio];
	}

	if (!Array.isArray(stdio)) {
		throw new TypeError(`Expected \`stdio\` to be of type \`string\` or \`Array\`, got \`${typeof stdio}\``);
	}

	const length = Math.max(stdio.length, aliases.length);
	return Array.from({length}, (value, index) => stdio[index]);
};

const hasAlias = options => aliases.some(alias => options[alias] !== undefined);

const aliases = ['stdin', 'stdout', 'stderr'];

// Same but for `execaNode()`, i.e. push `ipc` unless already present
export const normalizeStdioNode = options => {
	const stdio = normalizeStdio(options);
	return stdio.includes('ipc') ? stdio : [...stdio, 'ipc'];
};
