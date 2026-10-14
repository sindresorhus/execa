import {execPath, execArgv} from 'node:process';
import path from 'node:path';
import {safeNormalizeFileUrl} from '../arguments/file-url.js';

// `execaNode()` is a shortcut for `execa(..., {node: true})`
export const mapNode = ({options}) => {
	if (options.node === false) {
		throw new TypeError('The "node" option cannot be false with `execaNode()`.');
	}

	return {options: {__proto__: null, ...options, node: true}};
};

// The subprocess must not reuse the current process' `--inspect` port.
// It must not run the current process' `node --eval` or `node --print` code either, instead of its file. Like `child_process.fork()`, this prevents fork bombs.
const getDefaultNodeOptions = () => {
	const nodeOptions = [];
	for (let index = 0; index < execArgv.length; index += 1) {
		const nodeOption = execArgv[index];
		if (REMOVED_OPTIONS_WITH_VALUE.has(nodeOption)) {
			// `-p` and `--print` do not take a value when followed by another flag, e.g. `node -p -e code`. With the other options, Node.js fails when their value starts with `-`.
			if (!execArgv[index + 1]?.startsWith('-')) {
				index += 1;
			}
		} else if (!IGNORED_OPTIONS_REGEXP.test(nodeOption)) {
			nodeOptions.push(nodeOption);
		}
	}

	return nodeOptions;
};

// Those options are followed by a separate value, which is removed too
const REMOVED_OPTIONS_WITH_VALUE = new Set(['-e', '--eval', '-p', '--print', '-pe', '--input-type', '--inspect-port']);
const IGNORED_OPTIONS_REGEXP = /^--(?:inspect|eval=|print=|input-type=)/;

// Applies the `node: true` option, and the related `nodePath`/`nodeOptions` options.
// Modifies the file commands/arguments to ensure the same Node binary and flags are re-used.
// Also adds `ipc: true` and `shell: false`.
export const handleNodeOption = (file, commandArguments, {
	node: shouldHandleNode = false,
	nodePath = execPath,
	nodeOptions = getDefaultNodeOptions(),
	cwd,
	execPath: formerNodePath,
	...options
}) => {
	if (formerNodePath !== undefined) {
		throw new TypeError('The "execPath" option has been removed. Please use the "nodePath" option instead.');
	}

	if (!Array.isArray(nodeOptions) || nodeOptions.some(nodeOption => typeof nodeOption !== 'string')) {
		throw new TypeError('The "nodeOptions" option must be an array of strings.');
	}

	const normalizedNodePath = safeNormalizeFileUrl(nodePath, 'The "nodePath" option');
	const resolvedNodePath = path.resolve(cwd, normalizedNodePath);
	// Use spread (which only copies own properties) to safely get shell without reading polluted prototype
	const newOptions = {
		__proto__: null,
		shell: false,
		...options,
		nodePath: resolvedNodePath,
		node: shouldHandleNode,
		cwd,
	};

	if (!shouldHandleNode) {
		return [file, commandArguments, newOptions];
	}

	if (path.basename(file, '.exe') === 'node') {
		throw new TypeError('When the "node" option is true, the first argument does not need to be "node".');
	}

	return [
		resolvedNodePath,
		[
			...nodeOptions,
			file,
			...commandArguments,
		],
		{
			__proto__: null,
			...newOptions,
			// Like other options, `undefined` uses the default value
			ipc: newOptions.ipc === undefined ? true : newOptions.ipc,
			shell: false,
		},
	];
};
