import assert from 'node:assert/strict';
import test from 'node:test';
import {isStream} from 'is-stream';
import {$} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
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

test('$ stdin has no default value when stdio is set', () => {
	assert.ok(isStream($({stdio: 'pipe'})`noop.js`.stdin));
});
