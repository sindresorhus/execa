'use strict';
// The Node team wants to deprecate `process.bind(...)`.
//   https://github.com/nodejs/node/pull/2768
//
// However, we need the 'uv' binding for errname support.
// This is a defensive wrapper around it so `execa` will not fail entirely if it stops working someday.
//
// If this ever stops working. See: https://github.com/sindresorhus/execa/issues/31#issuecomment-215939939 for another possible solution.
var uv;

try {
	uv = process.binding('uv');
	if (typeof uv.errname !== 'function') {
		throw new Error('uv.errname is not a function');
	}
} catch (e) {
	console.error('execa/lib/errname: unable to establish process.binding("uv")', e);
	uv = null;
}

function errname(uv, code) {
	if (uv) {
		return uv.errname(code);
	}

	if (!(code < 0)) {
		throw new Error('err >= 0');
	}

	return 'UNKNOWN CODE: ' + code;
}

module.exports = function getErrname(code) {
	return errname(uv, code);
};

// used for testing the fallback behavior.
module.exports._test = errname;
