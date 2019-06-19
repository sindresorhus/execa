'use strict';
const aliases = ['stdin', 'stdout', 'stderr'];

const hasAlias = opts => aliases.some(alias => opts[alias] !== undefined);

const stdio = opts => {
	if (!opts) {
		return;
	}

	const {stdio} = opts;

	if (stdio === undefined) {
		return aliases.map(alias => opts[alias]);
	}

	if (hasAlias(opts)) {
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

module.exports = stdio;

module.exports.node = opts => {
	const defaultOption = 'pipe';

	let stdioOption = stdio(opts || {stdio: defaultOption});

	if (typeof stdioOption === 'string') {
		stdioOption = [...new Array(3)].fill(stdioOption);
	} else if (Array.isArray(stdioOption)) {
		stdioOption = stdioOption.map((channel = defaultOption) => channel);
	}

	if (!stdioOption.includes('ipc')) {
		stdioOption.push('ipc');
	}

	return stdioOption;
};
