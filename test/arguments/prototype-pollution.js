import path from 'node:path';
import process from 'node:process';
import test from 'ava';
import {pathExists} from 'path-exists';
import tempfile from 'tempfile';
import {
	execa,
	execaSync,
	execaNode,
	$,
} from '../../index.js';
import {setFixtureDirectory, PATH_KEY, FIXTURES_DIRECTORY} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';

setFixtureDirectory();
process.env.FOO = 'foo';

/*
A polluted `Object.prototype` must not inject option values. Otherwise, any prototype pollution elsewhere in the process would let an attacker redirect the command, its input or its output.
Options are therefore always kept on null-prototype objects.
Those tests are serial since they temporarily modify `Object.prototype`.
*/
const pollutePrototype = (t, properties) => {
	t.teardown(() => {
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
	t.false(stdout.includes(pollutedBinaryDirectory));
};

test.serial('Polluted "preferLocal" and "localDir" are ignored', testPollutedPreferLocal, execa);
test.serial('Polluted "preferLocal" and "localDir" are ignored, sync', testPollutedPreferLocal, execaSync);

// `$` sets `preferLocal: true` itself, so only `localDir` can be injected
test.serial('Polluted "localDir" is ignored, $', async t => {
	pollutePrototype(t, {localDir: POLLUTED_LOCAL_DIRECTORY});

	const {stdout} = await $('node', printPath);
	t.false(stdout.includes(pollutedBinaryDirectory));
});

// The `stdout` option can redirect the output to an arbitrary file
const testPollutedStdout = async (t, execaMethod) => {
	const filePath = tempfile();
	pollutePrototype(t, {stdout: {file: filePath}});

	const {stdout} = await execaMethod('noop.js', [foobarString]);
	t.is(stdout, foobarString);
	t.false(await pathExists(filePath));
};

test.serial('Polluted "stdout" is ignored', testPollutedStdout, execa);
test.serial('Polluted "stdout" is ignored, sync', testPollutedStdout, execaSync);

// The `stdin` option can feed the contents of an arbitrary file to the subprocess
test.serial('Polluted "stdin" is ignored', async t => {
	pollutePrototype(t, {stdin: {file: 'noop.js'}});

	const subprocess = execa('stdin.js');
	subprocess.stdin.end(foobarString);
	const {stdout} = await subprocess;
	t.is(stdout, foobarString);
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
	t.false(isVerboseCalled);
};

test.serial('Polluted "verbose" is ignored', testPollutedVerbose, execa);
test.serial('Polluted "verbose" is ignored, sync', testPollutedVerbose, execaSync);
test.serial('Polluted "verbose" is ignored, $', testPollutedVerbose, $);
// `execaNode()` resolves the file from the current directory, not from `PATH`
test.serial('Polluted "verbose" is ignored, execaNode()', testPollutedVerbose, (file, commandArguments) => execaNode(path.join(FIXTURES_DIRECTORY, file), commandArguments));
test.serial('Polluted "verbose" is ignored, .pipe()', testPollutedVerbose, (file, commandArguments) => execa('empty.js').pipe(file, commandArguments));

test.serial('Polluted "extendEnv" is ignored', async t => {
	pollutePrototype(t, {extendEnv: false});

	const {stdout} = await execa('environment.js', [], {env: {BAR: 'bar', [PATH_KEY]: process.env[PATH_KEY]}});
	t.deepEqual(stdout.split('\n'), ['foo', 'bar']);
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
	t.true(verboseObjects.length > 0);
	t.true(verboseObjects.every(({piped}) => piped === false));
};

test.serial('Polluted "piped" is ignored', testPollutedPiped, execa);
test.serial('Polluted "piped" is ignored, sync', testPollutedPiped, execaSync);

/*
`mapArguments()` returns `{options, isSync}`, which are method-specific. Neither is a user-facing option.
A polluted `options` would replace every option at once, and a polluted `isSync` would switch the execution mode.
*/
const testPollutedMappedOptions = async (t, execaMethod) => {
	pollutePrototype(t, {options: {cwd: path.resolve('/')}});

	const {cwd} = await execaMethod('noop.js', [foobarString]);
	t.is(cwd, process.cwd());
};

test.serial('Polluted "options" is ignored', testPollutedMappedOptions, execa);
test.serial('Polluted "options" is ignored, sync', testPollutedMappedOptions, execaSync);

const testPollutedIsSync = async (t, execaMethod) => {
	pollutePrototype(t, {isSync: true});

	const subprocess = execaMethod('noop.js', [foobarString]);
	t.is(typeof subprocess.kill, 'function');
	const {stdout} = await subprocess;
	t.is(stdout, foobarString);
};

test.serial('Polluted "isSync" is ignored', testPollutedIsSync, execa);
test.serial('Polluted "isSync" is ignored, $', testPollutedIsSync, $);
test.serial('Polluted "isSync" is ignored, execaNode()', testPollutedIsSync, (file, commandArguments) => execaNode(path.join(FIXTURES_DIRECTORY, file), commandArguments));

test.serial('Polluted "cancelSignal" is ignored', async t => {
	pollutePrototype(t, {cancelSignal: {}});

	const {stdout} = await execa('noop.js', [foobarString]);
	t.is(stdout, foobarString);
});

// Template expressions detect subprocess results with their `stdout`/`isMaxBuffer` properties. Using the `in` operator would let a polluted `Object.prototype.stdout` turn any plain object into an interpolated command argument.
test.serial('Polluted "stdout" is not interpolated in template expressions', t => {
	pollutePrototype(t, {stdout: foobarString});

	t.throws(() => $`noop.js ${{}}`, {message: /Unexpected "object" in template expression/});
});

// A result with `stdout: 'ignore'` has no own `stdout` property, so it must not read the polluted one
test.serial('Polluted "stdout" is not read from template expression results', t => {
	pollutePrototype(t, {stdout: foobarString});

	t.throws(() => $`noop.js ${$({stdio: 'ignore'}).sync`noop.js`}`, {message: /Missing result.stdout/});
});

/*
Unlike the options, `child_process` intentionally passes the inherited properties of the `env` option to the subprocess.
A polluted `PATH` decides which file the command resolves to, so the environment is kept on a null-prototype object too.
*/
const testPollutedEnvironment = async (t, execaMethod, options) => {
	pollutePrototype(t, {POLLUTED_VARIABLE: 'polluted'});

	const {stdout} = await execaMethod(process.execPath, ['-p', 'process.env.POLLUTED_VARIABLE'], options);
	t.is(stdout, 'undefined');
};

test.serial('Polluted environment variables are ignored', testPollutedEnvironment, execa, {});
test.serial('Polluted environment variables are ignored, sync', testPollutedEnvironment, execaSync, {});
test.serial('Polluted environment variables are ignored, extendEnv false', testPollutedEnvironment, execa, {extendEnv: false});
test.serial('Polluted environment variables are ignored, preferLocal', testPollutedEnvironment, execa, {preferLocal: true});

const testPollutedPath = async (t, execaMethod) => {
	pollutePrototype(t, {[PATH_KEY]: POLLUTED_LOCAL_DIRECTORY});

	const {stdout} = await execaMethod(process.execPath, printPath, {extendEnv: false});
	t.is(stdout, 'undefined');
};

test.serial('Polluted PATH is ignored', testPollutedPath, execa);
test.serial('Polluted PATH is ignored, sync', testPollutedPath, execaSync);
