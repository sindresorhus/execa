import {on} from 'node:events';
import test from 'ava';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {parentExeca, parentExecaAsync, parentExecaSync} from '../helpers/nested.js';
import {getOutputLine, getOutputLines, testTimestamp} from '../helpers/verbose.js';

setFixtureDirectory();

test('Prints stdout one line at a time', async t => {
	const subprocess = parentExecaAsync('noop-progressive.js', [foobarString], {verbose: 'full'});

	for await (const chunk of on(subprocess.stderr, 'data')) {
		const outputLine = getOutputLine(chunk.toString().trim());
		if (outputLine !== undefined) {
			t.is(outputLine, `${testTimestamp} [0]   ${foobarString}`);
			break;
		}
	}

	await subprocess;
});

test.serial('Prints stdout progressively, interleaved', async t => {
	const subprocess = parentExeca('nested-double.js', 'noop-repeat.js', ['1', `${foobarString}\n`], {verbose: 'full'});

	let firstSubprocessPrinted = false;
	let secondSubprocessPrinted = false;
	for await (const chunk of on(subprocess.stderr, 'data')) {
		const outputLine = getOutputLine(chunk.toString().trim());
		if (outputLine === undefined) {
			continue;
		}

		if (outputLine.includes(foobarString)) {
			t.is(outputLine, `${testTimestamp} [0]   ${foobarString}`);
			firstSubprocessPrinted ||= true;
		} else {
			t.is(outputLine, `${testTimestamp} [1]   ${foobarString.toUpperCase()}`);
			secondSubprocessPrinted ||= true;
		}

		if (firstSubprocessPrinted && secondSubprocessPrinted) {
			break;
		}
	}

	subprocess.kill();
	await t.throwsAsync(subprocess);
});

const testInterleaved = async (t, expectedLines, execaMethod) => {
	const {stderr} = await execaMethod('noop-132.js', {verbose: 'full'});
	t.deepEqual(getOutputLines(stderr), expectedLines.map(line => `${testTimestamp} [0]   ${line}`));
};

test('Prints stdout + stderr interleaved', testInterleaved, [1, 2, 3], parentExecaAsync);
test('Prints stdout + stderr not interleaved, sync', testInterleaved, [1, 3, 2], parentExecaSync);
