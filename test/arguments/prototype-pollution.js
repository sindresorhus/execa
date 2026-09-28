import assert from 'node:assert/strict';
import path from 'node:path';
import process from 'node:process';
import test from 'node:test';
import {text} from 'node:stream/consumers';
import tempfile from 'tempfile';
import {pathExists} from 'path-exists';
import {
	execa,
	execaSync,
	execaNode,
	$,
} from '../../index.js';
import {assertThrows} from '../helpers/assert.js';
import {setFixtureDirectory, PATH_KEY, FIXTURES_DIRECTORY} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';

setFixtureDirectory();
process.env.FOO = 'foo';

/*
A polluted `Object.prototype` must not inject option values. Otherwise, any prototype pollution elsewhere in the process would let an attacker redirect the command, its input or its output.
Options are therefore always kept on null-prototype objects.
Those tests must run one at a time since they temporarily modify `Object.prototype`.
*/
const pollutePrototype = (t, properties) => {
	t.after(() => {
		for (const property of Object.keys(properties)) {
			delete Object.prototype[property];
		}
	});

	Object.assign(Object.prototype, properties);
};

const printPath = ['-p', 'process.env.PATH ?? process.env.Path'];
const POLLUTED_LOCAL_DIRECTORY = path.resolve('/pollutedLocalDirectory');
const pollutedBinaryDirectory = path.join(POLLUTED_LOCAL_DIRECTORY, 'node_modules', '.bin');

// The `preferLocal` and `localDir` options prepend a directory to `PATH`, which decides which file the command resolves to
const testPollutedPreferLocal = async (t, execaMethod) => {
	pollutePrototype(t, {preferLocal: true, localDir: POLLUTED_LOCAL_DIRECTORY});

	const {stdout} = await execaMethod('node', printPath);
	assert.ok(!stdout.includes(pollutedBinaryDirectory));
};

test('Polluted "preferLocal" and "localDir" are ignored', t => testPollutedPreferLocal(t, execa));
test('Polluted "preferLocal" and "localDir" are ignored, sync', t => testPollutedPreferLocal(t, execaSync));

// `$` sets `preferLocal: true` itself, so only `localDir` can be injected
test('Polluted "localDir" is ignored, $', async t => {
	pollutePrototype(t, {localDir: POLLUTED_LOCAL_DIRECTORY});

	const {stdout} = await $('node', printPath);
	assert.ok(!stdout.includes(pollutedBinaryDirectory));
});

// The `stdout` option can redirect the output to an arbitrary file
const testPollutedStdout = async (t, execaMethod) => {
	const filePath = tempfile();
	pollutePrototype(t, {stdout: {file: filePath}});

	const {stdout} = await execaMethod('noop.js', [foobarString]);
	assert.equal(stdout, foobarString);
	assert.ok(!await pathExists(filePath));
};

test('Polluted "stdout" is ignored', t => testPollutedStdout(t, execa));
test('Polluted "stdout" is ignored, sync', t => testPollutedStdout(t, execaSync));

// The `stdin` option can feed the contents of an arbitrary file to the subprocess
test('Polluted "stdin" is ignored', async t => {
	pollutePrototype(t, {stdin: {file: 'noop.js'}});

	const subprocess = execa('stdin.js');
	subprocess.stdin.end(foobarString);
	const {stdout} = await subprocess;
	assert.equal(stdout, foobarString);
});

// The `verbose` option can be a function, which Execa calls with each log line
const testPollutedVerbose = async (t, execaMethod) => {
	let isVerboseCalled = false;
	pollutePrototype(t, {
		verbose() {
			isVerboseCalled = true;
		},
	});

	await execaMethod('noop.js', [foobarString]);
	assert.equal(isVerboseCalled, false);
};

