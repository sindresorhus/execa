'use strict';
var childProcess = require('child_process');
var crossSpawnAsync = require('cross-spawn-async');
var stripEof = require('strip-eof');
var objectAssign = require('object-assign');
var npmRunPath = require('npm-run-path');
var TEN_MEBIBYTE = 1024 * 1024 * 10;

module.exports = function (cmd, args, opts) {
	return new Promise(function (resolve, reject) {
		var parsed;

		if (opts && opts.__winShell === true) {
			delete opts.__winShell;
			parsed = {
				command: cmd,
				args: args,
				options: opts,
				file: cmd,
				original: cmd
			};
		} else {
			parsed = crossSpawnAsync._parse(cmd, args, opts);
		}

		opts = objectAssign({
			maxBuffer: TEN_MEBIBYTE,
			stripEof: true,
			preferLocal: true
		}, parsed.options);

		var handle = function (val) {
			if (opts.stripEof) {
				val = stripEof(val);
			}

			return val;
		};

		if (opts.preferLocal) {
			opts.env = objectAssign({}, opts.env || process.env);
			opts.env.PATH = npmRunPath({
				cwd: opts.cwd,
				path: opts.env.PATH
			});
		}

		var spawned = childProcess.execFile(parsed.command, parsed.args, opts, function (err, stdout, stderr) {
			if (err) {
				err.stdout = stdout;
				err.stderr = stderr;
				err.message += stdout;
				reject(err);
				return;
			}

			resolve({
				stdout: handle(stdout),
				stderr: handle(stderr)
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
		opts.__winShell = true;
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
