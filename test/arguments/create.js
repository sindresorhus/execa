import {join} from 'node:path';
import test from 'ava';
import {execa, execaSync, execaNode, $} from '../../index.js';
import {foobarString, foobarArray, foobarUppercase} from '../helpers/input.js';
import {uppercaseGenerator} from '../helpers/generator.js';
import {setFixtureDir, FIXTURES_DIR} from '../helpers/fixtures-dir.js';

setFixtureDir();
const NOOP_PATH = join(FIXTURES_DIR, 'noop.js');
const PRINT_ENV_PATH = join(FIXTURES_DIR, 'environment.js');

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

const testBindUndefined = async (t, execaMethod) => {
	const {stdout} = await execaMethod({stripFinalNewline: false})(NOOP_PATH, [foobarString], {stripFinalNewline: undefined});
	t.is(stdout, foobarString);
};

test('execa() undefined options use default value', testBindUndefined, execa);
test('execaSync() undefined options use default value', testBindUndefined, execaSync);
test('execaNode() undefined options use default value', testBindUndefined, execaNode);
test('$ undefined options use default value', testBindUndefined, $);
test('$.sync undefined options use default value', testBindUndefined, $.sync);

const testMergeEnv = async (t, execaMethod) => {
	const {stdout} = await execaMethod({env: {FOO: 'foo'}})(PRINT_ENV_PATH, {env: {BAR: 'bar'}});
	t.is(stdout, 'foo\nbar');
};

test('execa() bound options are merged', testMergeEnv, execa);
test('execaSync() bound options are merged', testMergeEnv, execaSync);
test('execaNode() bound options are merged', testMergeEnv, execaNode);
test('$ bound options are merged', testMergeEnv, $);
test('$.sync bound options are merged', testMergeEnv, $.sync);

const testMergeMultiple = async (t, execaMethod) => {
	const {stdout} = await execaMethod({env: {FOO: 'baz'}})({env: {BAR: 'bar'}})(PRINT_ENV_PATH, {env: {FOO: 'foo'}});
	t.is(stdout, 'foo\nbar');
};

test('execa() bound options are merged multiple times', testMergeMultiple, execa);
test('execaSync() bound options are merged multiple times', testMergeMultiple, execaSync);
test('execaNode() bound options are merged multiple times', testMergeMultiple, execaNode);
test('$ bound options are merged multiple times', testMergeMultiple, $);
test('$.sync bound options are merged multiple times', testMergeMultiple, $.sync);

const testMergeFdSpecific = async (t, execaMethod) => {
	const {isMaxBuffer, shortMessage} = await t.throwsAsync(execaMethod({maxBuffer: {stdout: 1}})(NOOP_PATH, [foobarString], {maxBuffer: {stderr: 100}}));
	t.true(isMaxBuffer);
	t.true(shortMessage.includes('Command\'s stdout was larger than 1'));
};

test('execa() bound options merge fd-specific ones', testMergeFdSpecific, execa);
test('execaNode() bound options merge fd-specific ones', testMergeFdSpecific, execaNode);
test('$ bound options merge fd-specific ones', testMergeFdSpecific, $);

const testMergeEnvUndefined = async (t, execaMethod) => {
	const {stdout} = await execaMethod({env: {FOO: 'foo'}})(PRINT_ENV_PATH, {env: {BAR: undefined}});
	t.is(stdout, 'foo\nundefined');
};

test('execa() bound options are merged even if undefined', testMergeEnvUndefined, execa);
test('execaSync() bound options are merged even if undefined', testMergeEnvUndefined, execaSync);
test('execaNode() bound options are merged even if undefined', testMergeEnvUndefined, execaNode);
test('$ bound options are merged even if undefined', testMergeEnvUndefined, $);
test('$.sync bound options are merged even if undefined', testMergeEnvUndefined, $.sync);

const testMergeSpecific = async (t, execaMethod) => {
	const {stdout} = await execaMethod({stdout: {transform: uppercaseGenerator().transform, objectMode: true}})(NOOP_PATH, {stdout: {transform: uppercaseGenerator().transform}});
	t.is(stdout, foobarUppercase);
};

test('execa() bound options only merge specific ones', testMergeSpecific, execa);
test('execaSync() bound options only merge specific ones', testMergeSpecific, execaSync);
test('execaNode() bound options only merge specific ones', testMergeSpecific, execaNode);
test('$ bound options only merge specific ones', testMergeSpecific, $);
test('$.sync bound options only merge specific ones', testMergeSpecific, $.sync);

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
