import test from 'ava';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {foobarString} from '../helpers/input.js';
import {nestedSubprocess} from '../helpers/nested.js';
import {
	getOutputLine,
	getOutputLines,
	testTimestamp,
	getVerboseOption,
} from '../helpers/verbose.js';

setFixtureDirectory();

const testPipeOutput = async (t, parentFixture, sourceVerbose, destinationVerbose) => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {
		parentFixture,
		sourceOptions: getVerboseOption(sourceVerbose, 'full'),
		destinationFile: 'stdin.js',
		destinationOptions: getVerboseOption(destinationVerbose, 'full'),
	});

	const lines = getOutputLines(stderr);
	const id = sourceVerbose && destinationVerbose ? 1 : 0;
	t.deepEqual(lines, destinationVerbose
		? [`${testTimestamp} [${id}]   ${foobarString}`]
		: []);
};

test('Prints stdout if both verbose with .pipe("file")', testPipeOutput, 'nested-pipe-file.js', true, true);
test('Prints stdout if both verbose with .pipe`command`', testPipeOutput, 'nested-pipe-script.js', true, true);
test('Prints stdout if both verbose with .pipe(subprocess)', testPipeOutput, 'nested-pipe-subprocesses.js', true, true);
test('Prints stdout if only second verbose with .pipe("file")', testPipeOutput, 'nested-pipe-file.js', false, true);
test('Prints stdout if only second verbose with .pipe`command`', testPipeOutput, 'nested-pipe-script.js', false, true);
test('Prints stdout if only second verbose with .pipe(subprocess)', testPipeOutput, 'nested-pipe-subprocesses.js', false, true);
test('Does not print stdout if only first verbose with .pipe("file")', testPipeOutput, 'nested-pipe-file.js', true, false);
test('Does not print stdout if only first verbose with .pipe`command`', testPipeOutput, 'nested-pipe-script.js', true, false);
test('Does not print stdout if only first verbose with .pipe(subprocess)', testPipeOutput, 'nested-pipe-subprocesses.js', true, false);
test('Does not print stdout if neither verbose with .pipe("file")', testPipeOutput, 'nested-pipe-file.js', false, false);
test('Does not print stdout if neither verbose with .pipe`command`', testPipeOutput, 'nested-pipe-script.js', false, false);
test('Does not print stdout if neither verbose with .pipe(subprocess)', testPipeOutput, 'nested-pipe-subprocesses.js', false, false);

const testPrintOutputFixture = async (t, parentFixture) => {
	const {stderr} = await nestedSubprocess('noop.js', [foobarString], {parentFixture, verbose: 'full', unpipe: true});
	t.is(getOutputLine(stderr), `${testTimestamp} [0]   ${foobarString}`);
};

test('Prints stdout, .pipe(stream) + .unpipe()', testPrintOutputFixture, 'nested-pipe-stream.js');
test('Prints stdout, .pipe(subprocess) + .unpipe()', testPrintOutputFixture, 'nested-pipe-subprocess.js');
