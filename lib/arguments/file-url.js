import {fileURLToPath} from 'node:url';

// Allow some arguments/options to be either a file path string or a file URL
export const safeNormalizeFileUrl = (file, name) => {
	const fileString = normalizeFileUrl(file);

	if (typeof fileString !== 'string') {
		throw new TypeError(`${name} must be a string or a file URL: ${fileString}.`);
	}

	return fileString;
};

// Same but also allows other values, e.g. `boolean` for the `shell` option
export const normalizeFileUrl = file => file instanceof URL ? fileURLToPath(file) : file;
