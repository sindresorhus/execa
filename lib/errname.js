'use strict';
const util = require('util');

module.exports = util.getSystemErrorName;

// Used for testing the fallback behavior
module.exports.__test__ = errname;

function errname(uv, code) {
	if (!(code < 0)) {
		throw new Error('err >= 0');
	}

	return `Unknown system error ${code}`;
}

