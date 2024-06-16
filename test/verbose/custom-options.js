import test from 'ava';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {runVerboseSubprocess} from '../helpers/verbose.js';

setFixtureDirectory();

const testVerboseOptionsExplicit = async (t, type, isSync) => {
	const maxBuffer = 1000;
	const {stderr} = await runVerboseSubprocess({
		isSync,
		type,
		optionsFixture: 'custom-option.js',
		optionName: 'maxBuffer',
		maxBuffer,
	});
	t.is(stderr, `${maxBuffer}`);
};

test('"verbose" function receives verboseObject.options explicitly set, "command"', testVerboseOptionsExplicit, 'command', false);
test('"verbose" function receives verboseObject.options explicitly set, "output"', testVerboseOptionsExplicit, 'output', false);
test('"verbose" function receives verboseObject.options explicitly set, "ipc"', testVerboseOptionsExplicit, 'ipc', false);
test('"verbose" function receives verboseObject.options explicitly set, "error"', testVerboseOptionsExplicit, 'error', false);
test('"verbose" function receives verboseObject.options explicitly set, "duration"', testVerboseOptionsExplicit, 'duration', false);
test('"verbose" function receives verboseObject.options explicitly set, "command", sync', testVerboseOptionsExplicit, 'command', true);
test('"verbose" function receives verboseObject.options explicitly set, "output", sync', testVerboseOptionsExplicit, 'output', true);
test('"verbose" function receives verboseObject.options explicitly set, "error", sync', testVerboseOptionsExplicit, 'error', true);
test('"verbose" function receives verboseObject.options explicitly set, "duration", sync', testVerboseOptionsExplicit, 'duration', true);

const testVerboseOptionsDefault = async (t, type, isSync) => {
	const {stderr} = await runVerboseSubprocess({
		isSync,
		type,
		optionsFixture: 'custom-option.js',
		optionName: 'maxBuffer',
	});
	t.is(stderr, 'undefined');
};

test('"verbose" function receives verboseObject.options before default values and normalization, "command"', testVerboseOptionsDefault, 'command', false);
test('"verbose" function receives verboseObject.options before default values and normalization, "output"', testVerboseOptionsDefault, 'output', false);
test('"verbose" function receives verboseObject.options before default values and normalization, "ipc"', testVerboseOptionsDefault, 'ipc', false);
test('"verbose" function receives verboseObject.options before default values and normalization, "error"', testVerboseOptionsDefault, 'error', false);
test('"verbose" function receives verboseObject.options before default values and normalization, "duration"', testVerboseOptionsDefault, 'duration', false);
test('"verbose" function receives verboseObject.options before default values and normalization, "command", sync', testVerboseOptionsDefault, 'command', true);
test('"verbose" function receives verboseObject.options before default values and normalization, "output", sync', testVerboseOptionsDefault, 'output', true);
test('"verbose" function receives verboseObject.options before default values and normalization, "error", sync', testVerboseOptionsDefault, 'error', true);
test('"verbose" function receives verboseObject.options before default values and normalization, "duration", sync', testVerboseOptionsDefault, 'duration', true);
