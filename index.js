'use strict';
var childProcess = require('child_process');
var crossSpawnAsync = require('cross-spawn-async');
var stripEof = require('strip-eof');
var objectAssign = require('object-assign');
var npmRunPath = require('npm-run-path');
var isStream = require('is-stream');
var split = require('split');
var pathKey = require('path-key')();

function tryRequireObservable() {
	if (typeof global.Observable === 'function') {
		return global.Observable;
	}

	try {
		return require('zen-observable');
	} catch (err) {
		try {
			// You need to import rxjs specific methods as well:
			//   require('rxjs/add/operator/map');
			//
			// See: https://github.com/ReactiveX/RxJS#commonjs-via-npm
			//
			// Should we just import all of them? `execa` really can't be used outside node anyways.
			return require('rxjs/Observable').Observable;
		} catch (err) {
			return null;
		}
	}
}

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
	if (opts.stripEof) {
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

		handleInput(spawned, parsed.opts);
	});

	if (opts && (opts.stdout === 'observable' || (opts.stdout && opts.stdout.observable))) {
		var Observable = tryRequireObservable();

		if (!Observable) {
			// reject the promise?
			// write to stdout / stderr and process.exit()?
			throw new Error('Observable Not Found');
		}

		var observableTransform = opts.stdout.transform || split();
		var stdout = spawned.stdout;

		promise.stdout = new Observable(function (observer) {
			promise = promise
				.catch(function (err) {
					observer.error(err);
					throw err;
				})
				.then(function (result) {
					observer.complete();
					return result;
				});

			stdout
				.pipe(observableTransform)
				.on('data', function (line) {
					observer.next(line);
				});
			// Error handling on the stream?
		});
	}

	promise.kill = spawned.kill.bind(spawned);
	promise.pid = spawned.pid;

	return promise;
};

module.exports.shell = function (cmd, opts) {
	return handleShell(module.exports, cmd, opts);
};

module.exports.spawn = function (cmd, args, opts) {
	var parsed = handleArgs(cmd, args, opts);
	var spawned = childProcess.spawn(parsed.cmd, parsed.args, parsed.opts);

	crossSpawnAsync._enoent.hookChildProcess(spawned, parsed);

	return spawned;
};

module.exports.sync = function (cmd, args, opts) {
	var parsed = handleArgs(cmd, args, opts);

	if (isStream(parsed.opts.input)) {
		throw new TypeError('The `input` option cannot be a stream in sync mode');
	}

	var out = childProcess.execFileSync(parsed.cmd, parsed.args, parsed.opts);

	return handleOutput(parsed.opts, out);
};

module.exports.shellSync = function (cmd, opts) {
	return handleShell(module.exports.sync, cmd, opts);
};
