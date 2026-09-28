import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import {assertRejects} from '../helpers/assert.js';
import {
	execa,
	execaSync,
	execaNode,
	$,
} from '../../index.js';
import {foobarString, foobarUppercase} from '../helpers/input.js';
import {uppercaseGenerator} from '../helpers/generator.js';
import {setFixtureDirectory, FIXTURES_DIRECTORY} from '../helpers/fixtures-directory.js';

setFixtureDirectory();

const NOOP_PATH = path.join(FIXTURES_DIRECTORY, 'noop.js');
const PRINT_ENV_PATH = path.join(FIXTURES_DIRECTORY, 'environment.js');

const testBindOptions = async execaMethod => {
	const {stdout} = await execaMethod({stripFinalNewline: false})(NOOP_PATH, [foobarString]);
	assert.equal(stdout, `${foobarString}\n`);
};

test('execa() can bind options', () => testBindOptions(execa));
test('execaNode() can bind options', () => testBindOptions(execaNode));
test('$ can bind options', () => testBindOptions($));

const testBindOptionsSync = execaMethod => {
	const {stdout} = execaMethod({stripFinalNewline: false})(NOOP_PATH, [foobarString]);
	assert.equal(stdout, `${foobarString}\n`);
};

test('execaSync() can bind options', () => testBindOptionsSync(execaSync));
test('$.sync can bind options', () => testBindOptionsSync($.sync));

const testBindPriority = async execaMethod => {
	const {stdout} = await execaMethod({stripFinalNewline: false})(NOOP_PATH, [foobarString], {stripFinalNewline: true});
	assert.equal(stdout, foobarString);
};

test('execa() bound options have lower priority', () => testBindPriority(execa));
test('execaSync() bound options have lower priority', () => testBindPriority(execaSync));
test('execaNode() bound options have lower priority', () => testBindPriority(execaNode));
test('$ bound options have lower priority', () => testBindPriority($));
test('$.sync bound options have lower priority', () => testBindPriority($.sync));

const testBindUndefined = async execaMethod => {
	const {stdout} = await execaMethod({stripFinalNewline: false})(NOOP_PATH, [foobarString], {stripFinalNewline: undefined});
	assert.equal(stdout, foobarString);
};

test('execa() undefined options use default value', () => testBindUndefined(execa));
test('execaSync() undefined options use default value', () => testBindUndefined(execaSync));
test('execaNode() undefined options use default value', () => testBindUndefined(execaNode));
test('$ undefined options use default value', () => testBindUndefined($));
test('$.sync undefined options use default value', () => testBindUndefined($.sync));

const testMergeEnv = async execaMethod => {
	const {stdout} = await execaMethod({env: {FOO: 'foo'}})(PRINT_ENV_PATH, {env: {BAR: 'bar'}});
	assert.equal(stdout, 'foo\nbar');
};

test('execa() bound options are merged', () => testMergeEnv(execa));
test('execaSync() bound options are merged', () => testMergeEnv(execaSync));
test('execaNode() bound options are merged', () => testMergeEnv(execaNode));
test('$ bound options are merged', () => testMergeEnv($));
test('$.sync bound options are merged', () => testMergeEnv($.sync));

const testMergeMultiple = async execaMethod => {
	const {stdout} = await execaMethod({env: {FOO: 'baz'}})({env: {BAR: 'bar'}})(PRINT_ENV_PATH, {env: {FOO: 'foo'}});
	assert.equal(stdout, 'foo\nbar');
};

test('execa() bound options are merged multiple times', () => testMergeMultiple(execa));
test('execaSync() bound options are merged multiple times', () => testMergeMultiple(execaSync));
test('execaNode() bound options are merged multiple times', () => testMergeMultiple(execaNode));
test('$ bound options are merged multiple times', () => testMergeMultiple($));
test('$.sync bound options are merged multiple times', () => testMergeMultiple($.sync));

const testMergeFdSpecific = async execaMethod => {
	const {isMaxBuffer, shortMessage} = await assertRejects(execaMethod({maxBuffer: {stdout: 1}})(NOOP_PATH, [foobarString], {maxBuffer: {stderr: 100}}));
	assert.equal(isMaxBuffer, true);
	assert.ok(shortMessage.includes('Command\'s stdout was larger than 1'));
};

test('execa() bound options merge fd-specific ones', () => testMergeFdSpecific(execa));
test('execaNode() bound options merge fd-specific ones', () => testMergeFdSpecific(execaNode));
test('$ bound options merge fd-specific ones', () => testMergeFdSpecific($));

const testMergeEnvUndefined = async execaMethod => {
	const {stdout} = await execaMethod({env: {FOO: 'foo'}})(PRINT_ENV_PATH, {env: {BAR: undefined}});
	assert.equal(stdout, 'foo\nundefined');
};

test('execa() bound options are merged even if undefined', () => testMergeEnvUndefined(execa));
test('execaSync() bound options are merged even if undefined', () => testMergeEnvUndefined(execaSync));
test('execaNode() bound options are merged even if undefined', () => testMergeEnvUndefined(execaNode));
test('$ bound options are merged even if undefined', () => testMergeEnvUndefined($));
test('$.sync bound options are merged even if undefined', () => testMergeEnvUndefined($.sync));

const testMergeSpecific = async execaMethod => {
	const {stdout} = await execaMethod({stdout: {transform: uppercaseGenerator().transform, objectMode: true}})(NOOP_PATH, {stdout: {transform: uppercaseGenerator().transform}});
	assert.equal(stdout, foobarUppercase);
};

test('execa() bound options only merge specific ones', () => testMergeSpecific(execa));
test('execaSync() bound options only merge specific ones', () => testMergeSpecific(execaSync));
test('execaNode() bound options only merge specific ones', () => testMergeSpecific(execaNode));
test('$ bound options only merge specific ones', () => testMergeSpecific($));
test('$.sync bound options only merge specific ones', () => testMergeSpecific($.sync));
