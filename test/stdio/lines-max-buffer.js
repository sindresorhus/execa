import test from 'ava';
import {execa, execaSync} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {simpleLines, noNewlinesChunks, getSimpleChunkSubprocessAsync} from '../helpers/lines.js';
import {assertErrorMessage} from '../helpers/max-buffer.js';

setFixtureDirectory();

const maxBuffer = simpleLines.length - 1;

const testBelowMaxBuffer = async (t, lines) => {
	const {isMaxBuffer, stdout} = await getSimpleChunkSubprocessAsync({lines, maxBuffer: maxBuffer + 1});
	t.false(isMaxBuffer);
	t.deepEqual(stdout, noNewlinesChunks);
};

test('"lines: true" can be below "maxBuffer"', testBelowMaxBuffer, true);
test('"lines: true" can be below "maxBuffer", fd-specific', testBelowMaxBuffer, {stdout: true});

const testAboveMaxBuffer = async (t, lines) => {
	const {isMaxBuffer, shortMessage, stdout} = await t.throwsAsync(getSimpleChunkSubprocessAsync({lines, maxBuffer}));
	t.true(isMaxBuffer);
	assertErrorMessage(t, shortMessage, {length: maxBuffer, unit: 'lines'});
	t.deepEqual(stdout, noNewlinesChunks.slice(0, maxBuffer));
};

test('"lines: true" can be above "maxBuffer"', testAboveMaxBuffer, true);
test('"lines: true" can be above "maxBuffer", fd-specific', testAboveMaxBuffer, {stdout: true});

const testMaxBufferUnit = async (t, lines) => {
	const {isMaxBuffer, shortMessage, stdout} = await t.throwsAsync(execa('noop-repeat.js', ['1', '...\n'], {lines, maxBuffer}));
	t.true(isMaxBuffer);
	assertErrorMessage(t, shortMessage, {length: maxBuffer, unit: 'lines'});
	t.deepEqual(stdout, ['...', '...']);
};

test('"maxBuffer" is measured in lines with "lines: true"', testMaxBufferUnit, true);
test('"maxBuffer" is measured in lines with "lines: true", fd-specific', testMaxBufferUnit, {stdout: true});

const testMaxBufferUnitSync = (t, lines) => {
	const {isMaxBuffer, shortMessage, stdout} = t.throws(() => {
		execaSync('noop-repeat.js', ['1', '...\n'], {lines, maxBuffer});
	}, {code: 'ENOBUFS'});
	t.true(isMaxBuffer);
	assertErrorMessage(t, shortMessage, {execaMethod: execaSync, length: maxBuffer});
	t.deepEqual(stdout, ['..']);
};

test('"maxBuffer" is measured in bytes with "lines: true", sync', testMaxBufferUnitSync, true);
test('"maxBuffer" is measured in bytes with "lines: true", fd-specific, sync', testMaxBufferUnitSync, {stdout: true});
