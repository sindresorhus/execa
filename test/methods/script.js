import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {isStream} from 'is-stream';
import {$, execa} from '../../index.js';
import {setFixtureDirectory, FIXTURES_DIRECTORY, FIXTURES_DIRECTORY_URL} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';

setFixtureDirectory();

const testScriptStdoutSync = (getSubprocess, expectedStdout) => {
	const {stdout} = getSubprocess();
	assert.equal(stdout, expectedStdout);
};

test('$.sync`...`', () => testScriptStdoutSync(() => $.sync`echo.js foo bar`, 'foo\nbar'));
test('$.s`...`', () => testScriptStdoutSync(() => $.s`echo.js foo bar`, 'foo\nbar'));
test('$(options).sync`...`', () => testScriptStdoutSync(() => $({stripFinalNewline: false}).sync`echo.js ${foobarString}`, `${foobarString}\n`));
test('$.sync(options)`...`', () => testScriptStdoutSync(() => $.sync({stripFinalNewline: false})`echo.js ${foobarString}`, `${foobarString}\n`));

test('Cannot call $.sync.sync', () => {
	assert.equal('sync' in $.sync, false);
});

test('Cannot call $.sync(options).sync', () => {
	assert.equal('sync' in $.sync({}), false);
});

test('$(options)() stdin defaults to "inherit"', async () => {
	const {stdout} = await $({input: foobarString})('stdin-script.js');
	assert.equal(stdout, foobarString);
});

test('$.sync(options)() stdin defaults to "inherit"', () => {
	const {stdout} = $.sync({input: foobarString})('stdin-script.js');
	assert.equal(stdout, foobarString);
});

test('$(options).sync() stdin defaults to "inherit"', () => {
	const {stdout} = $({input: foobarString}).sync('stdin-script.js');
	assert.equal(stdout, foobarString);
});

test('$(options)`...` stdin defaults to "inherit"', async () => {
	const {stdout} = await $({input: foobarString})`stdin-script.js`;
	assert.equal(stdout, foobarString);
});

test('$.sync(options)`...` stdin defaults to "inherit"', () => {
	const {stdout} = $.sync({input: foobarString})`stdin-script.js`;
	assert.equal(stdout, foobarString);
});

test('$(options).sync`...` stdin defaults to "inherit"', () => {
	const {stdout} = $({input: foobarString}).sync`stdin-script.js`;
	assert.equal(stdout, foobarString);
});

const testUndefinedScriptStdin = async method => {
	const {stdout} = await execa('stdin-script-undefined.js', [method], {input: foobarString});
	assert.equal(stdout, foobarString);
};

test('$(options) inherits stdin with an undefined stdin option', () => testUndefinedScriptStdin('async'));
test('$.sync(options) inherits stdin with an undefined stdin option', () => testUndefinedScriptStdin('sync'));

const testScriptStdinCall = async call => {
	const indexUrl = new URL('../../index.js', import.meta.url).href;
	const script = `import {$} from ${JSON.stringify(indexUrl)}; await ${call};`;
	const {stdout} = await execa('node', ['--input-type=module', '--eval', script], {input: foobarString, cwd: FIXTURES_DIRECTORY, timeout: 10_000});
	assert.equal(stdout, foobarString);
};

test('$ inherits stdin with per-call undefined options', () => testScriptStdinCall('$("node", ["stdin.js"], {stdin: undefined, stdout: "inherit", timeout: 5000})'));
test('$.sync inherits stdin with per-call undefined options', () => testScriptStdinCall('$.sync("node", ["stdin.js"], {stdin: undefined, stdout: "inherit", timeout: 5000})'));
test('$(options).sync inherits stdin with undefined options', () => testScriptStdinCall('$({stdin: undefined, stdout: "inherit", timeout: 5000}).sync("node", ["stdin.js"])'));
test('$(options) array syntax inherits stdin with undefined options', () => testScriptStdinCall('$({stdin: undefined, stdout: "inherit", timeout: 5000})("node", ["stdin.js"])'));

const testScriptInput = async (execaMethod, options) => {
	const {stdout} = await execaMethod({stdin: undefined, ...options})`stdin.js`;
	assert.equal(stdout, foobarString);
};

test('$ explicit input takes precedence over inherited stdin', () => testScriptInput($, {input: foobarString}));
test('$.sync explicit input takes precedence over inherited stdin', () => testScriptInput($.sync, {input: foobarString}));
test('$ explicit stdin iterable takes precedence over inherited stdin', () => testScriptInput($, {stdin: [[foobarString]]}));
test('$.sync explicit stdin iterable takes precedence over inherited stdin', () => testScriptInput($.sync, {stdin: [[foobarString]]}));

const testScriptInputFile = async execaMethod => {
	const inputFile = new URL('noop.js', FIXTURES_DIRECTORY_URL);
	const {stdout} = await execaMethod({stdin: undefined, inputFile, stripFinalNewline: false})`stdin.js`;
	assert.equal(stdout, await readFile(inputFile, 'utf8'));
};

test('$ inputFile takes precedence over inherited stdin', () => testScriptInputFile($));
test('$.sync inputFile takes precedence over inherited stdin', () => testScriptInputFile($.sync));

test('$ explicit stdin pipe takes precedence over inherited stdin', async () => {
	const subprocess = $({stdin: 'pipe'})`stdin.js`;
	subprocess.stdin.end(foobarString);
	const {stdout} = await subprocess;
	assert.equal(stdout, foobarString);
});

const testScriptIgnoreStdin = async execaMethod => {
	const {stdout} = await execaMethod({stdin: 'ignore'})`stdin.js`;
	assert.equal(stdout, '');
};

test('$ explicit ignored stdin takes precedence over inherited stdin', () => testScriptIgnoreStdin($));
test('$.sync explicit ignored stdin takes precedence over inherited stdin', () => testScriptIgnoreStdin($.sync));

test('$ stdio pipe takes precedence over inherited stdin', async () => {
	const subprocess = $({stdin: undefined, stdio: 'pipe'})`stdin.js`;
	subprocess.stdin.end(foobarString);
	const {stdout} = await subprocess;
	assert.equal(stdout, foobarString);
});

test('$.sync stdio pipe takes precedence over inherited stdin', () => {
	const {stdout} = $.sync({stdin: undefined, stdio: 'pipe'})`stdin.js`;
	assert.equal(stdout, '');
});

test('$ stdin has no default value when stdio is set', () => {
	assert.ok(isStream($({stdio: 'pipe'})`noop.js`.stdin));
});
