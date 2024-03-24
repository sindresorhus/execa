import test from 'ava';
import {isStream} from 'is-stream';
import {$} from '../index.js';
import {setFixtureDir} from './helpers/fixtures-dir.js';
import {foobarString} from './helpers/input.js';

setFixtureDir();

const testScriptStdoutSync = (t, getSubprocess, expectedStdout) => {
	const {stdout} = getSubprocess();
	t.is(stdout, expectedStdout);
};

test('$.sync`...`', testScriptStdoutSync, () => $.sync`echo.js foo bar`, 'foo\nbar');
test('$.s`...`', testScriptStdoutSync, () => $.s`echo.js foo bar`, 'foo\nbar');
test('$(options).sync`...`', testScriptStdoutSync, () => $({stripFinalNewline: false}).sync`echo.js ${foobarString}`, `${foobarString}\n`);
test('$.sync(options)`...`', testScriptStdoutSync, () => $.sync({stripFinalNewline: false})`echo.js ${foobarString}`, `${foobarString}\n`);

test('Cannot call $.sync.sync', t => {
	t.false('sync' in $.sync);
});

test('Cannot call $.sync(options).sync', t => {
	t.false('sync' in $.sync({}));
});

test('$(options)() stdin defaults to "inherit"', async t => {
	const {stdout} = await $({input: foobarString})('stdin-script.js');
	t.is(stdout, foobarString);
});

test('$.sync(options)() stdin defaults to "inherit"', t => {
	const {stdout} = $.sync({input: foobarString})('stdin-script.js');
	t.is(stdout, foobarString);
});

test('$(options).sync() stdin defaults to "inherit"', t => {
	const {stdout} = $({input: foobarString}).sync('stdin-script.js');
	t.is(stdout, foobarString);
});

test('$(options)`...` stdin defaults to "inherit"', async t => {
	const {stdout} = await $({input: foobarString})`stdin-script.js`;
	t.is(stdout, foobarString);
});

test('$.sync(options)`...` stdin defaults to "inherit"', t => {
	const {stdout} = $.sync({input: foobarString})`stdin-script.js`;
	t.is(stdout, foobarString);
});

test('$(options).sync`...` stdin defaults to "inherit"', t => {
	const {stdout} = $({input: foobarString}).sync`stdin-script.js`;
	t.is(stdout, foobarString);
});

test('$ stdin has no default value when stdio is set', t => {
	t.true(isStream($({stdio: 'pipe'})`noop.js`.stdin));
});
