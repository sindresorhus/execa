import test from 'ava';
import {execa} from '../../index.js';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {parentExeca} from '../helpers/nested.js';
import {
	getOutputLine,
	getOutputLines,
	testTimestamp,
	getVerboseOption,
} from '../helpers/verbose.js';

setFixtureDirectory();

const testPipeOutput = async (t, fixtureName, sourceVerbose, destinationVerbose) => {
	const {stderr} = await execa(`nested-pipe-${fixtureName}.js`, [
		JSON.stringify(getVerboseOption(sourceVerbose, 'full')),
		'noop.js',
		foobarString,
		JSON.stringify(getVerboseOption(destinationVerbose, 'full')),
		'stdin.js',
	]);

	const lines = getOutputLines(stderr);
	const id = sourceVerbose && destinationVerbose ? 1 : 0;
	t.deepEqual(lines, destinationVerbose
		? [`${testTimestamp} [${id}]   ${foobarString}`]
		: []);
};

test('Prints stdout if both verbose with .pipe("file")', testPipeOutput, 'file', true, true);
test('Prints stdout if both verbose with .pipe`command`', testPipeOutput, 'script', true, true);
test('Prints stdout if both verbose with .pipe(subprocess)', testPipeOutput, 'subprocesses', true, true);
test('Prints stdout if only second verbose with .pipe("file")', testPipeOutput, 'file', false, true);
test('Prints stdout if only second verbose with .pipe`command`', testPipeOutput, 'script', false, true);
test('Prints stdout if only second verbose with .pipe(subprocess)', testPipeOutput, 'subprocesses', false, true);
test('Does not print stdout if only first verbose with .pipe("file")', testPipeOutput, 'file', true, false);
test('Does not print stdout if only first verbose with .pipe`command`', testPipeOutput, 'script', true, false);
test('Does not print stdout if only first verbose with .pipe(subprocess)', testPipeOutput, 'subprocesses', true, false);
test('Does not print stdout if neither verbose with .pipe("file")', testPipeOutput, 'file', false, false);
test('Does not print stdout if neither verbose with .pipe`command`', testPipeOutput, 'script', false, false);
test('Does not print stdout if neither verbose with .pipe(subprocess)', testPipeOutput, 'subprocesses', false, false);

const testPrintOutputFixture = async (t, fixtureName, ...commandArguments) => {
	const {stderr} = await parentExeca(fixtureName, 'noop.js', [foobarString, ...commandArguments], {verbose: 'full'});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
};

test('Prints stdout, .pipe(stream) + .unpipe()', testPrintOutputFixture, 'nested-pipe-stream.js', 'true');
test('Prints stdout, .pipe(subprocess) + .unpipe()', testPrintOutputFixture, 'nested-pipe-subprocess.js', 'true');
