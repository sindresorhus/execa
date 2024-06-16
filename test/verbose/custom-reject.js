import test from 'ava';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {runVerboseSubprocess} from '../helpers/verbose.js';
import {earlyErrorOptions, earlyErrorOptionsSync} from '../helpers/early-error.js';

setFixtureDirectory();

// eslint-disable-next-line max-params
const testVerboseReject = async (t, type, options, isSync, expectedOutput) => {
	const {stderr} = await runVerboseSubprocess({
		isSync,
		type,
		optionsFixture: 'custom-option.js',
		optionName: 'reject',
		...options,
	});
	t.is(stderr, expectedOutput.map(String).join('\n'));
};

test('"verbose" function receives verboseObject.options.reject, "command"', testVerboseReject, 'command', {}, false, [undefined]);
test('"verbose" function receives verboseObject.options.reject, "output"', testVerboseReject, 'output', {}, false, [undefined]);
test('"verbose" function receives verboseObject.options.reject, "ipc"', testVerboseReject, 'ipc', {}, false, [undefined]);
test('"verbose" function receives verboseObject.options.reject, "error"', testVerboseReject, 'error', {}, false, [undefined]);
test('"verbose" function receives verboseObject.options.reject, "duration"', testVerboseReject, 'duration', {}, false, [undefined]);
test('"verbose" function receives verboseObject.options.reject, "command", spawn error', testVerboseReject, 'command', earlyErrorOptions, false, [undefined]);
test('"verbose" function receives verboseObject.options.reject, "output", spawn error', testVerboseReject, 'output', earlyErrorOptions, false, []);
test('"verbose" function receives verboseObject.options.reject, "ipc", spawn error', testVerboseReject, 'ipc', earlyErrorOptions, false, []);
test('"verbose" function receives verboseObject.options.reject, "error", spawn error', testVerboseReject, 'error', earlyErrorOptions, false, [undefined, undefined]);
test('"verbose" function receives verboseObject.options.reject, "duration", spawn error', testVerboseReject, 'duration', earlyErrorOptions, false, [undefined]);
test('"verbose" function receives verboseObject.options.reject, "command", sync', testVerboseReject, 'command', {}, true, [undefined]);
test('"verbose" function receives verboseObject.options.reject, "output", sync', testVerboseReject, 'output', {}, true, [undefined]);
test('"verbose" function receives verboseObject.options.reject, "error", sync', testVerboseReject, 'error', {}, true, [undefined]);
test('"verbose" function receives verboseObject.options.reject, "duration", sync', testVerboseReject, 'duration', {}, true, [undefined]);
test('"verbose" function receives verboseObject.options.reject, "command", spawn error, sync', testVerboseReject, 'command', earlyErrorOptionsSync, true, [undefined]);
test('"verbose" function receives verboseObject.options.reject, "output", spawn error, sync', testVerboseReject, 'output', earlyErrorOptionsSync, true, []);
test('"verbose" function receives verboseObject.options.reject, "error", spawn error, sync', testVerboseReject, 'error', earlyErrorOptionsSync, true, [undefined, undefined]);
test('"verbose" function receives verboseObject.options.reject, "duration", spawn error, sync', testVerboseReject, 'duration', earlyErrorOptionsSync, true, [undefined]);
