'use strict';
var childProcess = require('child_process');
var crossSpawnAsync = require('cross-spawn-async');
var stripEof = require('strip-eof');
var objectAssign = require('object-assign');
var npmRunPath = require('npm-run-path');
var pathKey = require('path-key')();
var TEN_MEBIBYTE = 1024 * 1024 * 10;

module.exports = function (cmd, args, opts) {
	return new Promise(function (resolve, reject) {
		var parsed = crossSpawnAsync._parse(cmd, args, opts);

		opts = objectAssign({
			maxBuffer: TEN_MEBIBYTE,
			stripEof: true,
			preferLocal: true
		}, parsed.options);

		var handle = function (val) {
			if (parsed.options.stripEof !== false) {
				val = stripEof(val);
			}

			if (parsed.options.encoding !== undefined) {
				val = new Buffer(val, parsed.options.encoding);
			}

			return val;
		};

		if (opts.preferLocal) {
			opts.env = objectAssign({}, opts.env || process.env);
			opts.env[pathKey] = npmRunPath({
				cwd: opts.cwd,
				path: opts.env[pathKey]
			});
		}

		var all = '';
		var out = '';
		var err = '';
		var spawned = childProcess.spawn(parsed.command, parsed.args, parsed.options);

		spawned.stdout.setEncoding('utf8');
		spawned.stderr.setEncoding('utf8');

		spawned.stdout.on('data', function (data) {
			out += data;
			all += data;
		});

		spawned.stderr.on('data', function (data) {
			err += data;
			all += data;
		});

		spawned.on('error', function (error) {
			error.stdout = handle(out);
			error.stderr = handle(err);
			error.all = handle(all);

			reject(error);
		});

		spawned.on('close', function () {
			resolve({
				stdout: handle(out),
				stderr: handle(err),
				all: handle(all)
			});
		});

		crossSpawnAsync._enoent.hookChildProcess(spawned, parsed);
	});
};

module.exports.shell = function (cmd, opts) {
	var file;
	var args;

	opts = objectAssign({}, opts);

	if (process.platform === 'win32') {
		file = process.env.comspec || 'cmd.exe';
		args = ['/s', '/c', '"' + cmd + '"'];
		opts.windowsVerbatimArguments = true;
	} else {
		file = '/bin/sh';
		args = ['-c', cmd];
	}

	if (opts.shell) {
		file = opts.shell;
	}

	return module.exports(file, args, opts);
};

module.exports.spawn = crossSpawnAsync;
