import assert from 'node:assert/strict';
import test from 'node:test';
import {assertThrows, assertRejects} from '../helpers/assert.js';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {simpleLines, noNewlinesChunks, getSimpleChunkSubprocessAsync} from '../helpers/lines.js';
import {assertErrorMessage} from '../helpers/max-buffer.js';

setFixtureDirectory();

const maxBuffer = simpleLines.length - 1;

const testBelowMaxBuffer = async lines => {
	const {isMaxBuffer, stdout} = await getSimpleChunkSubprocessAsync({lines, maxBuffer: maxBuffer + 1});
	assert.equal(isMaxBuffer, false);
	assert.deepEqual(stdout, noNewlinesChunks);
};

test('"lines: true" can be below "maxBuffer"', () => testBelowMaxBuffer(true));
test('"lines: true" can be below "maxBuffer", fd-specific', () => testBelowMaxBuffer({stdout: true}));

const testAboveMaxBuffer = async lines => {
	const {isMaxBuffer, shortMessage, stdout} = await assertRejects(getSimpleChunkSubprocessAsync({lines, maxBuffer}));
	assert.equal(isMaxBuffer, true);
	assertErrorMessage(shortMessage, {length: maxBuffer, unit: 'lines'});
	assert.deepEqual(stdout, noNewlinesChunks.slice(0, maxBuffer));
};

test('"lines: true" can be above "maxBuffer"', () => testAboveMaxBuffer(true));
test('"lines: true" can be above "maxBuffer", fd-specific', () => testAboveMaxBuffer({stdout: true}));

const testMaxBufferUnit = async lines => {
	const {isMaxBuffer, shortMessage, stdout} = await assertRejects(execa('noop-repeat.js', ['1', '...\n'], {lines, maxBuffer}));
	assert.equal(isMaxBuffer, true);
	assertErrorMessage(shortMessage, {length: maxBuffer, unit: 'lines'});
	assert.deepEqual(stdout, ['...', '...']);
};

test('"maxBuffer" is measured in lines with "lines: true"', () => testMaxBufferUnit(true));
test('"maxBuffer" is measured in lines with "lines: true", fd-specific', () => testMaxBufferUnit({stdout: true}));

const testMaxBufferUnitSync = lines => {
	const {isMaxBuffer, shortMessage, stdout} = assertThrows(() => {
		execaSync('noop-repeat.js', ['1', '...\n'], {lines, maxBuffer});
	}, {code: 'ENOBUFS'});
	assert.equal(isMaxBuffer, true);
	assertErrorMessage(shortMessage, {execaMethod: execaSync, length: maxBuffer});
	assert.deepEqual(stdout, ['..']);
};

test('"maxBuffer" is measured in bytes with "lines: true", sync', () => testMaxBufferUnitSync(true));
test('"maxBuffer" is measured in bytes with "lines: true", fd-specific, sync', () => testMaxBufferUnitSync({stdout: true}));
