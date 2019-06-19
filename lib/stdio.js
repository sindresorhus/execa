'use strict';
const aliases = ['stdin', 'stdout', 'stderr'];

const hasAlias = opts => aliases.some(alias => opts[alias] !== undefined);

const stdio = opts => {
	if (!opts) {
		return;
	}

	if (opts.stdio !== undefined && hasAlias(opts)) {
		throw new Error(`It's not possible to provide \`stdio\` in combination with one of ${aliases.map(alias => `\`${alias}\``).join(', ')}`);
	}

	if (typeof opts.stdio === 'string') {
		return opts.stdio;
	}

	const stdio = opts.stdio || [];

	if (!Array.isArray(stdio)) {
		throw new TypeError(`Expected \`stdio\` to be of type \`string\` or \`Array\`, got \`${typeof stdio}\``);
	}

	const result = [];
	const len = Math.max(stdio.length, aliases.length);

	for (let i = 0; i < len; i++) {
		let value;

		if (stdio[i] !== undefined) {
			value = stdio[i];
		} else if (opts[aliases[i]] !== undefined) {
			value = opts[aliases[i]];
		}

		result[i] = value;
	}

	return result;
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
