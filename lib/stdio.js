'use strict';
var util = require('util');

var alias = ['stdin', 'stdout', 'stderr'];

module.exports = function (opts) {
	if (!opts) {
		return null;
	}

	if (typeof opts.stdio === 'string') {
		return opts.stdio;
	}

	var stdio = opts.stdio || [];

	if (!Array.isArray(stdio)) {
		throw new TypeError('Incorrect value of stdio option: ' + util.inspect(stdio));
	}

	var result = [];
	var len = Math.max(stdio.length, alias.length);

	for (var i = 0; i < len; i++) {
		result[i] = stdio[i] || opts[alias[i]] || null;
	}

	return result;
};
