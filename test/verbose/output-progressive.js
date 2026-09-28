import {on} from 'node:events';
import assert from 'node:assert/strict';
import test from 'node:test';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {nestedSubprocess, nestedInstance} from '../helpers/nested.js';
import {getOutputLine, getOutputLines, testTimestamp} from '../helpers/verbose.js';
import {assertRejects} from '../helpers/assert.js';
/* eslint-disable node-test/no-conditional-assertion -- shared helper functions are called from conditional paths on purpose */

setFixtureDirectory();

test('Prints stdout one line at a time', async () => {
	const subprocess = nestedInstance('noop-progressive.js', [foobarString], {verbose: 'full'});

	let outputLine;
	for await (const chunk of on(subprocess.stderr, 'data')) {
		outputLine = getOutputLine(chunk.toString().trim());
		if (outputLine !== undefined) {
			break;
		}
	}

	assert.equal(outputLine, `${testTimestamp} [0]   ${foobarString}`);
	await subprocess;
});

test('Prints stdout progressively, interleaved', async () => {
	const subprocess = nestedInstance('noop-repeat.js', ['1', `${foobarString}\n`], {parentFixture: 'nested-double.js', verbose: 'full'});

	let isFirstSubprocessPrinted = false;
	let isSecondSubprocessPrinted = false;
	for await (const chunk of on(subprocess.stderr, 'data')) {
		const outputLine = getOutputLine(chunk.toString().trim());
		if (outputLine === undefined) {
			continue;
		}

		if (outputLine.includes(foobarString)) {
			assert.equal(outputLine, `${testTimestamp} [0]   ${foobarString}`);
			isFirstSubprocessPrinted ||= true;
		} else {
			assert.equal(outputLine, `${testTimestamp} [1]   ${foobarString.toUpperCase()}`);
			isSecondSubprocessPrinted ||= true;
		}

		if (isFirstSubprocessPrinted && isSecondSubprocessPrinted) {
			break;
		}
	}

	subprocess.kill();
	await assertRejects(subprocess);
});

const testInterleaved = async (expectedLines, isSync) => {
	const {stderr} = await nestedSubprocess('noop-132.js', {verbose: 'full', isSync});
	assert.deepEqual(getOutputLines(stderr), expectedLines.map(line => `${testTimestamp} [0]   ${line}`));
};

test('Prints stdout + stderr interleaved', () => testInterleaved([1, 2, 3], false));
test('Prints stdout + stderr not interleaved, sync', () => testInterleaved([1, 3, 2], true));

/* eslint-enable node-test/no-conditional-assertion */
