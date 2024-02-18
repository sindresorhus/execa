import {execPath, execArgv} from 'node:process';
import {basename, resolve} from 'node:path';
import {execa} from '../async.js';
import {handleOptionalArguments} from './options.js';
import {safeNormalizeFileUrl} from './cwd.js';

export function execaNode(file, args, options) {
	[args, options] = handleOptionalArguments(args, options);

	if (options.node === false) {
		throw new TypeError('The "node" option cannot be false with `execaNode()`.');
	}

	return execa(file, args, {...options, node: true});
}

export const handleNodeOption = (file, args, {
	node: shouldHandleNode = false,
	nodePath = execPath,
	nodeOptions = execArgv.filter(arg => !arg.startsWith('--inspect')),
	cwd,
	execPath: formerNodePath,
	...options
}) => {
	if (formerNodePath !== undefined) {
		throw new TypeError('The "execPath" option has been removed. Please use the "nodePath" option instead.');
	}

	const normalizedNodePath = safeNormalizeFileUrl(nodePath, 'The "nodePath" option');
	const resolvedNodePath = resolve(cwd, normalizedNodePath);
	const newOptions = {...options, nodePath: resolvedNodePath, node: shouldHandleNode, cwd};

	if (!shouldHandleNode) {
		return [file, args, newOptions];
	}

	if (basename(file, '.exe') === 'node') {
		throw new TypeError('When the "node" option is true, the first argument does not need to be "node".');
	}

	return [
		resolvedNodePath,
		[...nodeOptions, file, ...args],
		{ipc: true, ...newOptions, shell: false},
	];
};
