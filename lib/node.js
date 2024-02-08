import {execPath, execArgv} from 'node:process';
import {basename} from 'node:path';
import {safeNormalizeFileUrl} from './cwd.js';

export const handleNodeOption = (file, args, {
	node: shouldHandleNode = false,
	nodePath = execPath,
	nodeOptions = execArgv.filter(arg => !arg.startsWith('--inspect')),
	...options
}) => {
	if (!shouldHandleNode) {
		return [file, args, options];
	}

	if (basename(file, '.exe') === 'node') {
		throw new TypeError('When the "node" option is true, the first argument does not need to be "node".');
	}

	return [
		safeNormalizeFileUrl(nodePath, 'The "nodePath" option'),
		[...nodeOptions, file, ...args],
		{ipc: true, ...options, shell: false},
	];
};
