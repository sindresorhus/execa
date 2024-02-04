import {STANDARD_STREAMS_ALIASES} from './utils.js';

// Add support for `stdin`/`stdout`/`stderr` as an alias for `stdio`
export const normalizeStdio = ({stdio, ipc, ...options}) => {
	const stdioArray = getStdioArray(stdio, options);
	return ipc && !stdioArray.includes('ipc')
		? [...stdioArray, 'ipc']
		: stdioArray;
};

const getStdioArray = (stdio, options) => {
	if (stdio === undefined) {
		return STANDARD_STREAMS_ALIASES.map(alias => options[alias]);
	}

	if (hasAlias(options)) {
		throw new Error(`It's not possible to provide \`stdio\` in combination with one of ${STANDARD_STREAMS_ALIASES.map(alias => `\`${alias}\``).join(', ')}`);
	}

	if (typeof stdio === 'string') {
		return [stdio, stdio, stdio];
	}

	if (!Array.isArray(stdio)) {
		throw new TypeError(`Expected \`stdio\` to be of type \`string\` or \`Array\`, got \`${typeof stdio}\``);
	}

	const length = Math.max(stdio.length, STANDARD_STREAMS_ALIASES.length);
	return Array.from({length}, (value, index) => stdio[index]);
};

const hasAlias = options => STANDARD_STREAMS_ALIASES.some(alias => options[alias] !== undefined);
