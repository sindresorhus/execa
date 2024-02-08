import {statSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import process from 'node:process';

export const getDefaultCwd = () => {
	try {
		return process.cwd();
	} catch (error) {
		error.message = `The current directory does not exist.\n${error.message}`;
		throw error;
	}
};

export const normalizeCwd = cwd => {
	const cwdString = safeNormalizeFileUrl(cwd, 'The "cwd" option');
	return resolve(cwdString);
};

export const safeNormalizeFileUrl = (file, name) => {
	const fileString = normalizeFileUrl(file);

	if (typeof fileString !== 'string') {
		throw new TypeError(`${name} must be a string or a file URL: ${fileString}.`);
	}

	return fileString;
};

export const normalizeFileUrl = file => file instanceof URL ? fileURLToPath(file) : file;

export const fixCwdError = (originalMessage, cwd) => {
	if (cwd === getDefaultCwd()) {
		return originalMessage;
	}

	let cwdStat;
	try {
		cwdStat = statSync(cwd);
	} catch (error) {
		return `The "cwd" option is invalid: ${cwd}.\n${error.message}\n${originalMessage}`;
	}

	if (!cwdStat.isDirectory()) {
		return `The "cwd" option is not a directory: ${cwd}.\n${originalMessage}`;
	}

	return originalMessage;
};
