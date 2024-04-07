import {fileURLToPath} from 'node:url';

export const safeNormalizeFileUrl = (file, name) => {
	const fileString = normalizeFileUrl(file);

	if (typeof fileString !== 'string') {
		throw new TypeError(`${name} must be a string or a file URL: ${fileString}.`);
	}

	return fileString;
};

export const normalizeFileUrl = file => file instanceof URL ? fileURLToPath(file) : file;
