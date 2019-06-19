'use strict';
const alias = ['stdin', 'stdout', 'stderr'];

const hasAlias = opts => alias.some(x => Boolean(opts[x]));

const stdio = opts => {
	if (!opts) {
		return;
	}

	if (opts.stdio && hasAlias(opts)) {
		throw new Error(`It's not possible to provide \`stdio\` in combination with one of ${alias.map(x => `\`${x}\``).join(', ')}`);
	}

	if (typeof opts.stdio === 'string') {
		return opts.stdio;
	}

	const stdio = opts.stdio || [];

	if (!Array.isArray(stdio)) {
		throw new TypeError(`Expected \`stdio\` to be of type \`string\` or \`Array\`, got \`${typeof stdio}\``);
	}

	const result = [];
	const len = Math.max(stdio.length, alias.length);

	for (let i = 0; i < len; i++) {
		let value;

		if (stdio[i] !== undefined) {
			value = stdio[i];
		} else if (opts[alias[i]] !== undefined) {
			value = opts[alias[i]];
		}

		result[i] = value;
	}

	return result;
};

module.exports = stdio;

// `ipc` is also pushed unless it is already present
module.exports.node = opts => {
	const stdioOption = stdio(opts) || 'pipe';

	if (stdioOption === 'ipc') {
		return 'ipc';
	}

	if (typeof stdioOption === 'string') {
		return [stdioOption, stdioOption, stdioOption, 'ipc'];
	}

	if (stdioOption.includes('ipc')) {
		return stdioOption;
	}

	return [...stdioOption, 'ipc'];
};
