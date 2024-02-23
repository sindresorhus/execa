import isPlainObject from 'is-plain-obj';
import {isBinary, binaryToString, isChildProcess, isExecaChildProcess} from './utils.js';
import {execa} from './async.js';
import {execaSync} from './sync.js';

const create$ = options => {
	function $(templatesOrOptions, ...expressions) {
		if (isPlainObject(templatesOrOptions)) {
			return create$({...options, ...templatesOrOptions});
		}

		if (!Array.isArray(templatesOrOptions)) {
			throw new TypeError('Please use either $(option) or $`command`.');
		}

		const [file, ...args] = parseTemplates(templatesOrOptions, expressions);
		const childProcess = execa(file, args, normalizeScriptOptions(options));
		childProcess.pipe = scriptPipe.bind(undefined, childProcess.pipe.bind(childProcess), {});
		return childProcess;
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

const scriptPipe = (originalPipe, options, firstArgument, ...args) => {
	if (isExecaChildProcess(firstArgument)) {
		if (Object.keys(options).length > 0) {
			throw new TypeError('Please use .pipe(options)`command` or .pipe($(options)`command`) instead of .pipe(options)($`command`).');
		}

		return originalPipe(firstArgument, ...args);
	}

	if (isPlainObject(firstArgument)) {
		return scriptPipe.bind(undefined, originalPipe, {...options, ...firstArgument});
	}

	if (!Array.isArray(firstArgument)) {
		throw new TypeError('The first argument must be a template string, an options object, or an Execa child process.');
	}

	const childProcess = create$({...options, stdin: 'pipe'})(firstArgument, ...args);
	return originalPipe(childProcess, options);
};

const parseTemplates = (templates, expressions) => {
	let tokens = [];

	for (const [index, template] of templates.entries()) {
		tokens = parseTemplate({templates, expressions, tokens, index, template});
	}

	return tokens;
};

const parseTemplate = ({templates, expressions, tokens, index, template}) => {
	const templateString = template ?? templates.raw[index];
	const templateTokens = templateString.split(SPACES_REGEXP).filter(Boolean);
	const newTokens = concatTokens(
		tokens,
		templateTokens,
		templateString.startsWith(' '),
	);

	if (index === expressions.length) {
		return newTokens;
	}

	const expression = expressions[index];
	const expressionTokens = Array.isArray(expression)
		? expression.map(expression => parseExpression(expression))
		: [parseExpression(expression)];
	return concatTokens(
		newTokens,
		expressionTokens,
		templateString.endsWith(' '),
	);
};

const SPACES_REGEXP = / +/g;

const concatTokens = (tokens, nextTokens, isNew) => isNew || tokens.length === 0 || nextTokens.length === 0
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
