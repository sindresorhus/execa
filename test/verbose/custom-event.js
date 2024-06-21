import test from 'ava';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {runVerboseSubprocess} from '../helpers/verbose.js';

setFixtureDirectory();

const testVerboseType = async (t, type, isSync) => {
	const {stderr} = await runVerboseSubprocess({isSync, type, eventProperty: 'type'});
	t.is(stderr, type);
};

test('"verbose" function receives verboseObject.type "command"', testVerboseType, 'command', false);
test('"verbose" function receives verboseObject.type "output"', testVerboseType, 'output', false);
test('"verbose" function receives verboseObject.type "ipc"', testVerboseType, 'ipc', false);
test('"verbose" function receives verboseObject.type "error"', testVerboseType, 'error', false);
test('"verbose" function receives verboseObject.type "duration"', testVerboseType, 'duration', false);
test('"verbose" function receives verboseObject.type "command", sync', testVerboseType, 'command', true);
test('"verbose" function receives verboseObject.type "output", sync', testVerboseType, 'output', true);
test('"verbose" function receives verboseObject.type "error", sync', testVerboseType, 'error', true);
test('"verbose" function receives verboseObject.type "duration", sync', testVerboseType, 'duration', true);

const testVerboseTimestamp = async (t, type, isSync) => {
	const {stderr} = await runVerboseSubprocess({isSync, type, eventProperty: 'timestamp'});
	t.true(Number.isInteger(new Date(stderr).getTime()));
};

test('"verbose" function receives verboseObject.timestamp, "command"', testVerboseTimestamp, 'command', false);
test('"verbose" function receives verboseObject.timestamp, "output"', testVerboseTimestamp, 'output', false);
test('"verbose" function receives verboseObject.timestamp, "ipc"', testVerboseTimestamp, 'ipc', false);
test('"verbose" function receives verboseObject.timestamp, "error"', testVerboseTimestamp, 'error', false);
test('"verbose" function receives verboseObject.timestamp, "duration"', testVerboseTimestamp, 'duration', false);
test('"verbose" function receives verboseObject.timestamp, "command", sync', testVerboseTimestamp, 'command', true);
test('"verbose" function receives verboseObject.timestamp, "output", sync', testVerboseTimestamp, 'output', true);
test('"verbose" function receives verboseObject.timestamp, "error", sync', testVerboseTimestamp, 'error', true);
test('"verbose" function receives verboseObject.timestamp, "duration", sync', testVerboseTimestamp, 'duration', true);

const testVerbosePiped = async (t, type, isSync, expectedOutputs) => {
	const {stderr} = await runVerboseSubprocess({
		isSync,
		type,
		parentFixture: 'nested-pipe-verbose.js',
		destinationFile: 'noop-verbose.js',
		destinationArguments: ['. . .'],
		eventProperty: 'piped',
	});
	t.true(expectedOutputs.map(expectedOutput => expectedOutput.join('\n')).includes(stderr));
};

test('"verbose" function receives verboseObject.piped, "command"', testVerbosePiped, 'command', false, [[false, true]]);
test('"verbose" function receives verboseObject.piped, "output"', testVerbosePiped, 'output', false, [[true]]);
test('"verbose" function receives verboseObject.piped, "ipc"', testVerbosePiped, 'ipc', false, [[false, true], [true, false]]);
test('"verbose" function receives verboseObject.piped, "error"', testVerbosePiped, 'error', false, [[false, true], [true, false]]);
test('"verbose" function receives verboseObject.piped, "duration"', testVerbosePiped, 'duration', false, [[false, true], [true, false]]);
test('"verbose" function receives verboseObject.piped, "command", sync', testVerbosePiped, 'command', true, [[false, true]]);
test('"verbose" function receives verboseObject.piped, "output", sync', testVerbosePiped, 'output', true, [[true]]);
test('"verbose" function receives verboseObject.piped, "error", sync', testVerbosePiped, 'error', true, [[false, true], [true, false]]);
test('"verbose" function receives verboseObject.piped, "duration", sync', testVerbosePiped, 'duration', true, [[false, true], [true, false]]);