test('Polluted "verbose" is ignored', t => testPollutedVerbose(t, execa));
test('Polluted "verbose" is ignored, sync', t => testPollutedVerbose(t, execaSync));
test('Polluted "verbose" is ignored, $', t => testPollutedVerbose(t, $));
// `execaNode()` resolves the file from the current directory, not from `PATH`
test('Polluted "verbose" is ignored, execaNode()', t => testPollutedVerbose(t, (file, commandArguments) => execaNode(path.join(FIXTURES_DIRECTORY, file), commandArguments)));
test('Polluted "verbose" is ignored, .pipe()', t => testPollutedVerbose(t, (file, commandArguments) => execa('empty.js').pipe(file, commandArguments)));

test('Polluted "extendEnv" is ignored', async t => {
	pollutePrototype(t, {extendEnv: false});

	const {stdout} = await execa('environment.js', [], {env: {BAR: 'bar', [PATH_KEY]: process.env[PATH_KEY]}});
	assert.deepEqual(stdout.split('\n'), ['foo', 'bar']);
});

// `piped` is set by Execa itself, only when using `.pipe()`. It decides which icon the `verbose` option prints.
const testPollutedPiped = async (t, execaMethod) => {
	pollutePrototype(t, {piped: true});

	const verboseObjects = [];
	await execaMethod('noop.js', [foobarString], {
		verbose(verboseLine, verboseObject) {
			verboseObjects.push(verboseObject);
		},
	});
	assert.ok(verboseObjects.length > 0);
	assert.ok(verboseObjects.every(({piped}) => piped === false));
};

test('Polluted "piped" is ignored', t => testPollutedPiped(t, execa));
test('Polluted "piped" is ignored, sync', t => testPollutedPiped(t, execaSync));

/*
`mapArguments()` returns `{options, isSync}`, which are method-specific. Neither is a user-facing option.
A polluted `options` would replace every option at once, and a polluted `isSync` would switch the execution mode.
*/
const testPollutedMappedOptions = async (t, execaMethod) => {
	pollutePrototype(t, {options: {cwd: path.resolve('/')}});

	const {cwd} = await execaMethod('noop.js', [foobarString]);
	assert.equal(cwd, process.cwd());
};

test('Polluted "options" is ignored', t => testPollutedMappedOptions(t, execa));
test('Polluted "options" is ignored, sync', t => testPollutedMappedOptions(t, execaSync));

const testPollutedIsSync = async (t, execaMethod) => {
	pollutePrototype(t, {isSync: true});

	const subprocess = execaMethod('noop.js', [foobarString]);
	assert.equal(typeof subprocess.kill, 'function');
	const {stdout} = await subprocess;
	assert.equal(stdout, foobarString);
};

test('Polluted "isSync" is ignored', t => testPollutedIsSync(t, execa));
test('Polluted "isSync" is ignored, $', t => testPollutedIsSync(t, $));
test('Polluted "isSync" is ignored, execaNode()', t => testPollutedIsSync(t, (file, commandArguments) => execaNode(path.join(FIXTURES_DIRECTORY, file), commandArguments)));

test('Polluted "cancelSignal" is ignored', async t => {
	pollutePrototype(t, {cancelSignal: {}});

	const {stdout} = await execa('noop.js', [foobarString]);
	assert.equal(stdout, foobarString);
});

// Template expressions detect subprocess results with their `stdout`/`isMaxBuffer` properties. Using the `in` operator would let a polluted `Object.prototype.stdout` turn any plain object into an interpolated command argument.
test('Polluted "stdout" is not interpolated in template expressions', t => {
	pollutePrototype(t, {stdout: foobarString});

	assertThrows(() => $`noop.js ${{}}`, {message: /Unexpected "object" in template expression/});
});

// A result with `stdout: 'ignore'` has no own `stdout` property, so it must not read the polluted one
test('Polluted "stdout" is not read from template expression results', t => {
	pollutePrototype(t, {stdout: foobarString});

	assertThrows(() => $`noop.js ${$({stdio: 'ignore'}).sync`noop.js`}`, {message: /Missing result.stdout/});
});

