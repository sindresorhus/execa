'use strict';
var childProcess = require('child_process');
var util = require('util');
var crossSpawn = require('cross-spawn');
var stripEof = require('strip-eof');
var objectAssign = require('object-assign');
var npmRunPath = require('npm-run-path');
var isStream = require('is-stream');
var _getStream = require('get-stream');
var pathKey = require('path-key')();
var onExit = require('signal-exit');
var errname = require('./lib/errname');

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
		parsed = crossSpawn._parse(cmd, args, opts);
	}

	opts = objectAssign({
		maxBuffer: TEN_MEBIBYTE,
		stripEof: true,
		preferLocal: true,
		encoding: 'utf8',
		reject: true,
		cleanup: true
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

function getStream(process, stream, encoding, maxBuffer) {
	if (!process[stream]) {
		return null;
	}

	var ret;

	if (encoding) {
		ret = _getStream(process[stream], {
			encoding: encoding,
			maxBuffer: maxBuffer
		});
	} else {
		ret = _getStream.buffer(process[stream], {maxBuffer: maxBuffer});
	}

	return ret.catch(function (err) {
		err.stream = stream;
		err.message = stream + ' ' + err.message;
		throw err;
	});
}

function processDone(spawned) {
	return new Promise(function (resolve) {
		spawned.on('exit', function (code, signal) {
			resolve({
				code: code,
				signal: signal
			});
		});

		spawned.on('error', function (err) {
			resolve({err: err});
		});
	});
}

module.exports = function (cmd, args, opts) {
	var joinedCmd = cmd;

	if (Array.isArray(args) && args.length) {
		joinedCmd += ' ' + args.join(' ');
	}

	var parsed = handleArgs(cmd, args, opts);
	var encoding = parsed.opts.encoding;
	var maxBuffer = parsed.opts.maxBuffer;
	var spawned = childProcess.spawn(parsed.cmd, parsed.args, parsed.opts);

	var removeExitHandler;
	if (parsed.opts.cleanup) {
		removeExitHandler = onExit(function () {
			spawned.kill();
		});
	}

	var promise = Promise.all([
		processDone(spawned),
		getStream(spawned, 'stdout', encoding, maxBuffer),
		getStream(spawned, 'stderr', encoding, maxBuffer)
	]).then(function (arr) {
		var result = arr[0];
		var stdout = arr[1];
		var stderr = arr[2];

		var err = result.err;
		var code = result.code;
		var signal = result.signal;

		if (removeExitHandler) {
			removeExitHandler();
		}

		if (err || code !== 0 || signal !== null) {
			if (!err) {
				err = new Error('Command failed: ' + joinedCmd + '\n' + stderr + stdout);

				err.code = code < 0 ? errname(code) : code;
			}

			// TODO: missing some timeout logic for killed
			// https://github.com/nodejs/node/blob/master/lib/child_process.js#L203
			// err.killed = spawned.killed || killed;
			err.killed = err.killed || spawned.killed;

			err.stdout = stdout;
			err.stderr = stderr;
			err.failed = true;
			err.signal = signal || null;
			err.cmd = joinedCmd;

			if (!parsed.opts.reject) {
				return err;
			}

			throw err;
		}

		return {
			stdout: handleOutput(parsed.opts, stdout),
			stderr: handleOutput(parsed.opts, stderr),
			code: 0,
			failed: false,
			killed: false,
			signal: null,
			cmd: joinedCmd
		};
	});

	crossSpawn._enoent.hookChildProcess(spawned, parsed);

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

module.exports.spawn = util.deprecate(module.exports, 'execa.spawn() is deprecated. Use execa() instead.');

module.exports.sync = function (cmd, args, opts) {
	var parsed = handleArgs(cmd, args, opts);

	if (isStream(parsed.opts.input)) {
		throw new TypeError('The `input` option cannot be a stream in sync mode');
	}

	var result = childProcess.spawnSync(parsed.cmd, parsed.args, parsed.opts);

	result.stdout = handleOutput(parsed.opts, result.stdout);
	result.stderr = handleOutput(parsed.opts, result.stderr);

	return result;
};

module.exports.shellSync = function (cmd, opts) {
	return handleShell(module.exports.sync, cmd, opts);
};
