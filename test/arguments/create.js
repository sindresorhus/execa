import {join} from 'node:path';
import test from 'ava';
import {execa, execaSync, execaNode, $} from '../../index.js';
import {foobarString, foobarArray} from '../helpers/input.js';
import {setFixtureDir, FIXTURES_DIR} from '../helpers/fixtures-dir.js';

setFixtureDir();
const NOOP_PATH = join(FIXTURES_DIR, 'noop.js');

const testTemplate = async (t, execaMethod) => {
	const {stdout} = await execaMethod`${NOOP_PATH} ${foobarString}`;
	t.is(stdout, foobarString);
};

test('execa() can use template strings', testTemplate, execa);
test('execaNode() can use template strings', testTemplate, execaNode);
test('$ can use template strings', testTemplate, $);

const testTemplateSync = (t, execaMethod) => {
	const {stdout} = execaMethod`${NOOP_PATH} ${foobarString}`;
	t.is(stdout, foobarString);
};

test('execaSync() can use template strings', testTemplateSync, execaSync);
test('$.sync can use template strings', testTemplateSync, $.sync);

const testTemplateOptions = async (t, execaMethod) => {
	const {stdout} = await execaMethod({stripFinalNewline: false})`${NOOP_PATH} ${foobarString}`;
	t.is(stdout, `${foobarString}\n`);
};

test('execa() can use template strings with options', testTemplateOptions, execa);
test('execaNode() can use template strings with options', testTemplateOptions, execaNode);
test('$ can use template strings with options', testTemplateOptions, $);

const testTemplateOptionsSync = (t, execaMethod) => {
	const {stdout} = execaMethod({stripFinalNewline: false})`${NOOP_PATH} ${foobarString}`;
	t.is(stdout, `${foobarString}\n`);
};

test('execaSync() can use template strings with options', testTemplateOptionsSync, execaSync);
test('$.sync can use template strings with options', testTemplateOptionsSync, $.sync);

const testBindOptions = async (t, execaMethod) => {
	const {stdout} = await execaMethod({stripFinalNewline: false})(NOOP_PATH, [foobarString]);
	t.is(stdout, `${foobarString}\n`);
};

test('execa() can bind options', testBindOptions, execa);
test('execaNode() can bind options', testBindOptions, execaNode);
test('$ can bind options', testBindOptions, $);

const testBindOptionsSync = (t, execaMethod) => {
	const {stdout} = execaMethod({stripFinalNewline: false})(NOOP_PATH, [foobarString]);
	t.is(stdout, `${foobarString}\n`);
};

test('execaSync() can bind options', testBindOptionsSync, execaSync);
test('$.sync can bind options', testBindOptionsSync, $.sync);

const testBindPriority = async (t, execaMethod) => {
	const {stdout} = await execaMethod({stripFinalNewline: false})(NOOP_PATH, [foobarString], {stripFinalNewline: true});
	t.is(stdout, foobarString);
};

test('execa() bound options have lower priority', testBindPriority, execa);
test('execaSync() bound options have lower priority', testBindPriority, execaSync);
test('execaNode() bound options have lower priority', testBindPriority, execaNode);
test('$ bound options have lower priority', testBindPriority, $);
test('$.sync bound options have lower priority', testBindPriority, $.sync);

const testSpacedCommand = async (t, args, execaMethod) => {
	const {stdout} = await execaMethod('command with space.js', args);
	const expectedStdout = args === undefined ? '' : args.join('\n');
	t.is(stdout, expectedStdout);
};

test('allow commands with spaces and no array arguments', testSpacedCommand, undefined, execa);
test('allow commands with spaces and array arguments', testSpacedCommand, foobarArray, execa);
test('allow commands with spaces and no array arguments, execaSync', testSpacedCommand, undefined, execaSync);
test('allow commands with spaces and array arguments, execaSync', testSpacedCommand, foobarArray, execaSync);
test('allow commands with spaces and no array arguments, $', testSpacedCommand, undefined, $);
test('allow commands with spaces and array arguments, $', testSpacedCommand, foobarArray, $);
test('allow commands with spaces and no array arguments, $.sync', testSpacedCommand, undefined, $.sync);
test('allow commands with spaces and array arguments, $.sync', testSpacedCommand, foobarArray, $.sync);
