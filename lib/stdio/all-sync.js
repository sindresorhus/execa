import {stripNewline} from '../return/strip-newline.js';
import {isUint8Array, concatUint8Arrays} from './uint-array.js';

export const getAllSync = ([, stdout, stderr], options) => {
	if (!options.all) {
		return;
	}

	if (stdout === undefined) {
		return stderr;
	}

	if (stderr === undefined) {
		return stdout;
	}

	if (Array.isArray(stdout)) {
		return Array.isArray(stderr)
			? [...stdout, ...stderr]
			: [...stdout, stripNewline(stderr, options, 'all')];
	}

	if (Array.isArray(stderr)) {
		return [stripNewline(stdout, options, 'all'), ...stderr];
	}

	if (isUint8Array(stdout) && isUint8Array(stderr)) {
		return concatUint8Arrays([stdout, stderr]);
	}

	return `${stdout}${stderr}`;
};
