import isPlainObject from 'is-plain-obj';
import {isBinary, binaryToString, isChildProcess} from './utils.js';
import {execa} from './async.js';
import {execaSync} from './sync.js';

export const create$ = options => {
	function $(templatesOrOptions, ...expressions) {
		if (isPlainObject(templatesOrOptions)) {
			return create$({...options, ...templatesOrOptions});
		}

		if (!Array.isArray(templatesOrOptions)) {
			throw new TypeError('Please use either $(option) or $`command`.');
		}

		const [file, ...args] = parseTemplates(templatesOrOptions, expressions);
		return execa(file, args, normalizeScriptOptions(options));
	}

	$.sync = (templates, ...expressions) => {
		if (isPlainObject(templates)) {
			throw new TypeError('Please use $(options).sync`command` instead of $.sync(options)`command`.');
		}

		if (!Array.isArray(templates)) {
			throw new TypeError('A template string must be used: $.sync`command`.');
		}

		const [file, ...args] = parseTemplates(templates, expressions);
		return execaSync(file, args, normalizeScriptOptions(options));
	};

	$.s = $.sync;

	return $;
};

export const $ = create$();

const parseTemplates = (templates, expressions) => {
	let tokens = [];

	for (const [index, template] of templates.entries()) {
		tokens = parseTemplate({templates, expressions, tokens, index, template});
	}

	if (tokens.length === 0) {
		throw new TypeError('Template script must not be empty');
	}

	return tokens;
};

const parseTemplate = ({templates, expressions, tokens, index, template}) => {
	if (template === undefined) {
		throw new TypeError(`Invalid backslash sequence: ${templates.raw[index]}`);
	}

	const {nextTokens, leadingWhitespaces, trailingWhitespaces} = splitByWhitespaces(template, templates.raw[index]);
	const newTokens = concatTokens(tokens, nextTokens, leadingWhitespaces);

	if (index === expressions.length) {
		return newTokens;
	}

	const expression = expressions[index];
	const expressionTokens = Array.isArray(expression)
		? expression.map(expression => parseExpression(expression))
		: [parseExpression(expression)];
	return concatTokens(newTokens, expressionTokens, trailingWhitespaces);
};

// Like `string.split(/[ \t\r\n]+/)` except newlines and tabs are:
//  - ignored when input as a backslash sequence like: `echo foo\n bar`
//  - not ignored when input directly
// The only way to distinguish those in JavaScript is to use a tagged template and compare:
//  - the first array argument, which does not escape backslash sequences
//  - its `raw` property, which escapes them
const splitByWhitespaces = (template, rawTemplate) => {
	if (rawTemplate.length === 0) {
		return {nextTokens: [], leadingWhitespaces: false, trailingWhitespaces: false};
	}

	const nextTokens = [];
	let templateStart = 0;
	const leadingWhitespaces = DELIMITERS.has(rawTemplate[0]);

	for (
		let templateIndex = 0, rawIndex = 0;
		templateIndex < template.length;
		templateIndex += 1, rawIndex += 1
	) {
		const rawCharacter = rawTemplate[rawIndex];
		if (DELIMITERS.has(rawCharacter)) {
			if (templateStart !== templateIndex) {
				nextTokens.push(template.slice(templateStart, templateIndex));
			}

			templateStart = templateIndex + 1;
		} else if (rawCharacter === '\\') {
			const nextRawCharacter = rawTemplate[rawIndex + 1];
			if (nextRawCharacter === 'u' && rawTemplate[rawIndex + 2] === '{') {
				rawIndex = rawTemplate.indexOf('}', rawIndex + 3);
			} else {
				rawIndex += ESCAPE_LENGTH[nextRawCharacter] ?? 1;
			}
		}
	}

	const trailingWhitespaces = templateStart === template.length;
	if (!trailingWhitespaces) {
		nextTokens.push(template.slice(templateStart));
	}

	return {nextTokens, leadingWhitespaces, trailingWhitespaces};
};

const DELIMITERS = new Set([' ', '\t', '\r', '\n']);

// Number of characters in backslash escape sequences: \0 \xXX or \uXXXX
// \cX is allowed in RegExps but not in strings
// Octal sequences are not allowed in strict mode
const ESCAPE_LENGTH = {x: 3, u: 5};

const concatTokens = (tokens, nextTokens, isSeparated) => isSeparated
	|| tokens.length === 0
	|| nextTokens.length === 0
	? [...tokens, ...nextTokens]
	: [
		...tokens.slice(0, -1),
		`${tokens.at(-1)}${nextTokens[0]}`,
		...nextTokens.slice(1),
	];

const parseExpression = expression => {
	const typeOfExpression = typeof expression;

	if (typeOfExpression === 'string') {
		return expression;
	}

	if (typeOfExpression === 'number') {
		return String(expression);
	}

	if (
		typeOfExpression === 'object'
		&& expression !== null
		&& !isChildProcess(expression)
		&& 'stdout' in expression
	) {
		const typeOfStdout = typeof expression.stdout;

		if (typeOfStdout === 'string') {
			return expression.stdout;
		}

		if (isBinary(expression.stdout)) {
			return binaryToString(expression.stdout);
		}

		throw new TypeError(`Unexpected "${typeOfStdout}" stdout in template expression`);
	}

	throw new TypeError(`Unexpected "${typeOfExpression}" in template expression`);
};

const normalizeScriptOptions = (options = {}) => ({
	preferLocal: true,
	...normalizeScriptStdin(options),
	...options,
});

const normalizeScriptStdin = ({input, inputFile, stdio}) => input === undefined && inputFile === undefined && stdio === undefined
	? {stdin: 'inherit'}
	: {};