/*
Unlike the options, `child_process` intentionally passes the inherited properties of the `env` option to the subprocess.
A polluted `PATH` decides which file the command resolves to, so the environment is kept on a null-prototype object too.
*/
const testPollutedEnvironment = async (t, execaMethod, options) => {
	pollutePrototype(t, {POLLUTED_VARIABLE: 'polluted'});

	const {stdout} = await execaMethod(process.execPath, ['-p', 'process.env.POLLUTED_VARIABLE'], options);
	assert.equal(stdout, 'undefined');
};

test('Polluted environment variables are ignored', t => testPollutedEnvironment(t, execa, {}));
test('Polluted environment variables are ignored, sync', t => testPollutedEnvironment(t, execaSync, {}));
test('Polluted environment variables are ignored, extendEnv false', t => testPollutedEnvironment(t, execa, {extendEnv: false}));
test('Polluted environment variables are ignored, preferLocal', t => testPollutedEnvironment(t, execa, {preferLocal: true}));

const testPollutedPath = async (t, execaMethod) => {
	pollutePrototype(t, {[PATH_KEY]: POLLUTED_LOCAL_DIRECTORY});

	const {stdout} = await execaMethod(process.execPath, printPath, {extendEnv: false});
	assert.equal(stdout, 'undefined');
};

test('Polluted PATH is ignored', t => testPollutedPath(t, execa));
test('Polluted PATH is ignored, sync', t => testPollutedPath(t, execaSync));

// The options of `subprocess.pipe()`, `subprocess.readable()` and `subprocess.iterable()` must not be injected either, e.g. `from` can read another file descriptor instead
const stdoutString = 'public';

const testPollutedFrom = async (t, readOutput) => {
	pollutePrototype(t, {from: 'stderr'});

	const subprocess = execa('noop-both.js', [stdoutString, foobarString]);
	assert.equal(await readOutput(subprocess), stdoutString);
	await subprocess;
};

test('Polluted "from" is ignored, .pipe()', t => testPollutedFrom(t, async subprocess => {
	const {stdout} = await subprocess.pipe(execa('stdin.js'));
	return stdout;
}));
test('Polluted "from" is ignored, .pipe``', t => testPollutedFrom(t, async subprocess => {
	const {stdout} = await subprocess.pipe`stdin.js`;
	return stdout;
}));
test('Polluted "from" is ignored, .readable()', t => testPollutedFrom(t, async subprocess => {
	const output = await text(subprocess.readable({}));
	return output.trim();
}));
test('Polluted "from" is ignored, .iterable()', t => testPollutedFrom(t, async subprocess => {
	const lines = await Array.fromAsync(subprocess.iterable({}));
	return lines.join('');
}));

// The options of the IPC methods must not be injected either, e.g. `filter` can drop every message
test('Polluted "filter" is ignored, .getOneMessage()', async t => {
	pollutePrototype(t, {filter: () => false});

	const subprocess = execa('ipc-send.js', {ipc: true});
	assert.equal(await subprocess.getOneMessage(), foobarString);
	await subprocess;
});

// The result of a successful subprocess has no `error` property, which must not be read from the prototype
test('Polluted "error" is ignored', async t => {
	pollutePrototype(t, {error: foobarString});

	const {failed} = await execa('empty.js');
	assert.equal(failed, false);
});

// An early error has a `failed` property, which must not be read from the prototype of `child_process.spawnSync()`'s result
test('Polluted "failed" is ignored, sync', t => {
	pollutePrototype(t, {failed: true});

	const {stdout} = execaSync('noop.js', [foobarString]);
	assert.equal(stdout, foobarString);
});

// A subprocess which failed to spawn has no output, which must not read its `error` from the prototype
test('Polluted "error" is ignored, sync early error', t => {
	pollutePrototype(t, {error: foobarString});

	const {code} = execaSync('non-existent-command', {reject: false});
	assert.equal(code, 'ENOENT');
});
