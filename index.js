'use strict';
var childProcess = require('child_process');
var crossSpawnAsync = require('cross-spawn-async');
var stripEof = require('strip-eof');
var objectAssign = require('object-assign');
var npmRunPath = require('npm-run-path');
var pathKey = require('path-key')();
var TEN_MEBIBYTE = 1024 * 1024 * 10;

function handleArgs(cmd, args, opts) {
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
		preferLocal: true,
		encoding: 'utf8'
	}, parsed.options);

	if (opts.preferLocal) {
		opts.env = objectAssign({}, opts.env || process.env);
		opts.env[pathKey] = npmRunPath({
			cwd: opts.cwd,
			path: opts.env[pathKey]
		});
	}

	return {
		cmd: parsed.command,
		args: parsed.args,
		opts: opts
	};
}

function handleOutput(opts, val) {
	if (opts.stripEof) {
		val = stripEof(val);
	}

	return val;
}

module.exports = function (cmd, args, opts) {
	var spawned;

	var promise = new Promise(function (resolve, reject) {
		var parsed = handleArgs(cmd, args, opts);

		spawned = childProcess.execFile(parsed.cmd, parsed.args, parsed.opts, function (err, stdout, stderr) {
			if (err) {
				err.stdout = stdout;
				err.stderr = stderr;
				err.message += stdout;
				reject(err);
				return;
			}

			resolve({
				stdout: handleOutput(parsed.opts, stdout),
				stderr: handleOutput(parsed.opts, stderr)
			});
		});

		crossSpawnAsync._enoent.hookChildProcess(spawned, parsed);
	});

	promise.kill = spawned.kill.bind(spawned);
	promise.pid = spawned.pid;

	return promise;
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

module.exports.spawn = function (cmd, args, opts) {
	var parsed = handleArgs(cmd, args, opts);
	var spawned = childProcess.spawn(parsed.cmd, parsed.args, parsed.opts);

	crossSpawnAsync._enoent.hookChildProcess(spawned, parsed);

	return spawned;
};

module.exports.sync = function (cmd, args, opts) {
	var parsed = handleArgs(cmd, args, opts);
	var out = childProcess.execFileSync(parsed.cmd, parsed.args, parsed.opts);

	return handleOutput(parsed.opts, out);
};
