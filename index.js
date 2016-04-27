'use strict';
var childProcess = require('child_process');
var util = require('util');
var crossSpawnAsync = require('cross-spawn-async');
var stripEof = require('strip-eof');
var objectAssign = require('object-assign');
var npmRunPath = require('npm-run-path');
var isStream = require('is-stream');
var getStream = require('get-stream');
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

function handleInput(spawned, opts) {
	var input = opts.input;

	if (input === null || input === undefined) {
		return;
	}

	if (isStream(input)) {
		input.pipe(spawned.stdin);
	} else {
		spawned.stdin.end(input);
	}
}

function handleOutput(opts, val) {
	if (val && opts.stripEof) {
		val = stripEof(val);
	}

	return val;
}

function handleShell(fn, cmd, opts) {
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

	return fn(file, args, opts);
}

module.exports = function (cmd, args, opts) {
	var parsed = handleArgs(cmd, args, opts);
	var encoding = parsed.opts.encoding;
	var spawned = childProcess.spawn(parsed.cmd, parsed.args, parsed.opts);
	var gs = encoding ? getStream : getStream.buffer;

	var promise = Promise.all([
		new Promise(function (resolve) {
			spawned.on('exit', function (code, signal) {
				resolve({code: code, signal: signal});
			});

			spawned.on('error', function (err) {
				resolve({err: err});
			});
		}),
		spawned.stdout && gs(spawned.stdout, encoding && {encoding: encoding}),
		spawned.stderr && gs(spawned.stderr, encoding && {encoding: encoding})
	]).then(function (arr) {
		var result = arr[0];
		var stdout = arr[1];
		var stderr = arr[2];

		var err = result.err;
		var code = result.code;
		var signal = result.signal;

		if (err || code !== 0 || signal !== null) {
			var joinedCmd = cmd;

			if (Array.isArray(args) && args.length) {
				joinedCmd += ' ' + args.join(' ');
			}

			if (!err) {
				err = new Error('Command failed: ' + joinedCmd + '\n' + stderr + stdout);

				// TODO: missing some timeout logic for killed
				// https://github.com/nodejs/node/blob/master/lib/child_process.js#L203
				// err.killed = spawned.killed || killed;
				err.killed = spawned.killed;

				// TODO: child_process applies the following logic for resolving the code:
				// var uv = process.bind('uv');
				// ex.code = code < 0 ? uv.errname(code) : code;
				err.code = code;
			}

			err.stdout = stdout;
			err.stderr = stderr;
			throw err;
		}

		return {
			stdout: handleOutput(parsed.opts, stdout),
			stderr: handleOutput(parsed.opts, stderr)
		};
	});

	crossSpawnAsync._enoent.hookChildProcess(spawned, parsed);

	handleInput(spawned, parsed.opts);

	spawned.then = promise.then.bind(promise);
	spawned.catch = promise.catch.bind(promise);

	return spawned;
};

module.exports.stdout = function () {
	// TODO: set `stderr: 'ignore'` when that option is implemented
	return module.exports.apply(null, arguments).then(function (x) {
		return x.stdout;
	});
};

module.exports.stderr = function () {
	// TODO: set `stdout: 'ignore'` when that option is implemented
	return module.exports.apply(null, arguments).then(function (x) {
		return x.stderr;
	});
};

module.exports.shell = function (cmd, opts) {
	return handleShell(module.exports, cmd, opts);
};

module.exports.spawn = util.deprecate(module.exports, 'execa.spawn: just use execa instead.');

module.exports.sync = function (cmd, args, opts) {
	var parsed = handleArgs(cmd, args, opts);

	if (isStream(parsed.opts.input)) {
		throw new TypeError('The `input` option cannot be a stream in sync mode');
	}

	var result = childProcess.spawnSync(parsed.cmd, parsed.args, parsed.opts);

	if (parsed.opts.stripEof) {
		result.stdout = stripEof(result.stdout);
		result.stderr = stripEof(result.stderr);
	}

	return result;
};

module.exports.shellSync = function (cmd, opts) {
	return handleShell(module.exports.sync, cmd, opts);
};
