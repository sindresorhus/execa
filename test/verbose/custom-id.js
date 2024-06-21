import test from 'ava';
import {setFixtureDirectory} from '../helpers/fixtures-directory.js';
import {QUOTE, runVerboseSubprocess} from '../helpers/verbose.js';

setFixtureDirectory();

const testVerboseCommandId = async (t, type, isSync) => {
	const {stderr} = await runVerboseSubprocess({isSync, type, eventProperty: 'commandId'});
	t.is(stderr, '0');
};

test('"verbose" function receives verboseObject.commandId, "command"', testVerboseCommandId, 'command', false);
test('"verbose" function receives verboseObject.commandId, "output"', testVerboseCommandId, 'output', false);
test('"verbose" function receives verboseObject.commandId, "ipc"', testVerboseCommandId, 'ipc', false);
test('"verbose" function receives verboseObject.commandId, "error"', testVerboseCommandId, 'error', false);
test('"verbose" function receives verboseObject.commandId, "duration"', testVerboseCommandId, 'duration', false);
test('"verbose" function receives verboseObject.commandId, "command", sync', testVerboseCommandId, 'command', true);
test('"verbose" function receives verboseObject.commandId, "output", sync', testVerboseCommandId, 'output', true);
test('"verbose" function receives verboseObject.commandId, "error", sync', testVerboseCommandId, 'error', true);
test('"verbose" function receives verboseObject.commandId, "duration", sync', testVerboseCommandId, 'duration', true);

const testVerboseEscapedCommand = async (t, type, isSync) => {
	const {stderr} = await runVerboseSubprocess({isSync, type, eventProperty: 'escapedCommand'});
	t.is(stderr, `noop-verbose.js ${QUOTE}. .${QUOTE}`);
};

test('"verbose" function receives verboseObject.escapedCommand, "command"', testVerboseEscapedCommand, 'command', false);
test('"verbose" function receives verboseObject.escapedCommand, "output"', testVerboseEscapedCommand, 'output', false);
test('"verbose" function receives verboseObject.escapedCommand, "ipc"', testVerboseEscapedCommand, 'ipc', false);
test('"verbose" function receives verboseObject.escapedCommand, "error"', testVerboseEscapedCommand, 'error', false);
test('"verbose" function receives verboseObject.escapedCommand, "duration"', testVerboseEscapedCommand, 'duration', false);
test('"verbose" function receives verboseObject.escapedCommand, "command", sync', testVerboseEscapedCommand, 'command', true);
test('"verbose" function receives verboseObject.escapedCommand, "output", sync', testVerboseEscapedCommand, 'output', true);
test('"verbose" function receives verboseObject.escapedCommand, "error", sync', testVerboseEscapedCommand, 'error', true);
test('"verbose" function receives verboseObject.escapedCommand, "duration", sync', testVerboseEscapedCommand, 'duration', true);
